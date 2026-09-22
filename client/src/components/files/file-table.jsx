import React, { useState } from "react"
import { Badge } from "../ui/badge"
import { Download, Trash2, Share2, FileText, ImageIcon, Video, FileArchive, Check, Copy, MessageCircle } from "lucide-react"
import { useBulkAction } from "./bulk-action-provider"
import { formatBytes } from "../../lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { toast } from "sonner"

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

export function FileTable({ files = [], onDelete }) {
  const { selectedFiles, toggleFile, toggleAll } = useBulkAction()
  const [shareFile, setShareFile] = useState(null)
  const [copied, setCopied] = useState(false)

  const allSelected = files.length > 0 && files.every(f => selectedFiles.has(f.id))
  const someSelected = files.some(f => selectedFiles.has(f.id))

  const handleSelectAll = () => {
    toggleAll(files.map(f => f.id), !allSelected)
  }

  const handleCopyShareLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Share link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const currentFileUrl = shareFile ? `http://localhost:5000/api/files/${shareFile.id}/download` : ""
  const encodedUrl = encodeURIComponent(currentFileUrl)
  const encodedTitle = encodeURIComponent(shareFile ? `Check out ${shareFile.originalName} on PixBox` : "")

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden mt-4 shadow-xs">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  ref={input => { if (input) input.indeterminate = someSelected && !allSelected }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Size</th>
              <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Uploaded By</th>
              <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {files.map(file => {
              const isSelected = selectedFiles.has(file.id)
              return (
                <tr 
                  key={file.id} 
                  className={`hover:bg-accent/40 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleFile(file.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${getFileBg(file.fileType)}`}>
                        {getFileIcon(file.fileType)}
                      </div>
                      <span className="font-medium hover:text-primary transition-colors max-w-[200px] sm:max-w-xs truncate cursor-pointer">
                        {file.originalName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {file.category ? (
                      <Badge variant="secondary" className="font-normal text-xs">{file.category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatBytes(file.size)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{file.uploadedBy?.name || "User"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{new Date(file.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`http://localhost:5000/api/files/${file.id}/download`} download className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Download">
                        <Download size={14} />
                      </a>
                      <button onClick={() => setShareFile(file)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Share">
                        <Share2 size={14} />
                      </button>
                      <button onClick={() => onDelete && onDelete(file.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Share Dialog */}
      {shareFile && (
        <Dialog open={!!shareFile} onOpenChange={() => setShareFile(null)}>
          <DialogContent className="sm:max-w-md text-foreground rounded-2xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Share File</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Share this file directly via WhatsApp or copy the link below.
              </DialogDescription>
            </DialogHeader>

            {/* File Card Preview */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                {shareFile.fileType === "IMAGE" ? (
                  <img src={`/uploads/${shareFile.bucketName}/${shareFile.storagePath}`} alt={shareFile.originalName} className="w-full h-full object-cover" />
                ) : (
                  getFileIcon(shareFile.fileType)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{shareFile.originalName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(shareFile.size)} • {shareFile.fileType}</p>
              </div>
            </div>

            {/* Dedicated WhatsApp Share Button */}
            <div>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out "${shareFile.originalName}" on PixBox:\nhttp://localhost:3001/uploads/${shareFile.bucketName}/${shareFile.storagePath}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full"
              >
                <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/20 transition-all text-sm">
                  <MessageCircle className="h-5 w-5 fill-current" />
                  Share on WhatsApp
                </Button>
              </a>
            </div>

            {/* Copy Direct Link */}
            <div className="pt-3 border-t border-border space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direct Link</label>
              <div className="flex items-center gap-2">
                <Input readOnly value={`http://localhost:3001/uploads/${shareFile.bucketName}/${shareFile.storagePath}`} className="flex-1 text-xs rounded-xl font-mono bg-muted/50" />
                <Button size="sm" onClick={() => handleCopyShareLink(`http://localhost:3001/uploads/${shareFile.bucketName}/${shareFile.storagePath}`)} title="Copy Link" className="rounded-xl px-4 gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
