"use client"

import React, { useState, useEffect } from "react"
import { useBulkAction } from "./bulk-action-provider"
import { 
  Download, 
  Trash2, 
  FolderOutput, 
  X, 
  Loader2, 
  MessageCircle, 
  Folder, 
  FolderPlus, 
  Check, 
  Home 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

interface CategoryItem {
  id: string
  name: string
  _count?: { files: number }
}

export function BulkActionBar({ files = [] }: BulkActionBarProps) {
  const { selectedFiles, clearSelection } = useBulkAction()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false)

  // Move Modal State
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [folders, setFolders] = useState<CategoryItem[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false)

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

  // Fetch folders for Move Modal
  const openMoveModal = async () => {
    setShowMoveModal(true)
    setSelectedFolderId(null)
    setIsCreatingFolder(false)
    setNewFolderName("")
    setLoadingFolders(true)
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setFolders(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to load folders:", err)
    } finally {
      setLoadingFolders(false)
    }
  }

  // Execute Bulk Move
  const handleExecuteMove = async () => {
    try {
      setIsMoving(true)
      const res = await fetch("/api/files/bulk/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          categoryId: selectedFolderId
        })
      })

      if (!res.ok) throw new Error("Failed to move files")

      const targetFolderName = selectedFolderId
        ? folders.find(f => f.id === selectedFolderId)?.name || "Folder"
        : "Main Gallery"

      toast.success(`Successfully moved ${count} ${count === 1 ? 'file' : 'files'} to "${targetFolderName}"`)
      setShowMoveModal(false)
      clearSelection()
      router.refresh()
    } catch (err) {
      toast.error("Failed to move files. Please try again.")
    } finally {
      setIsMoving(false)
    }
  }

  // Inline Create Folder & Select
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    try {
      setIsSubmittingFolder(true)
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() })
      })

      if (!res.ok) throw new Error("Failed to create folder")

      const newFolder = await res.json()
      setFolders(prev => [newFolder, ...prev])
      setSelectedFolderId(newFolder.id)
      setNewFolderName("")
      setIsCreatingFolder(false)
      toast.success(`Folder "${newFolder.name}" created!`)
    } catch (err) {
      toast.error("Could not create folder")
    } finally {
      setIsSubmittingFolder(false)
    }
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
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white shadow-2xl rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 max-w-[95vw]">
        <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-blue-400/50 shrink-0">
          <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
            {count} selected
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Send to WhatsApp button with white icon on hover */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleWhatsAppShare}
            disabled={isDownloading || isDeleting || isSharingWhatsApp || isMoving}
            className="group h-9 px-2.5 sm:px-3.5 rounded-full text-white bg-emerald-500/30 hover:bg-[#25D366] hover:text-white border border-emerald-400/40 flex items-center gap-1.5 transition-all text-xs font-semibold shadow-sm"
            title="Send selected images to WhatsApp"
          >
            {isSharingWhatsApp ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <MessageCircle size={16} className="fill-emerald-400 text-white group-hover:fill-white group-hover:text-white transition-colors" />
            )}
            <span className="whitespace-nowrap group-hover:text-white transition-colors">WhatsApp</span>
          </Button>

          {/* Move to Folder button with white icon on hover */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={openMoveModal}
            disabled={isDownloading || isDeleting || isSharingWhatsApp || isMoving}
            className="group h-9 w-9 rounded-full text-white hover:bg-white/20 hover:text-white transition-colors"
            title="Move to Folder"
          >
            <FolderOutput size={18} className="text-white group-hover:text-white transition-colors" />
          </Button>

          {/* Download button with white icon on hover */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDownload} 
            disabled={isDownloading || isDeleting || isSharingWhatsApp || isMoving}
            className="group h-9 w-9 rounded-full text-white hover:bg-white/20 hover:text-white transition-colors"
            title="Download as ZIP"
          >
            {isDownloading ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <Download size={18} className="text-white group-hover:text-white transition-colors" />
            )}
          </Button>

          {/* Delete button with white icon on hover */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            disabled={isDownloading || isDeleting || isSharingWhatsApp || isMoving}
            className="group h-9 w-9 rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <Trash2 size={18} className="text-white group-hover:text-white transition-colors" />
            )}
          </Button>
        </div>

        <div className="pl-1 sm:pl-4 border-l border-blue-400/50 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearSelection} 
            className="group h-9 w-9 rounded-full text-blue-100 hover:bg-white/20 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X size={18} className="text-blue-100 group-hover:text-white transition-colors" />
          </Button>
        </div>
      </div>

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent className="sm:max-w-md text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FolderOutput className="text-blue-600" size={20} />
              Move {count} {count === 1 ? "File" : "Files"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a destination folder or move to main gallery.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            {/* Create new folder button/input */}
            {isCreatingFolder ? (
              <form onSubmit={handleCreateFolder} className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
                <Input 
                  autoFocus
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900 border-none focus-visible:ring-1"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isSubmittingFolder || !newFolderName.trim()}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                >
                  {isSubmittingFolder ? <Loader2 size={12} className="animate-spin" /> : "Create"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCreatingFolder(false)}
                  className="h-8 w-8 p-0 text-xs shrink-0"
                >
                  <X size={14} />
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingFolder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
              >
                <FolderPlus size={16} />
                <span>+ Create New Folder</span>
              </button>
            )}

            {/* Folder selection list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {/* Option 1: Root / Main Gallery (No folder) */}
              <div 
                onClick={() => setSelectedFolderId(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  selectedFolderId === null 
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home size={18} className={selectedFolderId === null ? "text-blue-600" : "text-slate-400"} />
                  <span className="text-sm">Main Gallery (No Folder)</span>
                </div>
                {selectedFolderId === null && <Check size={16} className="text-blue-600" />}
              </div>

              {/* User Folders */}
              {loadingFolders ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading folders...</span>
                </div>
              ) : (
                folders.map(folder => (
                  <div 
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedFolderId === folder.id 
                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder size={18} className={selectedFolderId === folder.id ? "text-blue-600 fill-blue-500/20" : "text-amber-500 fill-amber-500/20"} />
                      <span className="text-sm truncate">{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {folder._count && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                          {folder._count.files}
                        </span>
                      )}
                      {selectedFolderId === folder.id && <Check size={16} className="text-blue-600" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 flex sm:justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowMoveModal(false)}
              disabled={isMoving}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleExecuteMove}
              disabled={isMoving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex items-center gap-1.5"
            >
              {isMoving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Moving...</span>
                </>
              ) : (
                <>
                  <FolderOutput size={14} />
                  <span>Move Here</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
