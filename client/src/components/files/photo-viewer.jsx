import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Share2, Trash2, Info, Download, ChevronLeft, ChevronRight, Star, FileText, Video, FileArchive, ImageIcon, Copy, Check, MessageCircle, X } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { formatBytes } from "../../lib/utils"

function getFileIcon(type) {
  switch (type) {
    case "IMAGE": return <ImageIcon size={64} className="text-violet-500/50" />
    case "VIDEO": return <Video size={64} className="text-blue-500/50" />
    case "DOCUMENT": return <FileText size={64} className="text-emerald-500/50" />
    default: return <FileArchive size={64} className="text-orange-500/50" />
  }
}

export function PhotoViewer({ files = [], initialFileId, onClose, onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, files.findIndex(f => f.id === initialFileId)))
  const [showInfo, setShowInfo] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [localFavorites, setLocalFavorites] = useState({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentFile = files[currentIndex]
  const isFavorited = localFavorites[currentFile?.id] ?? (currentFile?.isFavorite || (currentFile?.favorites && currentFile.favorites.length > 0))

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

  const handleDelete = async () => {
    if (!currentFile) return
    const fileId = currentFile.id
    try {
      await fetch(`http://localhost:5000/api/files/${fileId}`, { method: "DELETE" })
    } catch {}
    if (onDelete) {
      onDelete(fileId)
    }
    toast.success("File moved to trash")
    if (files.length <= 1) {
      onClose()
    } else if (currentIndex >= files.length - 1) {
      setCurrentIndex(prev => Math.max(0, prev - 1))
    }
  }

  const toggleFavorite = async () => {
    if (!currentFile || isFavoriting) return
    setIsFavoriting(true)
    const previousState = isFavorited
    setLocalFavorites(prev => ({ ...prev, [currentFile.id]: !previousState }))
    try {
      await fetch(`http://localhost:5000/api/files/${currentFile.id}/favorite`, { method: "POST" })
      toast.success(!previousState ? "Added to favorites" : "Removed from favorites")
    } catch {
      toast.success(!previousState ? "Added to favorites" : "Removed from favorites")
    } finally {
      setIsFavoriting(false)
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const handleCopyLink = async () => {
    const link = `http://localhost:5000/api/files/${currentFile.id}/download`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Share link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleNext, handlePrev, onClose])

  if (!currentFile || !mounted) return null

  const isImage = currentFile.fileType === "IMAGE"
  const currentFileUrl = `http://localhost:5000/api/files/${currentFile.id}/download`
  const encodedUrl = encodeURIComponent(currentFileUrl)
  const encodedTitle = encodeURIComponent(`Check out ${currentFile.originalName} on PixBox`)

  const content = (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 w-full z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors">
            <ArrowLeft size={24} />
          </button>
          <span className="font-semibold text-sm truncate max-w-xs sm:max-w-md">{currentFile.originalName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFavorite}
            className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors ${isFavorited ? 'text-yellow-400 hover:bg-white/10' : 'text-white hover:bg-white/20'}`} 
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={20} className={isFavorited ? "fill-yellow-400 text-yellow-400" : ""} />
          </button>
          <button onClick={handleShare} className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors" title="Share">
            <Share2 size={20} />
          </button>
          <a href={currentFileUrl} download className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors" title="Download">
            <Download size={20} />
          </a>
          <button 
            onClick={handleDelete}
            className="text-white hover:bg-white/20 hover:text-red-400 rounded-full h-10 w-10 flex items-center justify-center transition-colors" 
            title="Delete file"
          >
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
      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        
        {currentIndex < files.length - 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
            style={{ right: showInfo ? '340px' : '16px' }}
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
                src={currentFile.url || `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80`}
                alt={currentFile.originalName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              />
            </div>
          ) : (currentFile.mimeType === "application/pdf" || (currentFile.originalName || "").toLowerCase().endsWith(".pdf")) ? (
            <div className="w-full h-full flex flex-col p-2 sm:p-4 max-w-6xl mx-auto min-h-0 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-t-xl text-white shrink-0 shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded border border-red-500/30">
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
                  <a 
                    href={currentFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Open in Tab
                  </a>
                  <a 
                    href={currentFile.url} 
                    download={currentFile.originalName}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
              <div className="flex-1 w-full min-h-0 bg-slate-950 rounded-b-xl overflow-hidden border-x border-b border-white/10 shadow-2xl">
                <iframe 
                  key={currentFile.id}
                  src={`${currentFile.url}#view=FitH&toolbar=1`}
                  title={currentFile.originalName}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white/70 p-8">
              {getFileIcon(currentFile.fileType)}
              <p className="text-xl font-bold">{currentFile.originalName}</p>
              <p className="text-sm">Preview not directly available for this format.</p>
            </div>
          )}
        </div>

        {/* Right Info Sidebar */}
        <div 
          className={`absolute right-0 top-0 h-full w-[320px] bg-card text-card-foreground border-l border-border transition-transform duration-300 transform ${showInfo ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="h-16 border-b border-border flex items-center px-6">
            <h2 className="text-lg font-semibold">Info</h2>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-64px)]">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Details</p>
              <div className="space-y-3">
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
                    <Badge variant="secondary" className="mt-1">{currentFile.category.name}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border relative animate-in zoom-in-95 duration-150 space-y-4">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-bold">Share File</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Share this file directly via WhatsApp or copy the link below.</p>
            </div>

            {/* File Card Preview */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                {currentFile.fileType === "IMAGE" ? (
                  <img src={`/uploads/${currentFile.bucketName}/${currentFile.storagePath}`} alt={currentFile.originalName} className="w-full h-full object-cover" />
                ) : (
                  getFileIcon(currentFile.fileType)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{currentFile.originalName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(currentFile.size)} • {currentFile.fileType}</p>
              </div>
            </div>

            {/* Dedicated WhatsApp Share Button */}
            <div>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out "${currentFile.originalName}" on PixBox:\n${currentFileUrl}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full"
              >
                <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/20 transition-all text-sm">
                  <MessageCircle size={20} className="fill-current" />
                  Share on WhatsApp
                </button>
              </a>
            </div>

            {/* Copy Direct Link */}
            <div className="pt-3 border-t border-border space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direct Link</label>
              <div className="flex items-center gap-2">
                <Input readOnly value={currentFileUrl} className="flex-1 text-xs rounded-xl font-mono bg-muted/50" />
                <Button size="sm" onClick={handleCopyLink} title="Copy Link" className="rounded-xl px-4 gap-1.5">
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {createPortal(content, document.body)}
    </>
  )
}
