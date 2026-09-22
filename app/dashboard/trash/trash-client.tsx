"use client"

import { useState } from "react"
import { Trash2, RotateCcw, XCircle, Loader2, ImageIcon, Video, FileText, FileArchive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

function getFileIcon(type: string) {
  switch (type) {
    case "IMAGE": return <ImageIcon size={20} className="text-violet-500" />
    case "VIDEO": return <Video size={20} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={20} className="text-emerald-500" />
    default: return <FileArchive size={20} className="text-orange-500" />
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function TrashClient({ initialFiles }: { initialFiles: any[] }) {
  const router = useRouter()
  const [files, setFiles] = useState(initialFiles)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [purgingId, setPurgingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)

  const handleRestore = async (id: string, name: string) => {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/files/${id}/restore`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Restored "${name}" to All Files`)
        setFiles(prev => prev.filter(f => f.id !== id))
        router.refresh()
      } else {
        toast.error(data.error || "Failed to restore file")
      }
    } catch (err) {
      toast.error("Failed to restore file")
    } finally {
      setRestoringId(null)
    }
  }

  const handlePurge = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return
    setPurgingId(id)
    try {
      const res = await fetch(`/api/files/${id}/purge`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Permanently deleted "${name}"`)
        setFiles(prev => prev.filter(f => f.id !== id))
        router.refresh()
      } else {
        toast.error(data.error || "Failed to purge file")
      }
    } catch (err) {
      toast.error("Failed to purge file")
    } finally {
      setPurgingId(null)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to empty the trash? All items will be permanently deleted.")) return
    setClearingAll(true)
    try {
      for (const f of files) {
        await fetch(`/api/files/${f.id}/purge`, { method: "DELETE" })
      }
      toast.success("Trash emptied completely")
      setFiles([])
      router.refresh()
    } catch (err) {
      toast.error("Error emptying trash")
    } finally {
      setClearingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 size={24} className="text-destructive" /> Trash
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {files.length} deleted file{files.length !== 1 ? "s" : ""} · Items in trash can be restored or permanently purged
          </p>
        </div>
        {files.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleEmptyTrash} 
            disabled={clearingAll}
            className="gap-2 rounded-xl shadow-sm"
          >
            {clearingAll ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            Empty Trash
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Trash2 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Trash is empty</h3>
          <p className="text-muted-foreground text-sm mt-1">Deleted files will appear here until restored or purged.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="group hover:shadow-md transition-all border-border bg-card/60 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(Number(file.size))}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Deleted {new Date(file.deletedAt || file.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRestore(file.id, file.originalName)}
                    disabled={restoringId === file.id}
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all shadow-2xs"
                    title="Restore file"
                  >
                    {restoringId === file.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  </button>
                  <button
                    onClick={() => handlePurge(file.id, file.originalName)}
                    disabled={purgingId === file.id}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all shadow-2xs"
                    title="Delete permanently"
                  >
                    {purgingId === file.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
