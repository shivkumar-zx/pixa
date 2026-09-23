"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Share2, Trash2, Info, Download, ChevronLeft, ChevronRight, Star, FileText, Video, FileArchive, ImageIcon, Copy, Check, MessageCircle, ExternalLink, Volume2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || ""

function formatBytes(bytes: bigint | number): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  switch (type) {
    case "IMAGE": return <ImageIcon size={64} className="text-violet-500/50" />
    case "VIDEO": return <Video size={64} className="text-blue-500/50" />
    case "DOCUMENT": return <FileText size={64} className="text-emerald-500/50" />
    default: return <FileArchive size={64} className="text-orange-500/50" />
  }
}

export function PhotoViewer({ 
  files, 
  initialFileId, 
  onClose 
}: { 
  files: any[], 
  initialFileId: string,
  onClose: () => void
}) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(() => files.findIndex(f => f.id === initialFileId))
  const [showInfo, setShowInfo] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({})
  const [showShareModal, setShowShareModal] = useState(false)

  const currentFile = files[currentIndex]
  const isFavorited = localFavorites[currentFile?.id] ?? (currentFile?.favorites && currentFile.favorites.length > 0)

  const handleNext = useCallback(() => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, files.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const toggleFavorite = async () => {
    if (!currentFile || isFavoriting) return
    setIsFavoriting(true)
    
    // Optimistic update
    const previousState = isFavorited
    setLocalFavorites(prev => ({ ...prev, [currentFile.id]: !previousState }))

    try {
      const res = await fetch(`/api/files/${currentFile.id}/favorite`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to toggle favorite")
      const data = await res.json()
      setLocalFavorites(prev => ({ ...prev, [currentFile.id]: data.favorited }))
      // Tell Next.js to re-fetch server components in the background so the gallery updates
      router.refresh()
    } catch (err) {
      toast.error("Failed to update favorite status")
      // Revert optimistic update
      setLocalFavorites(prev => ({ ...prev, [currentFile.id]: previousState }))
    } finally {
      setIsFavoriting(false)
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const handleDelete = async () => {
    if (!currentFile) return
    if (!window.confirm(`Are you sure you want to move "${currentFile.originalName}" to trash?`)) return
    try {
      const res = await fetch(`/api/files/${currentFile.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete file")
      toast.success("File moved to trash")
      router.refresh()
      if (files.length <= 1) {
        onClose()
      } else if (currentIndex >= files.length - 1) {
        setCurrentIndex(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      toast.error("Failed to delete file")
    }
  }

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleNext, handlePrev, onClose])

  if (!currentFile || !mounted) return null

  const fileUrl = currentFile.url || `${baseUrl}/uploads/${currentFile.bucketName}/${currentFile.storagePath}`
  const fileName = currentFile.originalName || ""
  const isImage = currentFile.fileType === "IMAGE" || currentFile.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(fileName)
  const isPdf = 
    currentFile.mimeType === "application/pdf" || 
    fileName.toLowerCase().endsWith(".pdf") ||
    (currentFile.storagePath || "").toLowerCase().endsWith(".pdf")
  const isVideo = 
    currentFile.fileType === "VIDEO" || 
    currentFile.mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov|mkv)$/i.test(fileName)
  const isAudio = 
    currentFile.mimeType?.startsWith("audio/") ||
    /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(fileName)

  const content = (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 w-full z-30 transition-opacity">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFavorite}
            className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors ${isFavorited ? 'text-yellow-400 hover:bg-white/10' : 'text-white hover:bg-white/20'}`} 
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={20} className={isFavorited ? "fill-yellow-400" : ""} />
          </button>
          <button onClick={handleShare} className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors" title="Share">
            <Share2 size={20} />
          </button>
          <a href={`/api/files/${currentFile.id}/download`} className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors" title="Download">
            <Download size={20} />
          </a>
          <button onClick={handleDelete} className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors" title="Delete">
            <Trash2 size={20} />
          </button>
          <button 
            onClick={() => setShowInfo(!showInfo)} 
            className={`text-white rounded-full h-10 w-10 flex items-center justify-center transition-colors ${showInfo ? 'bg-white/20' : 'hover:bg-white/20'}`} 
            title="Info"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16 overflow-hidden relative">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors backdrop-blur-sm shadow-xl"
            title="Previous file"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        
        {currentIndex < files.length - 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors backdrop-blur-sm shadow-xl"
            style={{ right: showInfo ? '336px' : '16px' }}
            title="Next file"
          >
            <ChevronRight size={32} />
          </button>
        )}

        {/* Media Viewer */}
        <div className={`flex-1 flex items-center justify-center min-h-0 min-w-0 transition-all duration-300 ${showInfo ? 'mr-[320px]' : 'mr-0'}`}>
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
              <img 
                key={currentFile.id}
                src={fileUrl}
                alt={currentFile.originalName}
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200 select-none shadow-2xl rounded-lg"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col p-2 sm:p-4 max-w-6xl mx-auto min-h-0 animate-in zoom-in-95 duration-200">
              {/* PDF Header with details & actions */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-t-xl text-white backdrop-blur-md shrink-0 shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded border border-red-500/30 shrink-0">
                    PDF
                  </span>
                  <span className="font-medium text-sm truncate text-white/95" title={currentFile.originalName}>
                    {currentFile.originalName}
                  </span>
                  <span className="text-xs text-white/50 shrink-0 hidden sm:inline">
                    • {formatBytes(currentFile.size)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showInfo ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    title="Toggle file details"
                  >
                    <Info size={14} />
                    <span className="hidden sm:inline">{showInfo ? "Hide Info" : "Details"}</span>
                  </button>
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    title="Open in new window / full tab"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">Open in Tab</span>
                  </a>
                  <a 
                    href={`/api/files/${currentFile.id}/download`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>

              {/* PDF Native Render */}
              <div className="flex-1 w-full min-h-0 bg-slate-950 rounded-b-xl overflow-hidden border-x border-b border-white/10 shadow-2xl relative">
                <iframe 
                  key={currentFile.id}
                  src={`${fileUrl}#view=FitH&toolbar=1`}
                  title={currentFile.originalName}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          ) : isVideo ? (
            <div className="w-full h-full flex flex-col p-2 sm:p-4 max-w-6xl mx-auto min-h-0 animate-in zoom-in-95 duration-200">
              {/* Video Header with details & actions */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-t-xl text-white backdrop-blur-md shrink-0 shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded border border-blue-500/30 shrink-0">
                    VIDEO
                  </span>
                  <span className="font-medium text-sm truncate text-white/95" title={currentFile.originalName}>
                    {currentFile.originalName}
                  </span>
                  <span className="text-xs text-white/50 shrink-0 hidden sm:inline">
                    • {formatBytes(currentFile.size)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showInfo ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    title="Toggle file details"
                  >
                    <Info size={14} />
                    <span className="hidden sm:inline">{showInfo ? "Hide Info" : "Details"}</span>
                  </button>
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    title="Open in new window / full tab"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">Open in Tab</span>
                  </a>
                  <a 
                    href={`/api/files/${currentFile.id}/download`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    title="Download Video"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>

              {/* Video Player */}
              <div className="flex-1 w-full min-h-0 bg-black rounded-b-xl overflow-hidden border-x border-b border-white/10 shadow-2xl relative flex items-center justify-center">
                <video 
                  key={currentFile.id}
                  src={fileUrl}
                  controls 
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full"
                />
              </div>
            </div>
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center gap-6 p-8 bg-slate-900/80 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl text-white animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Volume2 size={36} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white truncate max-w-xs">{currentFile.originalName}</p>
                <p className="text-xs text-white/50 mt-1">{formatBytes(currentFile.size)}</p>
              </div>
              <audio controls src={fileUrl} className="w-full" autoPlay />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900/80 rounded-2xl border border-white/10 max-w-lg w-full text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                {getFileIcon(currentFile.fileType)}
              </div>
              <h3 className="text-xl font-bold text-white mb-1 break-all">{currentFile.originalName}</h3>
              <p className="text-xs text-white/50 mb-6">{formatBytes(currentFile.size)} • {currentFile.fileType}</p>
              
              <div className="w-full bg-white/5 rounded-xl p-4 text-left space-y-2 mb-6 text-xs text-white/70">
                <div className="flex justify-between">
                  <span className="text-white/40">File Type:</span>
                  <span className="font-mono">{currentFile.mimeType || currentFile.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Uploaded:</span>
                  <span>{new Date(currentFile.createdAt).toLocaleDateString()}</span>
                </div>
                {currentFile.uploadedBy?.name && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Uploader:</span>
                    <span>{currentFile.uploadedBy.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/api/files/${currentFile.id}/download`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all shadow-lg"
                >
                  <Download size={16} />
                  Download File
                </a>
                <button
                  onClick={() => setShowInfo(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Info size={16} />
                  View Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Sidebar */}
        <div 
          className={`absolute right-0 top-0 h-full w-[320px] bg-background text-foreground border-l border-border transition-transform duration-300 transform ${showInfo ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="h-16 border-b border-border flex items-center px-6">
            <h2 className="text-lg font-semibold">Info</h2>
          </div>
          
          <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-64px)]">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Details</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Original Name</p>
                  <p className="text-sm font-medium break-all">{currentFile.originalName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm font-medium">{formatBytes(currentFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{currentFile.fileType}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date Uploaded</p>
                  <p className="text-sm font-medium">{new Date(currentFile.createdAt).toLocaleString()}</p>
                </div>
                {currentFile.category && (
                  <div>
                    <p className="text-xs text-muted-foreground">Folder</p>
                    <Badge variant="outline" className="mt-1">{currentFile.category.name}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Uploaded By</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {currentFile.uploadedBy?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{currentFile.uploadedBy?.name}</p>
                  <p className="text-xs text-muted-foreground">{currentFile.uploadedBy?.email}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Description</p>
              {currentFile.description ? (
                <p className="text-sm">{currentFile.description}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">No description provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const ShareModal = () => {
    const [copied, setCopied] = useState(false)
    const [copiedImage, setCopiedImage] = useState(false)
    const [sharingDirect, setSharingDirect] = useState(false)

    const host = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || "https://pixbox.webstaging.in")
    const cleanHost = host.replace(/\/$/, '')
    const currentFileUrl = `${cleanHost}/uploads/${currentFile.bucketName}/${currentFile.storagePath}`
    const whatsappText = `Check out "${currentFile.originalName}" on PixBox:\n${currentFileUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

    // 1. Share the actual image file directly to WhatsApp/Apps
    const handleShareDirectFile = async () => {
      setSharingDirect(true)
      try {
        const res = await fetch(currentFileUrl)
        if (!res.ok) throw new Error("Could not fetch file")
        const blob = await res.blob()
        const mime = blob.type || (currentFile.fileType === "IMAGE" ? "image/jpeg" : "application/octet-stream")
        const fileObj = new File([blob], currentFile.originalName, { type: mime })

        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            files: [fileObj],
            title: currentFile.originalName,
          })
          toast.success("Image shared successfully!")
        } else if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: currentFile.originalName,
            url: currentFileUrl,
          })
        } else {
          // If browser doesn't support sharing files, trigger download / prompt
          toast.info("Direct file share not supported by this browser. Downloading image instead!")
          const a = document.createElement("a")
          a.href = `/api/files/${currentFile.id}/download`
          a.download = currentFile.originalName
          a.click()
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Direct share error:", err)
          toast.error("Could not share image file directly")
        }
      } finally {
        setSharingDirect(false)
      }
    }

    // 2. Copy actual image data to clipboard (for pasting directly in WhatsApp Web)
    const handleCopyActualImage = async () => {
      try {
        setCopiedImage(true)
        const res = await fetch(currentFileUrl)
        const blob = await res.blob()

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = URL.createObjectURL(blob)
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0)

        canvas.toBlob(async (pngBlob) => {
          if (pngBlob && typeof navigator.clipboard?.write === "function") {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": pngBlob })
              ])
              toast.success("Image copied! Paste (Ctrl+V) directly in WhatsApp Web!")
            } catch {
              await navigator.clipboard.writeText(currentFileUrl)
              toast.success("Share link copied to clipboard!")
            }
          } else {
            await navigator.clipboard.writeText(currentFileUrl)
            toast.success("Share link copied to clipboard!")
          }
          setTimeout(() => setCopiedImage(false), 2500)
        }, "image/png")
      } catch (err) {
        await navigator.clipboard.writeText(currentFileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success("Share link copied to clipboard!")
        setCopiedImage(false)
      }
    }

    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(currentFileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success("Share link copied to clipboard!")
      } catch (err) {
        toast.error("Failed to copy link")
      }
    }

    return (
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Share File</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Share this file directly as an image, via WhatsApp, or copy the link below.
            </DialogDescription>
          </DialogHeader>

          {/* File Card Preview */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 mt-2">
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              {currentFile.fileType === "IMAGE" ? (
                <img src={`${baseUrl || ''}/uploads/${currentFile.bucketName}/${currentFile.storagePath}`} alt={currentFile.originalName} className="w-full h-full object-cover" />
              ) : (
                getFileIcon(currentFile.fileType)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{currentFile.originalName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(currentFile.size)} • {currentFile.fileType}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2.5">
            {/* Direct Image File Share (Sends actual photo to WhatsApp/Apps) */}
            <Button 
              onClick={handleShareDirectFile} 
              disabled={sharingDirect}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2.5 shadow-md shadow-indigo-500/20 transition-all"
            >
              {sharingDirect ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Preparing Photo...</span>
                </>
              ) : (
                <>
                  <Share2 className="h-5 w-5" />
                  <span>Share Photo Directly (Image File)</span>
                </>
              )}
            </Button>

            {/* WhatsApp Link Share */}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/20 transition-all">
                <MessageCircle className="h-5 w-5 fill-current" />
                <span>Share via WhatsApp (Link)</span>
              </Button>
            </a>

            {/* Copy Actual Image for WhatsApp Web */}
            {currentFile.fileType === "IMAGE" && (
              <Button 
                variant="outline" 
                onClick={handleCopyActualImage}
                disabled={copiedImage}
                className="w-full rounded-xl h-10 flex items-center justify-center gap-2 border-border/80 text-foreground text-xs font-semibold hover:bg-muted"
              >
                {copiedImage ? <Check className="h-4 w-4 text-emerald-500" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                <span>{copiedImage ? "Image Copied! Press Ctrl+V in WhatsApp" : "Copy Image to Clipboard (Paste in WhatsApp Web)"}</span>
              </Button>
            )}
          </div>

          {/* Copy Direct Link */}
          <div className="space-y-1.5 mt-4 pt-4 border-t border-border">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direct Link</label>
            <div className="flex items-center space-x-2">
              <Input readOnly value={currentFileUrl} className="flex-1 text-xs rounded-xl bg-muted/50 font-mono" />
              <Button size="sm" onClick={onCopy} className="rounded-xl px-4 gap-1.5">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      {createPortal(content, document.body)}
      {showShareModal && <ShareModal />}
    </>
  )
}
