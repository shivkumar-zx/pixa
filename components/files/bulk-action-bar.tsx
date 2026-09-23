"use client"

import React, { useState } from "react"
import { useBulkAction } from "./bulk-action-provider"
import { Download, Trash2, FolderOutput, X, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface BulkActionFile {
  id: string
  originalName: string
  fileType?: string
  mimeType?: string
  bucketName?: string
  storagePath?: string
  size?: number | bigint
}

interface BulkActionBarProps {
  files?: BulkActionFile[]
}

export function BulkActionBar({ files = [] }: BulkActionBarProps) {
  const { selectedFiles, clearSelection } = useBulkAction()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false)

  if (selectedFiles.size === 0) return null

  const count = selectedFiles.size

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const res = await fetch("/api/files/bulk/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) })
      })

      if (!res.ok) throw new Error("Download failed")

      // Trigger download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bulk-download-${new Date().getTime()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Download started")
      clearSelection()
    } catch (error) {
      toast.error("Failed to download files")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${count} files?`)) return

    try {
      setIsDeleting(true)
      const res = await fetch("/api/files/bulk/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) })
      })

      if (!res.ok) throw new Error("Delete failed")

      toast.success(`Successfully deleted ${count} files`)
      clearSelection()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete files")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMove = () => {
    toast.info("Bulk move is coming soon!")
  }

  const handleWhatsAppShare = async () => {
    setIsSharingWhatsApp(true)
    try {
      // 1. Gather file metadata for selected files
      const selectedMap = new Map(files.map(f => [f.id, f]))
      const foundFiles: BulkActionFile[] = Array.from(selectedFiles)
        .map(id => selectedMap.get(id))
        .filter(Boolean) as BulkActionFile[]

      // If some files are not in the prop, fetch them via bulk info API
      const missingIds = Array.from(selectedFiles).filter(id => !selectedMap.has(id))
      if (missingIds.length > 0) {
        const infoRes = await fetch("/api/files/bulk/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileIds: missingIds })
        })
        if (infoRes.ok) {
          const data = await infoRes.json()
          if (Array.isArray(data.files)) {
            foundFiles.push(...data.files)
          }
        }
      }

      // 2. Filter to image files
      const isImage = (f: BulkActionFile) =>
        f.fileType === "IMAGE" ||
        f.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(f.originalName)

      const imageFiles = foundFiles.filter(isImage)

      if (imageFiles.length === 0) {
        toast.error("Please select at least one image file to send to WhatsApp.")
        return
      }

      toast.loading(`Preparing ${imageFiles.length} ${imageFiles.length === 1 ? 'image' : 'images'} for WhatsApp...`, { id: "wa-bulk-share" })

      const baseUrl = (process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || "https://pixboximg.webstaging.in").replace(/\/$/, '')

      // 3. Fetch blobs and create File objects
      const fileObjects: File[] = await Promise.all(
        imageFiles.map(async (file) => {
          const directUrl = `${baseUrl}/uploads/${file.bucketName}/${file.storagePath}`
          let blob: Blob
          try {
            const res = await fetch(directUrl)
            if (!res.ok) throw new Error("Direct fetch failed")
            blob = await res.blob()
          } catch {
            const res = await fetch(`/api/files/${file.id}/download`)
            if (!res.ok) throw new Error("Download route fetch failed")
            blob = await res.blob()
          }
          const mime = blob.type || file.mimeType || "image/jpeg"
          return new File([blob], file.originalName, { type: mime })
        })
      )

      // 4. Try native navigator.share with files (mobile iOS / Android / macOS Safari)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: fileObjects })) {
        toast.dismiss("wa-bulk-share")
        await navigator.share({
          files: fileObjects,
          title: `${fileObjects.length} Photos from PixBox`
        })
        toast.success(`${fileObjects.length} ${fileObjects.length === 1 ? 'image' : 'images'} shared to WhatsApp!`)
        clearSelection()
      } else {
        // Fallback for Desktop where navigator.canShare with files is not supported
        toast.dismiss("wa-bulk-share")

        // If single image and clipboard supports images, copy bitmap for easy Ctrl+V
        if (fileObjects.length === 1 && typeof navigator.clipboard?.write === "function") {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [fileObjects[0].type || "image/png"]: fileObjects[0] })
            ])
            toast.success("Image copied to clipboard! Paste (Ctrl+V) directly in WhatsApp.")
          } catch {
            // ignore
          }
        }

        // Prepare WhatsApp message with direct image links
        const linksList = imageFiles
          .map((f, i) => `${i + 1}. ${f.originalName}:\n${baseUrl}/uploads/${f.bucketName}/${f.storagePath}`)
          .join("\n\n")
        const messageText = `*PixBox Images (${imageFiles.length})*:\n\n${linksList}`

        if (typeof navigator.clipboard?.writeText === "function") {
          await navigator.clipboard.writeText(messageText)
        }

        const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(messageText)}`
        window.open(waUrl, "_blank")
        toast.success(`Prepared ${imageFiles.length} images! Opening WhatsApp Web (on mobile phones, images send directly as photo files).`)
      }
    } catch (err: any) {
      toast.dismiss("wa-bulk-share")
      if (err?.name !== "AbortError") {
        console.error("WhatsApp share error:", err)
        toast.error("Failed to share images to WhatsApp")
      }
    } finally {
      setIsSharingWhatsApp(false)
    }
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white shadow-2xl rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 max-w-[95vw]">
      <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-blue-400/50 shrink-0">
        <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
          {count} selected
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Send to WhatsApp button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleWhatsAppShare}
          disabled={isDownloading || isDeleting || isSharingWhatsApp}
          className="h-9 px-2.5 sm:px-3.5 rounded-full text-white bg-emerald-500/30 hover:bg-[#25D366] hover:text-white border border-emerald-400/40 flex items-center gap-1.5 transition-all text-xs font-semibold shadow-sm"
          title="Send selected images to WhatsApp"
        >
          {isSharingWhatsApp ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <MessageCircle size={16} className="fill-emerald-400 text-white" />
          )}
          <span className="whitespace-nowrap">WhatsApp</span>
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleMove}
          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
          title="Move"
        >
          <FolderOutput size={18} />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDownload} 
          disabled={isDownloading || isDeleting || isSharingWhatsApp}
          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
          title="Download as ZIP"
        >
          {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDelete}
          disabled={isDownloading || isDeleting || isSharingWhatsApp}
          className="h-9 w-9 rounded-full text-white hover:bg-red-500 hover:text-white"
          title="Delete"
        >
          {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </Button>
      </div>

      <div className="pl-1 sm:pl-4 border-l border-blue-400/50 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clearSelection} 
          className="h-9 w-9 rounded-full text-blue-200 hover:bg-white/20 hover:text-white"
          title="Clear selection"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  )
}
