import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { userCreateSchema } from "@/lib/validations/user"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { files: true } },
      },
    })

    const serializedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      isActive: u.isActive,
      storageUsed: Number(u.storageUsed),
      storageQuota: Number(u.storageQuota),
      fileCount: u._count.files,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))

    return NextResponse.json({ users: serializedUsers })
  } catch (error: any) {
    console.error("Fetch users error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = userCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, username, name, role, password, storageQuota } = parsed.data

    const cleanUsername = username && username.trim() ? username.trim().toLowerCase() : null

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(cleanUsername ? [{ username: cleanUsername }] : [])
        ]
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 })
    }

    const rawPassword = password && password.trim() ? password.trim() : "Welcome@123"
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    // Default 5GB = 5368709120 bytes if not provided
    const quotaInBytes = storageQuota ? BigInt(Math.floor(storageQuota)) : BigInt(5368709120)

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: cleanUsername,
        name,
        role: role ?? "EMPLOYEE",
        password: hashedPassword,
        storageQuota: quotaInBytes,
        storageUsed: BigInt(0),
        isActive: true,
      },
      include: {
        _count: { select: { files: true } },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        storageUsed: Number(newUser.storageUsed),
        storageQuota: Number(newUser.storageQuota),
        fileCount: newUser._count.files,
        createdAt: newUser.createdAt,
      },
      temporaryPassword: password ? undefined : rawPassword,
    })
  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
