"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Share2, Trash2, Info, Download, ChevronLeft, ChevronRight, Star, FileText, Video, FileArchive, ImageIcon, Copy, Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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

  const isImage = currentFile.fileType === "IMAGE"
  const currentFileUrl = `${window.location.origin}/uploads/${currentFile.bucketName}/${currentFile.storagePath}`

  const content = (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 w-full z-10 transition-opacity">
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
          <button className="text-white hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center transition-colors" title="Delete">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        
        {currentIndex < files.length - 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white transition-colors"
            style={{ right: showInfo ? '340px' : '16px' }}
          >
            <ChevronRight size={32} />
          </button>
        )}

        {/* Media Viewer */}
        <div className={`flex-1 flex items-center justify-center p-8 transition-all duration-300 ${showInfo ? 'mr-[320px]' : 'mr-0'}`}>
          {isImage ? (
            <img 
              key={currentFile.id}
              src={`/uploads/${currentFile.bucketName}/${currentFile.storagePath}`}
              alt={currentFile.originalName}
              className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white/50">
              {getFileIcon(currentFile.fileType)}
              <p className="text-lg font-medium">{currentFile.originalName}</p>
              <p className="text-sm">Preview not available for this file type.</p>
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
    const encodedUrl = encodeURIComponent(currentFileUrl)
    const encodedTitle = encodeURIComponent(`Check out ${currentFile.originalName}`)

    const onCopy = async () => {
      try {
        await navigator.clipboard.writeText(currentFileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success("Link copied to clipboard!")
      } catch (err) {
        toast.error("Failed to copy link")
      }
    }

    return (
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md text-foreground">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              Share this link with anyone, or post it to social media.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input readOnly value={currentFileUrl} className="flex-1" />
            <Button size="icon" onClick={onCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-green-50 hover:text-green-600 border-green-200" title="WhatsApp">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-blue-50 hover:text-blue-600 border-blue-200" title="Facebook">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </Button>
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-sky-50 hover:text-sky-500 border-sky-200" title="Twitter">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </Button>
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 hover:bg-blue-50 hover:text-blue-700 border-blue-200" title="LinkedIn">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </Button>
            </a>
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
