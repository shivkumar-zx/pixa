import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { deleteStorageFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, { params }: { params: { fileId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = (session.user as any).role

    const file = await prisma.file.findUnique({
      where: { id: params.fileId }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (file.uploadedById !== userId && userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Permanently remove file record & update quota
    await prisma.$transaction(async (tx) => {
      // Decrement storage quota
      await tx.user.update({
        where: { id: file.uploadedById },
        data: {
          storageUsed: { decrement: file.size }
        }
      })

      // Delete file shares
      await tx.fileShare.deleteMany({ where: { fileId: file.id } })

      // Delete favorites
      await tx.favorite.deleteMany({ where: { fileId: file.id } })

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "DELETE",
          userId: userId,
          metadata: JSON.stringify({ originalName: file.originalName, permanent: true })
        }
      })

      // Delete file record
      await tx.file.delete({ where: { id: file.id } })
    })

    // Delete file from disk/storage
    await deleteStorageFile(file.bucketName, file.storagePath)

    return NextResponse.json({ success: true, message: "File permanently purged" })
  } catch (error: any) {
    console.error("Purge file error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
