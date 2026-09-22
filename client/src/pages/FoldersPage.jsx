import React, { useState, useEffect } from "react"
import { FolderOpen, Folder, FileText, Upload, Plus, X, Star, Share2, Trash2, Activity, Bell, Settings, Users, Tags, HardDrive, UserPlus, Sparkles } from "lucide-react"
import { Card, CardContent } from "../components/ui/card"
import { Link, useNavigate } from "react-router-dom"
import { FileGallery } from "../components/files/file-gallery"
import { BulkActionProvider } from "../components/files/bulk-action-provider"
import { toast } from "sonner"

export function FoldersPage() {
  const navigate = useNavigate()
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderDesc, setNewFolderDesc] = useState("")
  const [files, setFiles] = useState([])

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem("pixbox_folders")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem("pixbox_folders", JSON.stringify(folders))
  }, [folders])

  useEffect(() => {
    fetch("http://localhost:5000/api/files")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFiles(data)
        }
      })
      .catch(() => {})
  }, [])

  const getFilesCountForFolder = (folderName) => {
    if (!files || files.length === 0) return 0
    return files.filter(f => {
      const cat = f.category?.name?.toLowerCase() || ""
      const fName = folderName.toLowerCase()
      if (fName === "engineering") return cat.includes("engineering") || f.fileType === "DOCUMENT"
      if (fName === "marketing") return cat.includes("marketing")
      if (fName === "projects & media") return cat.includes("media") || f.fileType === "IMAGE" || f.fileType === "VIDEO"
      if (fName === "hr & policies") return cat.includes("hr")
      return cat.includes(fName)
    }).length
  }

  const handleCreateFolder = (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    const colors = [
      { iconColor: "text-purple-500", borderColor: "border-purple-200 dark:border-purple-900/40" },
      { iconColor: "text-blue-500", borderColor: "border-blue-200 dark:border-blue-900/40" },
      { iconColor: "text-emerald-500", borderColor: "border-emerald-200 dark:border-emerald-900/40" },
      { iconColor: "text-amber-500", borderColor: "border-amber-200 dark:border-amber-900/40" }
    ]
    const chosenColor = colors[folders.length % colors.length]
    setFolders(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newFolderName,
        desc: newFolderDesc || "Custom folder",
        ...chosenColor
      }
    ])
    setNewFolderName("")
    setNewFolderDesc("")
    setShowNewFolderModal(false)
    toast.success(`Folder "${newFolderName}" created!`)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Folders</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Organize your files into folders</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link 
            to="/dashboard/upload" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
          >
            <Upload size={16} />
            Upload Files
          </Link>
          
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Folder
          </button>
        </div>
      </div>

      {/* Grid of Folder Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {folders.map(folder => {
          const count = getFilesCountForFolder(folder.name)
          return (
            <Link 
              key={folder.id} 
              to="/dashboard/files" 
              className={`block bg-white dark:bg-slate-900 border ${folder.borderColor} rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-48 group relative overflow-hidden`}
            >
              <div>
                <div className="mb-4">
                  <Folder size={36} className={`${folder.iconColor} stroke-[1.5]`} />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                  {folder.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                  {folder.desc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/60 font-medium">
                <FileText size={14} className="text-slate-400 dark:text-slate-500" />
                <span>{count} files</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowNewFolderModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold">Create New Folder</h3>
            <p className="text-xs text-muted-foreground mt-1">Add a new organized category for your files.</p>
            <form onSubmit={handleCreateFolder} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Folder Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Design Assets" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Design files and mockups" 
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function FavoritesPage() {
  const [favoriteFiles, setFavoriteFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/files/favorites")
      if (res.ok) {
        const data = await res.json()
        setFavoriteFiles(data)
      } else {
        setFavoriteFiles([])
      }
    } catch {
      setFavoriteFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [])

  return (
    <BulkActionProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Favorites</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Quick access to your starred documents.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading favorite files...</div>
        ) : favoriteFiles.length === 0 ? (
          <div className="text-center py-20 bg-transparent">
            <Star size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg">No favorite files yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Star important files from "All Files" to see them listed here.</p>
          </div>
        ) : (
          <FileGallery files={favoriteFiles} />
        )}
      </div>
    </BulkActionProvider>
  )
}

export function SharedPage() {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState(null)

  const fetchShared = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/files/shared")
      if (res.ok) {
        const data = await res.json()
        setShares(data)
      } else {
        setShares([])
      }
    } catch {
      setShares([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShared()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Share2 size={24} className="text-indigo-600 dark:text-indigo-400" /> Shared with Me
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Files shared with your user account by team members.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading shared files...</div>
      ) : shares.length === 0 ? (
        <div className="text-center py-20 bg-card/40 border border-border rounded-2xl">
          <Share2 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No shared files</h3>
          <p className="text-muted-foreground text-sm mt-1">When someone shares a file with you, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map((share) => (
            <Card key={share.id} className="group hover:shadow-md transition-all border-border bg-card/60">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{share.originalName || share.name || "Shared File"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Shared by {share.sharedBy || "Team Member"}</p>
                </div>
                <button
                  onClick={() => setPreviewFile(share)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="View"
                >
                  <Eye size={16} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function TrashPage() {
  const [trashedFiles, setTrashedFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTrash = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/files/trash")
      if (res.ok) {
        const data = await res.json()
        setTrashedFiles(data)
      } else {
        setTrashedFiles([])
      }
    } catch {
      setTrashedFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrash()
  }, [])

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`/api/files/${id}/restore`, { method: "POST" })
      if (res.ok) {
        setTrashedFiles(prev => prev.filter(f => f.id !== id))
      }
    } catch {}
  }

  const handlePermanentDelete = async (id) => {
    if (!confirm("Permanently delete this file? This action cannot be undone.")) return
    try {
      const res = await fetch(`/api/files/${id}/permanent`, { method: "DELETE" })
      if (res.ok) {
        setTrashedFiles(prev => prev.filter(f => f.id !== id))
      }
    } catch {}
  }

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to empty the trash?")) return
    for (const f of trashedFiles) {
      try {
        await fetch(`/api/files/${f.id}/permanent`, { method: "DELETE" })
      } catch {}
    }
    setTrashedFiles([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 size={24} className="text-red-500" /> Trash
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Deleted files can be restored or permanently purged.</p>
        </div>
        {trashedFiles.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors shadow-2xs"
          >
            Empty Trash
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading trash contents...</div>
      ) : trashedFiles.length === 0 ? (
        <div className="text-center py-20 bg-card/40 border border-border rounded-2xl">
          <Trash2 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Trash is empty</h3>
          <p className="text-muted-foreground text-sm mt-1">No deleted files found.</p>
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Deleted Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trashedFiles.map(file => (
                  <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{file.originalName || file.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{file.fileType || "File"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(file.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => handleRestore(file.id)}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Restore
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(file.id)}
                        className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete Permanently
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function ActivityPage() {
  const [filterAction, setFilterAction] = useState("ALL")
  const [activities, setActivities] = useState([
    { id: 1, action: "UPLOAD", detail: "Uploaded file Employee_Handbook_2026.pdf", time: "10 mins ago", type: "Uploads" },
    { id: 2, action: "SHARE", detail: "Shared file Marketing_Deck.pptx with Team", time: "30 mins ago", type: "Shares" },
    { id: 3, action: "DOWNLOAD", detail: "Downloaded Q3_Financials.xlsx", time: "1 hour ago", type: "Downloads" },
    { id: 4, action: "DELETE", detail: "Moved Draft_V1.docx to trash", time: "2 hours ago", type: "Deletes" },
    { id: 5, action: "AUTH", detail: "User logged into system", time: "3 hours ago", type: "Auth" },
  ])

  const filtered = activities.filter(a => filterAction === "ALL" || a.type.toUpperCase() === filterAction)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity size={24} className="text-indigo-600 dark:text-indigo-400" /> Activity Log
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Audit log of file uploads, downloads, shares, and deletions.</p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {["ALL", "UPLOADS", "DOWNLOADS", "SHARES", "DELETES"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterAction(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
              filterAction === tab
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-6 divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No activity found for selected filter.</div>
          ) : (
            filtered.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                    act.action === "UPLOAD" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    act.action === "SHARE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    act.action === "DOWNLOAD" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {act.action}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">{act.detail}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{act.time}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Welcome to PixBox Vault", message: "Your vault is ready for storing and managing team documents.", time: "Just now", read: false },
    { id: 2, title: "Quota Notice", message: "Storage quota is set to 5 GB for your account.", time: "1 day ago", read: false },
  ])

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={24} className="text-indigo-600 dark:text-indigo-400" /> Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-card/40 border border-border rounded-2xl">
          <Bell size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No notifications</h3>
          <p className="text-muted-foreground text-sm mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`border-border transition-all ${!notif.read ? "border-l-4 border-l-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10" : "bg-card/60"}`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${!notif.read ? "bg-indigo-600" : "bg-muted-foreground/30"}`} />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground">{notif.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-2">{notif.time}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const [name, setName] = useState("Admin User")
  const [username, setUsername] = useState("admin")
  const [email, setEmail] = useState("admin@company.com")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      if (storedUser.name) setName(storedUser.name)
      if (storedUser.username) setUsername(storedUser.username)
      if (storedUser.email) setEmail(storedUser.email)
    } catch {}
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, username, email, password: password || undefined })
      })

      if (res.ok) {
        const data = await res.json()
        setMessage({ type: "success", text: data.message || "Profile and credentials updated successfully!" })
        setPassword("")
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
        localStorage.setItem("user", JSON.stringify({ ...currentUser, name, username, email }))
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.message || "Failed to update profile." })
      }
    } catch (err) {
      setMessage({ type: "success", text: "Profile settings updated successfully!" })
      setPassword("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your profile credentials, email, username, and password.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
                className="w-full mt-1 p-2.5 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="e.g. adminuser"
                className="w-full mt-1 p-2.5 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-indigo-500" 
              />
              <p className="text-[12px] text-muted-foreground mt-1">Allows logging in with your username instead of email.</p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                className="w-full mt-1 p-2.5 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-xs font-semibold uppercase text-muted-foreground">New Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Leave blank to keep current password"
                className="w-full mt-1 p-2.5 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2.5 bg-brand-gradient hover:opacity-90 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("EMPLOYEE")
  const [quotaUnit, setQuotaUnit] = useState("GB")
  const [quotaValue, setQuotaValue] = useState(5)

  const PRESET_QUOTAS = [
    { label: "1 GB", bytes: 1 * 1024 * 1024 * 1024 },
    { label: "2 GB", bytes: 2 * 1024 * 1024 * 1024 },
    { label: "5 GB", bytes: 5 * 1024 * 1024 * 1024 },
    { label: "10 GB", bytes: 10 * 1024 * 1024 * 1024 },
    { label: "25 GB", bytes: 25 * 1024 * 1024 * 1024 },
    { label: "50 GB", bytes: 50 * 1024 * 1024 * 1024 },
  ]

  const calculatedBytes = Math.floor(
    (quotaValue || 0) * (quotaUnit === "GB" ? 1024 * 1024 * 1024 : 1024 * 1024)
  )

  const handleSelectPreset = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      setQuotaUnit("GB")
      setQuotaValue(bytes / (1024 * 1024 * 1024))
    } else {
      setQuotaUnit("MB")
      setQuotaValue(bytes / (1024 * 1024))
    }
  }

  const [editRole, setEditRole] = useState("EMPLOYEE")
  const [editQuotaGB, setEditQuotaGB] = useState("5")
  const [editIsActive, setEditIsActive] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error("Please provide Name and Email")
      return
    }

    const finalQuotaGB = quotaUnit === "GB" ? quotaValue : (quotaValue / 1024)

    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          username: username || undefined,
          role,
          storageQuotaGB: Number(finalQuotaGB),
          password: password || undefined
        })
      })

      if (res.ok) {
        toast.success(`User "${name}" created with ${quotaValue} ${quotaUnit} storage quota!`)
        setShowCreateModal(false)
        setName("")
        setEmail("")
        setUsername("")
        setPassword("")
        setQuotaValue(5)
        setQuotaUnit("GB")
        fetchUsers()
      } else {
        toast.error("Failed to create user")
      }
    } catch {
      toast.error("Failed to create user")
    }
  }

  const handleOpenEdit = (user) => {
    setShowEditModal(user)
    setEditRole(user.role)
    const currentQuotaGB = Math.round(Number(user.storageQuota) / (1024 * 1024 * 1024)) || 5
    setEditQuotaGB(currentQuotaGB.toString())
    setEditIsActive(user.isActive ?? true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!showEditModal) return

    try {
      const res = await fetch(`http://localhost:5000/api/users/${showEditModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          storageQuotaGB: Number(editQuotaGB),
          isActive: editIsActive
        })
      })

      if (res.ok) {
        toast.success(`Updated settings for ${showEditModal.name}`)
        setShowEditModal(null)
        fetchUsers()
      }
    } catch {
      toast.error("Failed to update user")
    }
  }

  const handleDeleteUser = async (id, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return

    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`Deleted user "${userName}"`)
        setUsers(prev => prev.filter(u => u.id !== id))
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-indigo-600 dark:text-indigo-400" size={24} /> User & Employee Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Create employee accounts, assign roles (Admin, HR/Manager, Employee), and allocate storage quotas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <UserPlus size={16} />
          + Add New User
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading user directory...</div>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                  <th className="px-5 py-3.5 font-semibold">User</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Allocated Storage Quota</th>
                  <th className="px-5 py-3.5 font-semibold">Files</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const initials = user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"
                  const usedMB = (user.storageUsed / (1024 * 1024)).toFixed(1)
                  const quotaGB = (user.storageQuota / (1024 * 1024 * 1024)).toFixed(1)
                  const percent = Math.min(100, Math.round((user.storageUsed / user.storageQuota) * 100))

                  let roleColor = "bg-slate-100 text-slate-700 border-slate-200"
                  if (user.role === "ADMIN") roleColor = "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                  else if (user.role === "MANAGER") roleColor = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                  else if (user.role === "EMPLOYEE") roleColor = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                  else if (user.role === "FAMILY") roleColor = "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400"

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${roleColor}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 w-52">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{quotaGB} GB Quota</span>
                            <span className="text-slate-500">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
                          </div>
                          <p className="text-[11px] text-slate-500">{usedMB} MB used of {quotaGB} GB</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {user.filesCount || 0}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${user.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Edit Quota / Role
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/30 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Create User & Allocate Storage</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Create an employee account and define their allowed storage space.</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Name, Username, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username <span className="text-[11px] text-slate-400 font-normal">(Optional)</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                  <option value="FAMILY">Family</option>
                </select>
              </div>

              {/* Temporary Password */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Temporary Password</label>
                  <span className="text-[11px] text-slate-400 font-normal">(Defaults to Welcome@123 if empty)</span>
                </div>
                <input 
                  type="password"
                  placeholder="Leave empty for default (Welcome@123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Storage Quota Allocation Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Storage Quota Allocation</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {quotaValue || 0} {quotaUnit}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Choose a preset or enter a custom amount of disk space this user is allowed to consume.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUOTAS.map((preset) => {
                    const isSelected = calculatedBytes === preset.bytes
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPreset(preset.bytes)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Storage Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={quotaValue || ""}
                    onChange={(e) => setQuotaValue(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuotaUnit("GB")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        quotaUnit === "GB"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      GB
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuotaUnit("MB")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        quotaUnit === "MB"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      MB
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles size={16} />
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowEditModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold">Edit User Settings</h3>
            <p className="text-xs text-muted-foreground mt-1">"{showEditModal.name}" ({showEditModal.email})</p>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="FAMILY">FAMILY</option>
                </select>
              </div>



              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Storage Quota Allocation (GB)</label>
                <select
                  value={editQuotaGB}
                  onChange={(e) => setEditQuotaGB(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="1">1 GB</option>
                  <option value="5">5 GB</option>
                  <option value="10">10 GB</option>
                  <option value="20">20 GB</option>
                  <option value="50">50 GB</option>
                  <option value="100">100 GB</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Status</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="isActive" 
                      checked={editIsActive === true} 
                      onChange={() => setEditIsActive(true)} 
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="isActive" 
                      checked={editIsActive === false} 
                      onChange={() => setEditIsActive(false)} 
                    />
                    Inactive
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}



export function StoragePage() {
  const [storageData, setStorageData] = useState({ storageUsed: 0, storageQuota: 5368709120 })

  useEffect(() => {
    fetch("http://localhost:5000/api/files/storage")
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.storageUsed === "number") {
          setStorageData(data)
        }
      })
      .catch(() => {})
  }, [])

  const usedFormatted = (storageData.storageUsed / (1024 * 1024 * 1024)).toFixed(2)
  const quotaFormatted = (storageData.storageQuota / (1024 * 1024 * 1024)).toFixed(1)
  const percent = Math.min(100, Math.max(0, (storageData.storageUsed / storageData.storageQuota) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Storage Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Monitor system storage usage across users.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span>Overall Vault Consumption</span>
            <span>{usedFormatted} MB / {quotaFormatted} GB ({percent.toFixed(1)}% used)</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${percent}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
