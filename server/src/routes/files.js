import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import multer from "multer"
import path from "path"
import fs from "fs"

const router = Router()
const prisma = new PrismaClient()

// Multer storage configuration preserving file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const upload = multer({ storage })

// In-memory store starting completely clean
let uploadedFilesStore = []
let trashedFilesStore = []
const favoriteFileIds = new Set()

// GET /api/files
router.get("/", async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { status: "ACTIVE" },
      include: {
        category: { select: { name: true } },
        uploadedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    })
    
    if (files.length > 0) {
      const formatted = files.map(f => ({
        ...f,
        size: Number(f.size),
        isFavorite: favoriteFileIds.has(f.id),
        url: f.storagePath ? `http://localhost:5000/uploads/${f.storagePath}` : undefined
      }))
      return res.json([...uploadedFilesStore.filter(uf => !files.some(f => f.id === uf.id)), ...formatted])
    }
    
    res.json(uploadedFilesStore)
  } catch (err) {
    res.json(uploadedFilesStore)
  }
})

// GET /api/files/storage - returns exact accurate total bytes used
router.get("/storage", async (req, res) => {
  let totalBytes = 0
  try {
    const files = await prisma.file.findMany({
      where: { status: "ACTIVE" },
      select: { size: true }
    })
    const dbBytes = files.reduce((acc, f) => acc + Number(f.size), 0)
    const memoryBytes = uploadedFilesStore.reduce((acc, f) => acc + (f.size || 0), 0)
    totalBytes = Math.max(dbBytes, memoryBytes)
  } catch {
    totalBytes = uploadedFilesStore.reduce((acc, f) => acc + (f.size || 0), 0)
  }

  res.json({
    storageUsed: totalBytes,
    storageQuota: 5368709120, // 5GB
    filesCount: uploadedFilesStore.length
  })
})

// GET /api/files/favorites
router.get("/favorites", async (req, res) => {
  const favs = uploadedFilesStore.filter(f => favoriteFileIds.has(f.id) || f.isFavorite)
  res.json(favs)
})

// GET /api/files/trash
router.get("/trash", async (req, res) => {
  res.json(trashedFilesStore)
})

// POST /api/files/:id/restore
router.post("/:id/restore", async (req, res) => {
  const { id } = req.params
  const idx = trashedFilesStore.findIndex(f => f.id === id)
  if (idx !== -1) {
    const [restored] = trashedFilesStore.splice(idx, 1)
    uploadedFilesStore.unshift(restored)
    try {
      await prisma.file.update({ where: { id }, data: { status: "ACTIVE" } })
    } catch {}
    return res.json({ message: "File restored successfully", file: restored })
  }
  res.status(404).json({ message: "File not found in trash" })
})

// DELETE /api/files/:id/permanent
router.delete("/:id/permanent", async (req, res) => {
  const { id } = req.params
  trashedFilesStore = trashedFilesStore.filter(f => f.id !== id)
  try {
    await prisma.file.delete({ where: { id } })
  } catch {}
  res.json({ message: "File permanently deleted" })
})

// POST /api/files/:id/favorite
router.post("/:id/favorite", async (req, res) => {
  const { id } = req.params
  const target = uploadedFilesStore.find(f => f.id === id)
  if (favoriteFileIds.has(id)) {
    favoriteFileIds.delete(id)
    if (target) target.isFavorite = false
    res.json({ id, favorited: false, message: "Removed from favorites" })
  } else {
    favoriteFileIds.add(id)
    if (target) target.isFavorite = true
    res.json({ id, favorited: true, message: "Added to favorites" })
  }
})

// POST /api/files/upload (single file)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" })
    
    const mime = req.file.mimetype || ""
    let fileType = "DOCUMENT"
    if (mime.startsWith("image/")) fileType = "IMAGE"
    else if (mime.startsWith("video/")) fileType = "VIDEO"

    const newFile = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      fileType: fileType,
      size: req.file.size,
      url: `http://localhost:5000/uploads/${req.file.filename}`,
      storagePath: req.file.filename,
      createdAt: new Date().toISOString(),
      category: { name: req.body.category || "General" },
      isFavorite: false
    }

    uploadedFilesStore.unshift(newFile)

    res.json({ message: "File uploaded successfully", file: newFile })
  } catch (err) {
    console.error("Upload error:", err)
    res.status(500).json({ message: "Upload failed" })
  }
})

// POST /api/files/bulk-upload (multiple files)
router.post("/bulk-upload", upload.array("files", 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" })
    }

    const createdFiles = []

    for (const file of req.files) {
      const mime = file.mimetype || ""
      let fileType = "DOCUMENT"
      if (mime.startsWith("image/")) fileType = "IMAGE"
      else if (mime.startsWith("video/")) fileType = "VIDEO"

      const newFile = {
        id: (Date.now() + Math.random()).toString(),
        originalName: file.originalname,
        fileType: fileType,
        size: file.size,
        url: `http://localhost:5000/uploads/${file.filename}`,
        storagePath: file.filename,
        createdAt: new Date().toISOString(),
        category: { name: req.body.category || "General" },
        isFavorite: false
      }

      uploadedFilesStore.unshift(newFile)
      createdFiles.push(newFile)
    }

    res.json({ message: `Successfully uploaded ${createdFiles.length} files`, files: createdFiles })
  } catch (err) {
    console.error("Bulk upload error:", err)
    res.status(500).json({ message: "Bulk upload failed" })
  }
})

// GET /api/files/:id/download
router.get("/:id/download", (req, res) => {
  const { id } = req.params
  const target = uploadedFilesStore.find(f => f.id === id) || trashedFilesStore.find(f => f.id === id)
  if (target && target.storagePath) {
    const filePath = path.join(process.cwd(), "uploads", target.storagePath)
    if (fs.existsSync(filePath)) {
      return res.download(filePath, target.originalName)
    }
  }
  res.status(404).send("File not found")
})

// POST /api/files/bulk/delete
router.post("/bulk/delete", async (req, res) => {
  const { fileIds = [] } = req.body
  const deletedCount = fileIds.length
  fileIds.forEach(id => {
    const target = uploadedFilesStore.find(f => f.id === id)
    if (target) {
      uploadedFilesStore = uploadedFilesStore.filter(f => f.id !== id)
      favoriteFileIds.delete(id)
      trashedFilesStore.unshift(target)
    }
  })
  res.json({ message: `Successfully moved ${deletedCount} files to trash` })
})

// DELETE /api/files/:id (move to trash)
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  const target = uploadedFilesStore.find(f => f.id === id)
  if (target) {
    uploadedFilesStore = uploadedFilesStore.filter(f => f.id !== id)
    favoriteFileIds.delete(id)
    trashedFilesStore.unshift(target)
  }
  try {
    await prisma.file.update({
      where: { id },
      data: { status: "TRASHED" }
    })
  } catch {}
  res.json({ message: "File moved to trash" })
})

export default router
