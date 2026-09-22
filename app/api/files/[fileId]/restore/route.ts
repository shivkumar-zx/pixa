import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: { fileId: string } }) {
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

    await prisma.$transaction(async (tx) => {
      await tx.file.update({
        where: { id: file.id },
        data: {
          status: "ACTIVE",
          deletedAt: null
        }
      })

      await tx.activityLog.create({
        data: {
          action: "RESTORE",
          userId: userId,
          fileId: file.id,
          metadata: JSON.stringify({ originalName: file.originalName })
        }
      })
    })

    return NextResponse.json({ success: true, message: "File restored successfully" })
  } catch (error: any) {
    console.error("Restore file error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
