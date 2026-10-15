import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import JSZip from "jszip"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { fileIds } = await req.json()
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return new NextResponse("Invalid file list", { status: 400 })
    }

    const userId = session.user.id
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        status: "ACTIVE",
        uploadedById: userId,
      }
    })

    if (files.length === 0) {
      return new NextResponse("No files found", { status: 404 })
    }

    const zip = new JSZip()
    const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || "https://pixboximg.webstaging.in"
    const hostingerUrl = process.env.HOSTINGER_API_URL || `${baseUrl.replace(/\/$/, '')}/api.php`
    const hostingerSecret = process.env.HOSTINGER_API_SECRET || "pixbox_secure_upload_key_123!"

    for (const file of files) {
      // 1. Check local disk
      const localPath = path.join(process.cwd(), "public", "uploads", file.bucketName, file.storagePath)
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath)
        zip.file(file.originalName, buffer)
        continue
      }

      // 2. Fetch from Hostinger via uncompressed binary api.php
      const apiDownloadUrl = `${hostingerUrl}?key=${encodeURIComponent(hostingerSecret)}&action=download&bucket=${encodeURIComponent(file.bucketName)}&path=${encodeURIComponent(file.storagePath)}&filename=${encodeURIComponent(file.originalName)}`

      try {
        let res = await fetch(apiDownloadUrl, {
          headers: {
            "Accept-Encoding": "identity",
            "Cache-Control": "no-transform",
          },
          cache: "no-store",
        })

        if (!res.ok) {
          const staticUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${file.bucketName}/${file.storagePath}`
          res = await fetch(staticUrl, {
            headers: {
              "Accept-Encoding": "identity",
              "Cache-Control": "no-transform",
            },
            cache: "no-store",
          })
        }

        if (res.ok) {
          const arrayBuf = await res.arrayBuffer()
          zip.file(file.originalName, Buffer.from(arrayBuf), { binary: true })
        }
      } catch (err) {
        console.error(`Failed to include file ${file.id} in zip:`, err)
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBuffer as any, {
      headers: {
        "Content-Disposition": `attachment; filename="pixbox-download-${Date.now()}.zip"`,
        "Content-Type": "application/zip",
        "Content-Length": zipBuffer.length.toString(),
        "Cache-Control": "no-transform, no-cache",
      }
    })
  } catch (error: any) {
    console.error("Bulk download error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
