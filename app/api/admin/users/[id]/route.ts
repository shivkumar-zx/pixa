import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { userUpdateSchema } from "@/lib/validations/user"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const adminUserUpdateSchema = userUpdateSchema.extend({
  quotaDelta: z.number().optional(), // allow relative adjustment in bytes (+ or -)
  allowBelowUsed: z.boolean().optional(), // whether admin explicitly confirmed reducing below used
})

function formatBytes(bytes: bigint | number): string {
  const b = Number(bytes)
  if (b <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = adminUserUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, role, isActive, storageQuota, quotaDelta, allowBelowUsed } = parsed.data

    let newQuota = targetUser.storageQuota

    // Handle relative adjustment (increase/decrease)
    if (quotaDelta !== undefined && quotaDelta !== null) {
      const currentQuotaNum = Number(targetUser.storageQuota)
      const calculated = currentQuotaNum + quotaDelta
      if (calculated <= 0) {
        return NextResponse.json({ error: "Quota must be greater than 0 bytes" }, { status: 400 })
      }
      newQuota = BigInt(Math.floor(calculated))
    } else if (storageQuota !== undefined && storageQuota !== null) {
      // Handle absolute set
      if (storageQuota <= 0) {
        return NextResponse.json({ error: "Quota must be greater than 0 bytes" }, { status: 400 })
      }
      newQuota = BigInt(Math.floor(storageQuota))
    }

    // Protection check: If decreasing below currently used storage
    if (newQuota < targetUser.storageUsed && !allowBelowUsed) {
      return NextResponse.json(
        {
          error: `Cannot decrease quota to ${formatBytes(newQuota)}. User currently occupies ${formatBytes(targetUser.storageUsed)} of storage.`,
          requiresConfirmation: true,
          currentUsed: Number(targetUser.storageUsed),
          attemptedQuota: Number(newQuota),
        },
        { status: 409 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        storageQuota: newQuota,
      },
      include: {
        _count: { select: { files: true } },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        storageUsed: Number(updatedUser.storageUsed),
        storageQuota: Number(updatedUser.storageQuota),
        fileCount: updatedUser._count.files,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
