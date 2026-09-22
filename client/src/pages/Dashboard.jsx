import React, { useState, useEffect } from "react"
import { Files, HardDrive, Users, FolderOpen, ArrowUpRight, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Link } from "react-router-dom"
import { formatBytes } from "../lib/utils"

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalStorage: 0,
    storageQuota: 5368709120, // 5GB
    recentFiles: []
  })

  useEffect(() => {
    fetch("http://localhost:5000/api/files")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const totalSize = data.reduce((acc, curr) => acc + Number(curr.size || 0), 0)
          setStats({
            totalFiles: data.length,
            totalStorage: totalSize,
            storageQuota: 5368709120,
            recentFiles: data.slice(0, 5)
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your vault storage and recent file activities.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
            <Files className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">Active documents in vault</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.totalStorage)}</div>
            <p className="text-xs text-muted-foreground mt-1">of {formatBytes(stats.storageQuota)} total</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Action</CardTitle>
            <Upload className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <Link 
              to="/dashboard/upload" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-1"
            >
              Upload new file <ArrowUpRight size={16} />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent files uploaded yet. <Link to="/dashboard/upload" className="text-primary underline">Upload one now</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentFiles.map(file => (
                <div key={file.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Link to="/dashboard/files" className="text-xs font-semibold text-primary hover:underline">View</Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
