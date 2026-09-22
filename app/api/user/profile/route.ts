import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/user/profile - Get current user profile details
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        storageUsed: true,
        storageQuota: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...user,
        storageUsed: Number(user.storageUsed),
        storageQuota: Number(user.storageQuota),
      },
    })
  } catch (error: any) {
    console.error("Fetch profile error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// PUT /api/user/profile - Update current user profile, username, email, password
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { name, email, username, currentPassword, newPassword, avatar } = body

    // Fetch existing user record
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: any = {}

    // 1. Name update
    if (name && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim()
    }

    // 2. Email update & validation
    if (email && typeof email === "string" && email.trim().length > 0) {
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail !== currentUser.email) {
        const existingEmail = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            id: { not: userId },
          },
        })
        if (existingEmail) {
          return NextResponse.json({ error: "This email address is already in use by another account." }, { status: 409 })
        }
        updateData.email = cleanEmail
      }
    }

    // 3. Username update & validation
    if (username !== undefined) {
      const cleanUsername = typeof username === "string" && username.trim() ? username.trim().toLowerCase() : null
      if (cleanUsername !== currentUser.username) {
        if (cleanUsername) {
          const existingUsername = await prisma.user.findFirst({
            where: {
              username: cleanUsername,
              id: { not: userId },
            },
          })
          if (existingUsername) {
            return NextResponse.json({ error: "This username is already taken. Please choose another." }, { status: 409 })
          }
        }
        updateData.username = cleanUsername
      }
    }

    // 4. Avatar update
    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    // 5. Password update & verification
    if (newPassword && typeof newPassword === "string" && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 })
      }

      // If user has existing password, verify currentPassword
      if (currentUser.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 })
        }
        const isValid = await bcrypt.compare(currentPassword, currentUser.password)
        if (!isValid) {
          return NextResponse.json({ error: "Incorrect current password." }, { status: 400 })
        }
      }

      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)
      updateData.password = hashedPassword
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected.", user: currentUser })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        storageUsed: true,
        storageQuota: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        ...updatedUser,
        storageUsed: Number(updatedUser.storageUsed),
        storageQuota: Number(updatedUser.storageQuota),
      },
    })
  } catch (error: any) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
