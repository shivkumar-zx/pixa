import React, { useState, useMemo, useRef, useEffect } from "react"
import { Download, Trash2, Share2, FileText, ImageIcon, Video, FileArchive, Check, Star } from "lucide-react"
import { useBulkAction } from "./bulk-action-provider"
import { PhotoViewer } from "./photo-viewer"
import { toast } from "sonner"

function formatBytes(bytes) {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type, large = false) {
  const size = large ? 24 : 18
  switch (type) {
    case "IMAGE": return <ImageIcon size={size} className="text-violet-500" />
    case "VIDEO": return <Video size={size} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={size} className="text-emerald-500" />
    default: return <FileArchive size={size} className="text-orange-500" />
  }
}

function getFileBg(type) {
  switch (type) {
    case "IMAGE": return "bg-violet-100 dark:bg-violet-900/20"
    case "VIDEO": return "bg-blue-100 dark:bg-blue-900/20"
    case "DOCUMENT": return "bg-emerald-100 dark:bg-emerald-900/20"
    default: return "bg-orange-100 dark:bg-orange-900/20"
  }
}

export function FileGallery({ files = [], onDelete }) {
  const { selectedFiles, toggleFile, toggleAll } = useBulkAction()
  const [viewingFileId, setViewingFileId] = useState(null)
  const [localFavorites, setLocalFavorites] = useState({})
  const [scrubberHover, setScrubberHover] = useState({ label: "", top: 0, isVisible: false })
  const galleryRef = useRef(null)
  const [linkPositions, setLinkPositions] = useState({})

  const selectionMode = selectedFiles.size > 0

  const handleToggleFavorite = async (e, fileId, currentFavState) => {
    e.stopPropagation()
    e.preventDefault()

    const newFavState = !currentFavState
    setLocalFavorites(prev => ({ ...prev, [fileId]: newFavState }))

    try {
      const res = await fetch(`http://localhost:5000/api/files/${fileId}/favorite`, {
        method: "POST"
      })
      if (res.ok) {
        toast.success(newFavState ? "Added to Favorites" : "Removed from Favorites")
      }
    } catch {
      toast.success(newFavState ? "Added to Favorites" : "Removed from Favorites")
    }
  }

  // Group files by date
  const groupedFiles = useMemo(() => {
    const groups = []
    let currentLabel = ""
    files.forEach(file => {
      const dateObj = new Date(file.createdAt)
      const dateLabel = dateObj.toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      })
      if (currentLabel !== dateLabel) {
        currentLabel = dateLabel
        groups.push({
          dateLabel,
          id: `date-${dateObj.getTime()}`,
          files: []
        })
      }
      groups[groups.length - 1].files.push(file)
    })
    return groups
  }, [files])

  // Generate scrubber links
  const scrubberLinks = useMemo(() => {
    const links = []
    const seenMonths = new Set()
    const seenYears = new Set()

    groupedFiles.forEach(group => {
      if (group.files[0]) {
        const date = new Date(group.files[0].createdAt)
        const year = date.getFullYear().toString()
        const monthYear = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

        if (!seenYears.has(year)) {
          seenYears.add(year)
          links.push({ isYearMarker: true, label: year, id: group.id })
        }

        if (!seenMonths.has(monthYear)) {
          seenMonths.add(monthYear)
          links.push({ isYearMarker: false, label: monthYear, id: group.id, count: group.files.length })
        }
      }
    })
    return links
  }, [groupedFiles])

  useEffect(() => {
    const updatePositions = () => {
      if (!galleryRef.current) return
      const positions = {}
      scrubberLinks.forEach(link => {
        const el = document.getElementById(link.id)
        if (el) {
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

  const handleItemClick = (e, id) => {
    if (selectionMode) {
      toggleFile(id)
    } else {
      setViewingFileId(id)
    }
  }

  return (
    <>
      {viewingFileId && (
        <PhotoViewer 
          files={files} 
          initialFileId={viewingFileId} 
          onClose={() => setViewingFileId(null)} 
          onDelete={onDelete}
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
                    <h2 className="text-2xl font-bold mt-8 mb-4 tracking-tight text-foreground/90">
                      {groupMonthYear}
                    </h2>
                  )}
                  <div id={group.id} className="mb-8 group/date">
                    <div className="group/header sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-3 mb-2 flex items-center gap-3 w-fit pr-4 rounded-r-xl">
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
                        const isFav = localFavorites[file.id] ?? (file.isFavorite || (file.favorites && file.favorites.length > 0))
                        
                        return (
                          <div 
                            key={file.id} 
                            onClick={(e) => handleItemClick(e, file.id)}
                            className={`group relative aspect-square flex items-center justify-center cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-muted'}`}
                          >
                            {/* Image / Icon container */}
                            <div className={`w-full h-full overflow-hidden transition-all duration-200 ease-out ${isSelected ? 'scale-[0.82] rounded-lg shadow-sm' : 'scale-100 rounded-none'}`}>
                              {file.fileType === "IMAGE" ? (
                                <img 
                                  src={file.url || `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80`} 
                                  alt={file.originalName} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className={`w-full h-full ${getFileBg(file.fileType)} flex flex-col items-center justify-center p-3 text-center`}>
                                  {getFileIcon(file.fileType, true)}
                                  <span className="text-xs font-medium mt-2 truncate max-w-full px-2">{file.originalName}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Favorite Toggle Button */}
                            <button
                              onClick={(e) => handleToggleFavorite(e, file.id, isFav)}
                              className={`absolute top-2 right-2 p-1.5 rounded-full flex items-center justify-center transition-all duration-150 z-20 ${isFav ? 'opacity-100 bg-black/40 text-yellow-400' : 'opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/40 text-white'}`}
                              title={isFav ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star size={16} className={isFav ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : ""} />
                            </button>
                            
                            {/* Selection Checkmark Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFile(file.id)
                              }}
                              className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 z-20 ${isSelected ? 'opacity-100 bg-blue-600 text-white border-none scale-100 shadow-md' : 'opacity-0 group-hover:opacity-100 border-2 border-white text-white/0 hover:text-slate-900 bg-white/20 hover:bg-white scale-95 hover:scale-100 shadow-sm'}`}
                            >
                              <Check size={14} strokeWidth={3} className={isSelected ? 'opacity-100' : ''} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })
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
          {/* Floating Tooltip */}
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
