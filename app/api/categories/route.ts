import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/categories - Fetch user folders
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const role = (session.user as any).role

    // Fetch user-created folders (or all folders if ADMIN/MANAGER)
    const folders = await prisma.category.findMany({
      where: role === "ADMIN" || role === "MANAGER"
        ? { isActive: true }
        : { createdById: userId, isActive: true },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(folders)
  } catch (error: any) {
    console.error("Fetch folders error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/categories - Create new user folder
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const body = await req.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const cleanName = name.trim()
    const slug = `${cleanName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now().toString(36)}`

    const folder = await prisma.category.create({
      data: {
        name: cleanName,
        description: description?.trim() || null,
        slug,
        createdById: userId,
        isActive: true,
        allowedRoles: JSON.stringify([]),
      },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { files: true } },
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error: any) {
    console.error("Create folder error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/categories - Delete a user folder
export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const role = (session.user as any).role
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Missing folder id" }, { status: 400 })

    const folder = await prisma.category.findUnique({ where: { id } })
    if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 })

    // Only folder owner or Admin can delete
    if (folder.createdById !== userId && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You can only delete folders created by you." }, { status: 403 })
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Folder deleted" })
  } catch (error: any) {
    console.error("Delete folder error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
