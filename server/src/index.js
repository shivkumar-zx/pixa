import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import authRoutes from "./routes/auth.js"
import fileRoutes from "./routes/files.js"
import userRoutes from "./routes/users.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/users", userRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PixBox Express Backend Running" })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
