import React, { useState } from "react"
import { Upload, File, X, CheckCircle2, AlertCircle, FileText, ImageIcon, Video, FileArchive, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { formatBytes } from "../lib/utils"

function getFileIcon(type) {
  if (type.startsWith("image/")) return <ImageIcon size={20} className="text-violet-500 shrink-0" />
  if (type.startsWith("video/")) return <Video size={20} className="text-blue-500 shrink-0" />
  if (type.includes("pdf") || type.includes("word") || type.includes("text")) return <FileText size={20} className="text-emerald-500 shrink-0" />
  return <FileArchive size={20} className="text-orange-500 shrink-0" />
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [category, setCategory] = useState("General")

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload")
      return
    }

    setIsUploading(true)

    // Try backend upload
    const formData = new FormData()
    selectedFiles.forEach(file => {
      formData.append("files", file)
    })
    formData.append("category", category)

    try {
      await fetch("http://localhost:5000/api/files/bulk-upload", {
        method: "POST",
        body: formData
      })
    } catch {}

    // Always create local Data URL representations for browser storage
    const newFileObjects = await Promise.all(selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        const mime = file.type || ""
        let fileType = "DOCUMENT"
        if (mime.startsWith("image/")) fileType = "IMAGE"
        else if (mime.startsWith("video/")) fileType = "VIDEO"

        reader.onload = (evt) => {
          resolve({
            id: (Date.now() + Math.random()).toString(),
            originalName: file.name,
            fileType: fileType,
            size: file.size,
            url: evt.target.result,
            createdAt: new Date().toISOString(),
            category: { name: category || "General" },
            isFavorite: false
          })
        }
        reader.readAsDataURL(file)
      })
    }))

    const existing = JSON.parse(localStorage.getItem("pixbox_files") || "[]")
    localStorage.setItem("pixbox_files", JSON.stringify([...newFileObjects, ...existing]))

    toast.success(`Successfully uploaded ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}!`)
    setIsUploading(false)
    navigate("/dashboard/files")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Upload Documents</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Select and upload multiple files at once to your secure vault.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Category Select */}
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Assign Category / Folder</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="General">General</option>
                <option value="HR">HR Documents</option>
                <option value="Finance">Finance & Invoices</option>
                <option value="Legal">Legal Contracts</option>
                <option value="Marketing">Marketing Assets</option>
                <option value="Media">Media & Photos</option>
              </select>
            </div>

            {/* Drag and drop multi-file input */}
            <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 text-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <p className="font-semibold text-sm">Click or drag & drop multiple files here</p>
              <p className="text-xs text-muted-foreground mt-1">Upload images, PDFs, Word docs, spreadsheets, or ZIP archives</p>
            </div>

            {/* Selected files queue */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Selected Queue ({selectedFiles.length})</span>
                  <span>Total: {formatBytes(totalSize)}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-xl text-sm font-medium group hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getFileIcon(file.type)}
                        <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">({formatBytes(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={selectedFiles.length === 0 || isUploading} className="w-full h-11 text-base font-semibold">
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Uploading {selectedFiles.length} files...
                </>
              ) : (
                `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} File${selectedFiles.length === 1 ? '' : 's'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
