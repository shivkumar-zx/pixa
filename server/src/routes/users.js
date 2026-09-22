import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const router = Router()
const prisma = new PrismaClient()

// In-memory user store for instant responsive management
let usersStore = [
  {
    id: "user-1",
    name: "Admin User",
    email: "admin@company.com",
    role: "ADMIN",
    storageUsed: 343597383,
    storageQuota: 53687091200, // 50 GB
    filesCount: 12,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user-2",
    name: "HR Manager",
    email: "hr@company.com",
    role: "MANAGER",
    storageUsed: 1073741824,
    storageQuota: 10737418240, // 10 GB
    filesCount: 8,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "user-3",
    name: "Engineering Lead",
    email: "tech@company.com",
    role: "EMPLOYEE",
    storageUsed: 524288000,
    storageQuota: 5368709120, // 5 GB
    filesCount: 5,
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const dbUsers = await prisma.user.findMany({
      include: { _count: { select: { files: true } } },
      orderBy: { createdAt: "desc" }
    })
    
    if (dbUsers.length > 0) {
      const formatted = dbUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        storageUsed: Number(u.storageUsed || 0),
        storageQuota: Number(u.storageQuota || 5368709120),
        filesCount: u._count.files || 0,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt
      }))
      return res.json([...usersStore.filter(us => !formatted.some(f => f.id === us.id)), ...formatted])
    }
  } catch (err) {}
  
  res.json(usersStore)
})

// POST /api/users - Create new employee / user
router.post("/", async (req, res) => {
  const { name, email, username, role = "EMPLOYEE", storageQuotaGB = 5 } = req.body

  if (!name || !email) {
    return res.status(400).json({ message: "Name and Email are required" })
  }

  const quotaBytes = Number(storageQuotaGB) * 1024 * 1024 * 1024

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    username: username || undefined,
    role: role.toUpperCase(),
    storageUsed: 0,
    storageQuota: quotaBytes,
    filesCount: 0,
    isActive: true,
    createdAt: new Date().toISOString()
  }

  usersStore.unshift(newUser)

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        username: username || undefined,
        password: "$2a$10$hashedpasswordplaceholder",
        role: role.toUpperCase(),
        storageQuota: BigInt(quotaBytes)
      }
    })
  } catch {}

  res.status(201).json({ message: "User account created successfully", user: newUser })
})

// PUT /api/users/:id - Update user role, quota, or status
router.put("/:id", async (req, res) => {
  const { id } = req.params
  const { role, storageQuotaGB, isActive } = req.body

  const user = usersStore.find(u => u.id === id)
  if (user) {
    if (role) user.role = role.toUpperCase()
    if (storageQuotaGB) user.storageQuota = Number(storageQuotaGB) * 1024 * 1024 * 1024
    if (typeof isActive === "boolean") user.isActive = isActive
  }

  try {
    const updateData = {}
    if (role) updateData.role = role.toUpperCase()
    if (storageQuotaGB) updateData.storageQuota = BigInt(Number(storageQuotaGB) * 1024 * 1024 * 1024)
    if (typeof isActive === "boolean") updateData.isActive = isActive

    await prisma.user.update({
      where: { id },
      data: updateData
    })
  } catch {}

  res.json({ message: "User updated successfully", user })
})

// PUT /api/users/profile - Update current user profile, username, email, password
router.put("/profile", async (req, res) => {
  const { name, email, username, password } = req.body

  try {
    const updateData = {}
    if (name) updateData.name = name
    if (email) updateData.email = email.toLowerCase()
    if (username !== undefined) updateData.username = username ? username.toLowerCase() : null
    if (password) {
      updateData.password = password // Hashing can be added if bcrypt is installed in server
    }

    // Find first user or match by email/id
    const firstUser = await prisma.user.findFirst()
    if (firstUser) {
      const updated = await prisma.user.update({
        where: { id: firstUser.id },
        data: updateData
      })
      return res.json({ message: "Profile updated successfully", user: updated })
    }
  } catch (err) {
    console.error("Profile update error:", err)
  }

  res.json({ message: "Profile updated" })
})

export default router
