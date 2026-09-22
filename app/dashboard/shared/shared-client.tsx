"use client"

import { useState } from "react"
import { Share2, FileText, ImageIcon, Video, FileArchive, Download, Eye, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const baseUrl = process.env.NEXT_PUBLIC_HOSTINGER_BASE_URL || ""

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

export function SharedClient({ initialShares }: { initialShares: any[] }) {
  const [shares] = useState(initialShares)
  const [previewFile, setPreviewFile] = useState<any | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 size={24} className="text-primary" /> Shared With Me
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {shares.length} file{shares.length !== 1 ? "s" : ""} shared directly with your account
          </p>
        </div>
      </div>

      {shares.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Share2 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Nothing shared yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Files shared with you will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map((share) => (
            <Card key={share.id} className="group hover:shadow-md transition-all border-border bg-card/60 backdrop-blur">
              <CardContent className="p-4 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getFileIcon(share.file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{share.file.originalName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(Number(share.file.size))}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Shared by <span className="font-medium text-foreground">{share.sharedBy?.name || "User"}</span>
                  </p>
                  {share.expiresAt && (
                    <Badge variant="warning" className="mt-1.5 text-[10px]">
                      Expires {new Date(share.expiresAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewFile(share.file)}
                    className="p-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all shadow-2xs"
                    title="Preview file"
                  >
                    <Eye size={16} />
                  </button>
                  <a
                    href={`/api/files/${share.file.id}/download`}
                    download
                    className="p-2 rounded-xl bg-muted hover:bg-foreground hover:text-background text-muted-foreground transition-all shadow-2xs"
                    title="Download file"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 relative shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {getFileIcon(previewFile.fileType)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{previewFile.originalName}</h3>
                <p className="text-xs text-muted-foreground">{formatBytes(Number(previewFile.size))}</p>
              </div>
            </div>

            <div className="border border-border flex-1 w-full bg-black flex items-center justify-center p-4 rounded-xl overflow-hidden">
              {previewFile.fileType === "IMAGE" ? (
                <img
                  src={previewFile.url || `${baseUrl}/uploads/${previewFile.storedName}`}
                  alt={previewFile.originalName}
                  className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded"
                />
              ) : previewFile.fileType === "VIDEO" ? (
                <video
                  src={previewFile.url || `${baseUrl}/uploads/${previewFile.storedName}`}
                  controls
                  className="max-w-full max-h-[70vh] shadow-2xl rounded"
                />
              ) : (previewFile.mimeType === "application/pdf" || (previewFile.originalName || "").toLowerCase().endsWith(".pdf")) ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-full flex justify-end mb-2">
                    <a
                      href={previewFile.url || `${baseUrl}/uploads/${previewFile.storedName}`}
                      download={previewFile.originalName}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  </div>
                  <iframe
                    src={`${previewFile.url || `${baseUrl}/uploads/${previewFile.storedName}`}#view=FitH&toolbar=1`}
                    className="w-full h-[65vh] bg-white rounded shadow-2xl"
                    title={previewFile.originalName}
                  />
                </div>
              ) : (
                <div className="text-center space-y-3 py-6">
                  <FileText size={48} className="mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Direct Preview Not Supported for This File Type</p>
                  <Button asChild size="sm">
                    <a href={`/api/files/${previewFile.id}/download`} download>
                      <Download size={15} className="mr-1.5" /> Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
