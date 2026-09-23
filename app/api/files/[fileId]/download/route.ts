import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

function getAccurateMime(fileName: string, dbMime?: string): string {
  if (dbMime && dbMime !== "application/octet-stream") return dbMime
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg'
  }
  return map[ext] || 'application/octet-stream'
}

export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const file = await prisma.file.findUnique({
      where: { id: params.fileId }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Increment download count in background
    await prisma.file.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } }
    }).catch(console.error)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DOWNLOAD",
        userId: session.user.id,
        fileId: file.id,
        metadata: JSON.stringify({ bucket: file.bucketName })
      }
    }).catch(console.error)

    const accurateMime = getAccurateMime(file.originalName, file.mimeType)

    // 1. Fallback for local development (if file exists on disk)
    const filePath = path.join(process.cwd(), "public", "uploads", file.bucketName, file.storagePath)
    if (fs.existsSync(filePath)) {
      const fileStream = fs.createReadStream(filePath)
      const stat = fs.statSync(filePath)
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', chunk => controller.enqueue(chunk))
          fileStream.on('end', () => controller.close())
          fileStream.on('error', err => controller.error(err))
        }
      })

      return new NextResponse(webStream as any, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          "Content-Type": accurateMime,
          "Content-Length": stat.size.toString(),
          "Cache-Control": "no-transform, public, max-age=86400",
        }
      })
    }

    // 2. Fetch from Hostinger storage with uncompressed original bytes
    const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || "https://pixboximg.webstaging.in"
    const fileUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${file.bucketName}/${file.storagePath}`

    // Request with identity encoding to prevent Hostinger LiteSpeed/CDN from compressing (GZIP/Brotli)
    const hostingerRes = await fetch(fileUrl, {
      headers: {
        "Accept-Encoding": "identity",
      }
    })

    if (!hostingerRes.ok) {
      console.error(`Download fetch failed (${hostingerRes.status}): ${fileUrl}`)
      return NextResponse.json({ error: "File not found on storage" }, { status: 404 })
    }

    // Read full uncompressed array buffer
    const arrayBuffer = await hostingerRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const headers = new Headers()
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`)
    headers.set("Content-Type", accurateMime)
    headers.set("Content-Length", buffer.length.toString())
    headers.set("Cache-Control", "no-transform, public, max-age=86400")

    return new NextResponse(buffer, { headers })

  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
