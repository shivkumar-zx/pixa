import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bucket = searchParams.get("bucket")
    const filePath = searchParams.get("path")

    if (!bucket || !filePath) {
      return new NextResponse("Missing bucket or path", { status: 400 })
    }

    const hostingerUrl = process.env.HOSTINGER_API_URL
    const hostingerSecret = process.env.HOSTINGER_API_SECRET

    if (!hostingerUrl || !hostingerSecret) {
      // Fallback for local dev if not configured
      const fullPath = path.join(process.cwd(), "public", "uploads", bucket, filePath)
      const dir = path.dirname(fullPath)

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const buffer = Buffer.from(await req.arrayBuffer())
      fs.writeFileSync(fullPath, buffer)

      return new NextResponse("OK", { status: 200 })
    }

    const buffer = await req.arrayBuffer()
    
    // Forward to Hostinger PHP script
    const targetUrl = `${hostingerUrl}?key=${hostingerSecret}&bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(filePath)}`
    
    const response = await fetch(targetUrl, {
      method: "POST",
      body: buffer,
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error("Hostinger Upload Error:", errText)
        return new NextResponse("Hostinger upload failed", { status: response.status })
    }

    return new NextResponse("OK", { status: 200 })
  } catch (err: any) {
    console.error("Local upload error:", err)
    return new NextResponse(err.message || "Internal Server Error", { status: 500 })
  }
}
