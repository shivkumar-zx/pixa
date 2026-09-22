"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Download, Trash2, Share2, FileText, ImageIcon, Video, FileArchive, X, Check, Star, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useBulkAction } from "@/components/files/bulk-action-provider"
import { PhotoViewer } from "@/components/files/photo-viewer"

function formatBytes(bytes: bigint | number): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string, large = false) {
  const size = large ? 24 : 18
  switch (type) {
    case "IMAGE": return <ImageIcon size={size} className="text-violet-500" />
    case "VIDEO": return <Video size={size} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={size} className="text-emerald-500" />
    default: return <FileArchive size={size} className="text-orange-500" />
  }
}

function getFileBg(type: string) {
  switch (type) {
    case "IMAGE": return "bg-violet-100 dark:bg-violet-900/20"
    case "VIDEO": return "bg-blue-100 dark:bg-blue-900/20"
    case "DOCUMENT": return "bg-emerald-100 dark:bg-emerald-900/20"
    default: return "bg-orange-100 dark:bg-orange-900/20"
  }
}

type FileItem = {
  id: string
  originalName: string
  size: bigint | number
  fileType: string
  bucketName: string
  storagePath: string
  createdAt: Date
  description?: string | null
  tags?: string | null
  uploadedBy?: any
  category?: any
  favorites?: { id: string }[]
}

type GroupedFiles = {
  dateLabel: string
  id: string
  files: FileItem[]
}

interface FileGalleryProps {
  groupedFiles: GroupedFiles[]
  scrubberLinks: { isYearMarker?: boolean; label: string; id: string; count?: number }[]
}

export default function FileGallery({ groupedFiles, scrubberLinks }: FileGalleryProps) {
  const router = useRouter()
  const { selectedFiles, toggleFile, toggleAll, clearSelection } = useBulkAction()
  const [viewingFileId, setViewingFileId] = useState<string | null>(null)
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({})
  const [scrubberHover, setScrubberHover] = useState<{ label: string, top: number, isVisible: boolean }>({ label: "", top: 0, isVisible: false })
  const galleryRef = useRef<HTMLDivElement>(null)
  const [linkPositions, setLinkPositions] = useState<Record<string, number>>({})

  useEffect(() => {
    const updatePositions = () => {
      if (!galleryRef.current) return
      const positions: Record<string, number> = {}
      scrubberLinks.forEach(link => {
        const el = document.getElementById(link.id)
        if (el) {
          // If it's a year marker, push it up slightly so it doesn't overlap the month dot
          positions[link.label] = el.offsetTop - (link.isYearMarker ? 15 : -10)
        }
      })
      setLinkPositions(positions)
    }
    
    updatePositions()
    
    if (galleryRef.current) {
      const observer = new ResizeObserver(updatePositions)
      observer.observe(galleryRef.current)
      return () => observer.disconnect()
    }
  }, [groupedFiles, scrubberLinks])

  const selectionMode = selectedFiles.size > 0
  
  const allFiles = useMemo(() => {
    return groupedFiles.flatMap(g => g.files)
  }, [groupedFiles])

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    toggleFile(id)
  }

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    if (selectionMode) {
      toggleSelection(e, id)
    } else {
      setViewingFileId(id)
    }
  }

  return (
    <>
      {viewingFileId && (
        <PhotoViewer 
          files={allFiles} 
          initialFileId={viewingFileId} 
          onClose={() => setViewingFileId(null)} 
        />
      )}

      <div className="flex gap-4 sm:gap-6 relative items-start mt-2" ref={galleryRef}>
        <div className="flex-1 min-w-0 pr-16">
          {(() => {
            let currentMonthYear = ""
            return groupedFiles.map(group => {
              const isGroupSelected = group.files.length > 0 && group.files.every(f => selectedFiles.has(f.id))
              const groupMonthYear = group.files[0] ? new Date(group.files[0].createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : ""
              
              const showMonthTitle = groupMonthYear !== currentMonthYear
              if (showMonthTitle) {
                currentMonthYear = groupMonthYear
              }
              
              return (
              <div key={group.id}>
                {showMonthTitle && (
                  <h2 className="text-2xl font-bold mt-10 mb-5 tracking-tight text-foreground/90">
                    {groupMonthYear}
                  </h2>
                )}
                <div id={group.id} className="mb-8 group/date">
                  <div className="group/header sticky top-0 bg-background z-10 py-3 mb-2 flex items-center gap-3 w-fit pr-4 rounded-r-xl">
                    <h3 className="text-[15px] font-medium text-foreground tracking-tight">
                      {group.dateLabel}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleAll(group.files.map(f => f.id), !isGroupSelected)
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${isGroupSelected || selectionMode ? 'opacity-100' : 'opacity-0 group-hover/header:opacity-100 group-hover/date:opacity-100'} ${isGroupSelected ? 'bg-blue-600 text-white border-none' : 'border-2 border-muted-foreground/50 text-muted-foreground hover:border-foreground hover:text-foreground'}`}
                      title={isGroupSelected ? "Deselect date" : "Select date"}
                    >
                      {isGroupSelected && <Check size={14} strokeWidth={3} />}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[2px]">
                    {group.files.map(file => {
                      const isSelected = selectedFiles.has(file.id)
                      
                      return (
                        <div 
                          key={file.id} 
                          onClick={(e) => handleItemClick(e, file.id)}
                          className={`group relative aspect-square flex items-center justify-center cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-muted'}`}
                        >
                          {/* Image / Video / Document container */}
                          <div className={`w-full h-full overflow-hidden transition-all duration-200 ease-out ${isSelected ? 'scale-[0.82] rounded-lg shadow-sm' : 'scale-100 rounded-none'}`}>
                            {(() => {
                              const isImage = file.fileType === "IMAGE" || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.originalName || "")
                              const isVideo = file.fileType === "VIDEO" || /\.(mp4|webm|ogg|mov|mkv)$/i.test(file.originalName || "")

                              if (isImage) {
                                return (
                                  <div className="w-full h-full relative">
                                    <img 
                                      src={`/uploads/${file.bucketName}/${file.storagePath}`} 
                                      alt={file.originalName} 
                                      className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <p className="text-[11px] font-medium text-white truncate">{file.originalName}</p>
                                      <p className="text-[9px] text-white/70">{formatBytes(file.size)}</p>
                                    </div>
                                  </div>
                                )
                              }

                              if (isVideo) {
                                return (
                                  <div className="w-full h-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
                                    <video 
                                      src={`/uploads/${file.bucketName}/${file.storagePath}#t=0.1`} 
                                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-200" 
                                      preload="metadata"
                                      muted
                                      playsInline
                                    />
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                        <Play size={18} className="fill-white ml-0.5" />
                                      </div>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                                      <p className="text-[11px] font-semibold text-white truncate" title={file.originalName}>
                                        {file.originalName}
                                      </p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500/80 text-white">
                                          VIDEO
                                        </span>
                                        <span className="text-[9px] text-white/80">{formatBytes(file.size)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                <div className={`w-full h-full ${getFileBg(file.fileType)} flex flex-col items-center justify-between p-2.5 text-center relative select-none`}>
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white/75 dark:bg-black/30 flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-110">
                                      {getFileIcon(file.fileType, true)}
                                    </div>
                                  </div>
                                  <div className="w-full bg-white/85 dark:bg-black/60 backdrop-blur-xs rounded-lg py-1 px-1.5 shadow-2xs">
                                    <p className="text-[11px] font-semibold text-foreground/90 truncate" title={file.originalName}>
                                      {file.originalName}
                                    </p>
                                    <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-foreground/10 text-foreground/75">
                                        {file.originalName?.toLowerCase().endsWith(".pdf") ? "PDF" : (file.originalName.split('.').pop() || file.fileType)}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground">{formatBytes(file.size)}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                          
                          {/* Favorite Toggle Button */}
                          {(() => {
                            const isFavorited = optimisticFavorites[file.id] ?? (file.favorites && file.favorites.length > 0)
                            return (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const previousState = isFavorited
                                  setOptimisticFavorites(prev => ({ ...prev, [file.id]: !previousState }))
                                  try {
                                    const res = await fetch(`/api/files/${file.id}/favorite`, { method: "POST" })
                                    if (res.ok) {
                                      router.refresh()
                                    } else {
                                      toast.error("Failed to update favorite status")
                                      setOptimisticFavorites(prev => ({ ...prev, [file.id]: previousState }))
                                    }
                                  } catch (err) {
                                    toast.error("Failed to update favorite status")
                                    setOptimisticFavorites(prev => ({ ...prev, [file.id]: previousState }))
                                  }
                                }}
                                className={`absolute top-2 right-2 p-1.5 rounded-full flex items-center justify-center transition-all duration-150 ${isFavorited ? 'opacity-100 bg-transparent hover:bg-black/10' : 'opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/30 text-white'}`}
                                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star size={16} className={isFavorited ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : ""} />
                              </button>
                            )
                          })()}
                          
                          {/* Selection Checkmark Button */}
                          <button 
                            onClick={(e) => toggleSelection(e, file.id)}
                            className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${isSelected ? 'opacity-100 bg-blue-600 text-white border-none scale-100 shadow-md' : 'opacity-0 group-hover:opacity-100 border-2 border-white text-white/0 hover:text-slate-900 bg-white/20 hover:bg-white scale-95 hover:scale-100 shadow-sm'}`}
                          >
                            <Check size={14} strokeWidth={3} className={isSelected ? 'opacity-100' : ''} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) // closes return(
          }) // closes map(
        })()}
        </div>
        
        {/* Timeline Scrubber */}
        <div 
          className="hidden lg:block absolute right-0 top-0 bottom-0 w-16 z-40 pointer-events-auto"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setScrubberHover(prev => ({ ...prev, top: e.clientY - rect.top, isVisible: true }))
          }}
          onMouseLeave={() => setScrubberHover(prev => ({ ...prev, isVisible: false }))}
        >
          {/* Unified Floating Tooltip */}
          <div 
            className="absolute right-12 transition-all duration-[50ms] ease-linear whitespace-nowrap px-2.5 py-1 rounded-md bg-[#202124] dark:bg-white text-white dark:text-black text-[11px] font-medium pointer-events-none shadow-lg z-50"
            style={{ 
              top: `${scrubberHover.top}px`,
              transform: 'translateY(-50%)',
              opacity: scrubberHover.isVisible ? 1 : 0,
              visibility: scrubberHover.isVisible ? 'visible' : 'hidden'
            }}
          >
            {scrubberHover.label}
          </div>

          {scrubberLinks.map((link, i) => {
            const topPos = linkPositions[link.label] ?? -999;
            if (topPos === -999) return null;
            
            return link.isYearMarker ? (
              <a 
                key={`year-${link.label}-${i}`} 
                href={`#${link.id}`} 
                className="absolute right-4 text-[10px] font-bold text-muted-foreground/50 hover:text-foreground transition-colors duration-200"
                style={{ top: `${topPos}px` }}
              >
                {link.label}
              </a>
            ) : (
              <a 
                key={`month-${link.label}-${i}`} 
                href={`#${link.id}`} 
                className="absolute right-4 group flex items-center justify-end w-8 h-8 cursor-pointer -mt-3"
                style={{ top: `${topPos}px` }}
                onMouseEnter={() => setScrubberHover(prev => ({ ...prev, label: link.label }))}
              >
                {/* Dot */}
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all duration-200" />
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
