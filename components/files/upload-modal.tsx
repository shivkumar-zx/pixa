"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { 
  Upload, 
  File as FileIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  CloudUpload, 
  FolderPlus 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

interface UploadFile {
  id: string
  file: File
  status: "queued" | "uploading" | "saving" | "done" | "error"
  progress: number
  error?: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export function UploadModal({
  defaultCategoryId,
  triggerText = "Upload Files",
  buttonVariant = "default",
  buttonClassName,
}: {
  defaultCategoryId?: string
  triggerText?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost"
  buttonClassName?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId || "")
  const [showQuickFolder, setShowQuickFolder] = useState(false)
  const [quickFolderName, setQuickFolderName] = useState("")
  const [quickCreating, setQuickCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchCategories()
      if (defaultCategoryId) {
        setSelectedCategoryId(defaultCategoryId)
      }
    } else {
      // Reset state on close if finished
      setFiles([])
      setIsUploading(false)
    }
  }, [open, defaultCategoryId, fetchCategories])

  const handleQuickCreateFolder = async () => {
    if (!quickFolderName.trim()) return
    setQuickCreating(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: quickFolderName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create folder")
      
      toast.success(`Folder "${quickFolderName}" created!`)
      setQuickFolderName("")
      setShowQuickFolder(false)
      await fetchCategories()
      if (data?.id) setSelectedCategoryId(data.id)
    } catch (e: any) {
      toast.error(e.message || "Failed to create folder")
    } finally {
      setQuickCreating(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: "queued",
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 500 * 1024 * 1024,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadAll = async () => {
    const queued = files.filter((f) => f.status === "queued")
    if (queued.length === 0) return

    setIsUploading(true)
    let anySuccess = false

    for (const uf of queued) {
      setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "uploading", progress: 15 } : f))
      try {
        // Step 1: Get presigned URL
        const res = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: uf.file.name,
            mimeType: uf.file.type,
            size: uf.file.size,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to get upload URL")
        }

        const { presignedUrl, bucketName, storagePath, storedName } = await res.json()
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 45 } : f))

        // Step 2: Upload to Hostinger / Storage
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: uf.file,
          headers: { "Content-Type": uf.file.type },
        })

        if (!uploadRes.ok) {
          throw new Error(`Upload failed (${uploadRes.status})`)
        }
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 85, status: "saving" } : f))

        // Step 3: Complete DB record
        const saveRes = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucketName,
            storagePath,
            originalName: uf.file.name,
            storedName,
            mimeType: uf.file.type,
            size: uf.file.size,
            categoryId: selectedCategoryId || null,
          }),
        })

        if (!saveRes.ok) {
          const err = await saveRes.json()
          throw new Error(err.details || err.error || "Failed to save file")
        }

        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 100, status: "done" } : f))
        anySuccess = true
      } catch (err: any) {
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "error", error: err.message } : f))
      }
    }

    setIsUploading(false)
    if (anySuccess) {
      toast.success("Files uploaded successfully!")
      router.refresh()
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const queuedCount = files.filter((f) => f.status === "queued").length
  const allDone = files.length > 0 && files.every((f) => f.status === "done")

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setOpen(true)}
        className={buttonClassName || "gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs h-9 px-4"}
      >
        <Upload size={16} />
        <span>{triggerText}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl text-foreground rounded-2xl p-6 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CloudUpload className="text-primary h-6 w-6" />
              Upload Files
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload images, videos, and documents directly to your storage.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2">
            {/* Folder selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Destination Folder:
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">(No folder / General)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      📁 {c.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickFolder(!showQuickFolder)}
                  className="h-8 px-2 text-xs gap-1 rounded-lg"
                  title="New Folder"
                >
                  <FolderPlus size={13} />
                  <span>New</span>
                </Button>
              </div>
            </div>

            {/* Quick create folder input */}
            {showQuickFolder && (
              <div className="flex gap-2 p-2.5 bg-accent/40 rounded-xl border border-border">
                <input
                  type="text"
                  placeholder="New folder name..."
                  value={quickFolderName}
                  onChange={(e) => setQuickFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickCreateFolder()}
                  className="flex-1 px-3 py-1 text-xs rounded-lg border border-border bg-background outline-none"
                />
                <Button
                  size="sm"
                  onClick={handleQuickCreateFolder}
                  disabled={quickCreating || !quickFolderName.trim()}
                  className="h-7 text-xs rounded-lg px-3"
                >
                  {quickCreating ? <Loader2 size={12} className="animate-spin" /> : "Create"}
                </Button>
              </div>
            )}

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Click to browse or drag and drop files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Images, Videos, PDFs, and Documents up to 500MB
                </p>
              </div>
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Selected Files ({files.length})</span>
                  {!isUploading && (
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 divide-y divide-border/40">
                  {files.map((uf) => (
                    <div
                      key={uf.id}
                      className="flex items-center justify-between gap-3 py-2 px-2 hover:bg-muted/30 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileIcon size={16} className="text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{uf.file.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatBytes(uf.file.size)}
                            {uf.error && <span className="text-destructive ml-2 font-medium">{uf.error}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {uf.status === "uploading" || uf.status === "saving" ? (
                          <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
                            <Loader2 size={13} className="animate-spin" />
                            <span>{uf.status === "saving" ? "Saving..." : `${uf.progress}%`}</span>
                          </div>
                        ) : uf.status === "done" ? (
                          <span className="text-emerald-500 flex items-center gap-1 font-medium">
                            <CheckCircle2 size={14} /> Done
                          </span>
                        ) : uf.status === "error" ? (
                          <span className="text-destructive flex items-center gap-1 font-medium">
                            <AlertCircle size={14} /> Failed
                          </span>
                        ) : (
                          <button
                            onClick={() => removeFile(uf.id)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4"
            >
              {allDone ? "Close" : "Cancel"}
            </Button>

            {allDone ? (
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                All Done
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={uploadAll}
                disabled={isUploading || queuedCount === 0}
                className="rounded-xl px-5 gap-2 font-semibold shadow-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Upload {queuedCount > 0 ? `(${queuedCount})` : ""}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
