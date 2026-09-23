import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { fileIds } = body

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ files: [] })
    }

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        status: "ACTIVE",
        uploadedById: session.user.id
      },
      select: {
        id: true,
        originalName: true,
        fileType: true,
        mimeType: true,
        bucketName: true,
        storagePath: true,
        size: true
      }
    })

    const safeFiles = files.map(f => ({
      id: f.id,
      originalName: f.originalName,
      fileType: f.fileType,
      mimeType: f.mimeType,
      bucketName: f.bucketName,
      storagePath: f.storagePath,
      size: Number(f.size)
    }))

    return NextResponse.json({ files: safeFiles })
  } catch (error: any) {
    console.error("Bulk info error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
