import fs from "fs"
import path from "path"

export function getBucketForMimeType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "pixbox-images"
  if (mimeType.startsWith("video/")) return "pixbox-videos"
  return "pixbox-documents"
}

export function generateStoragePath(userId: string, storedName: string): string {
  return `${userId}/${storedName}`
}

export async function getSignedUploadUrl(bucket: string, storagePath: string, expiresIn = 300, contentType?: string): Promise<string> {
  const baseUrl = (process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || "https://pixboximg.webstaging.in").replace(/\/$/, '')
  const hostingerUrl = (process.env.HOSTINGER_API_URL || `${baseUrl}/api.php`).trim()
  const hostingerSecret = (process.env.HOSTINGER_API_SECRET || "pixbox_secure_upload_key_123!").replace(/['"\s]/g, '')

  // Direct upload URL to Hostinger - Completely bypasses Vercel 4.5MB payload limit!
  return `${hostingerUrl}?key=${encodeURIComponent(hostingerSecret)}&bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(storagePath)}`
}

export async function getSignedDownloadUrl(bucket: string, storagePath: string, expiresIn = 900): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || "https://pixboximg.webstaging.in"
  return `${baseUrl}/uploads/${bucket}/${storagePath}`
}

export async function deleteStorageFile(bucket: string, storagePath: string): Promise<void> {
  try {
    const hostingerUrl = process.env.HOSTINGER_API_URL
    const hostingerSecret = process.env.HOSTINGER_API_SECRET
    
    if (hostingerUrl && hostingerSecret) {
      const targetUrl = `${hostingerUrl}?key=${hostingerSecret}&bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(storagePath)}`
      await fetch(targetUrl, { method: "DELETE" })
    } else {
      // Fallback for local development
      const fullPath = path.join(process.cwd(), "public", "uploads", bucket, storagePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }
  } catch (error: any) {
    console.error(`Delete Error: ${error.message}`)
  }
}
