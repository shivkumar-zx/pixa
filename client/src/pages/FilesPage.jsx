import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Files, Upload } from "lucide-react"
import { BulkActionProvider } from "../components/files/bulk-action-provider"
import { BulkActionBar } from "../components/files/bulk-action-bar"
import { FileFilters } from "../components/files/file-filters"
import { FileGallery } from "../components/files/file-gallery"
import { FileTable } from "../components/files/file-table"

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("grid")
  const [filterType, setFilterType] = useState("All")
  const [dateFilter, setDateFilter] = useState({ year: "", month: "", day: "" })

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFiles(data)
        localStorage.setItem("pixbox_files", JSON.stringify(data))
      } else {
        const local = localStorage.getItem("pixbox_files")
        setFiles(local ? JSON.parse(local) : [])
      }
    } catch {
      const local = localStorage.getItem("pixbox_files")
      setFiles(local ? JSON.parse(local) : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`http://localhost:5000/api/files/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}

    const updated = files.filter(f => f.id !== id)
    const deletedItem = files.find(f => f.id === id)
    setFiles(updated)
    localStorage.setItem("pixbox_files", JSON.stringify(updated))

    if (deletedItem) {
      const existingTrash = JSON.parse(localStorage.getItem("pixbox_trash") || "[]")
      localStorage.setItem("pixbox_trash", JSON.stringify([deletedItem, ...existingTrash]))
    }
  }

  const filteredFiles = files.filter(f => {
    if (filterType === "Images") return f.fileType === "IMAGE"
    if (filterType === "Videos") return f.fileType === "VIDEO"
    if (filterType === "Documents") return f.fileType === "DOCUMENT"
    return true
  })

  return (
    <BulkActionProvider>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Files</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{filteredFiles.length} files total</p>
          </div>
        </div>

        {/* Liquid Glass Filter Bar & View Toggle */}
        <FileFilters 
          currentType={filterType} 
          onTypeChange={setFilterType}
          viewMode={viewMode}
          onViewChange={setViewMode}
          year={dateFilter.year}
          month={dateFilter.month}
          day={dateFilter.day}
          onDateChange={setDateFilter}
        />

        {/* Files Content */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-transparent">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <Files size={32} />
            </div>
            <h3 className="font-semibold text-lg tracking-tight">No files found</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              Try adjusting your filters or upload a new file to get started.
            </p>
            <Link
              to="/dashboard/upload"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient hover:opacity-95 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={16} />
              Upload File
            </Link>
          </div>
        ) : viewMode === "list" ? (
          <FileTable files={filteredFiles} onDelete={handleDelete} />
        ) : (
          <FileGallery files={filteredFiles} onDelete={handleDelete} />
        )}

        <BulkActionBar onRefresh={fetchFiles} />
      </div>
    </BulkActionProvider>
  )
}
