import React, { useState, useEffect } from "react"
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"
import LoginPage from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import FilesPage from "./pages/FilesPage"
import UploadPage from "./pages/UploadPage"
import { 
  FoldersPage, 
  FavoritesPage, 
  SharedPage, 
  TrashPage, 
  ActivityPage, 
  NotificationsPage, 
  SettingsPage, 
  UsersPage, 
  StoragePage 
} from "./pages/FoldersPage"

function DashboardLayout({ user }) {
  const [storageStats, setStorageStats] = useState({ storageUsed: 0, storageQuota: 5368709120 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await fetch("/api/files/storage")
        if (res.ok) {
          const data = await res.json()
          setStorageStats(data)
        }
      } catch {}
    }
    fetchStorage()
    const interval = setInterval(fetchStorage, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar (lg: >=1024px) */}
      <div className="hidden lg:flex h-full">
        <Sidebar userRole={user?.role || "ADMIN"} storageUsed={storageStats.storageUsed} storageQuota={storageStats.storageQuota} />
      </div>

      {/* Mobile Drawer (screens <= 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-card h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 transition-colors z-20"
            >
              ✕
            </button>
            <div className="h-full overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
              <Sidebar userRole={user?.role || "ADMIN"} storageUsed={storageStats.storageUsed} storageQuota={storageStats.storageQuota} />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={user} onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


export default function App() {
  const [user, setUser] = useState({
    name: "Admin User",
    email: "admin@company.com",
    role: "ADMIN"
  })

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={(u) => setUser(u)} />} />
      <Route path="/dashboard" element={<DashboardLayout user={user} />}>
        <Route index element={<Dashboard />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="folders" element={<FoldersPage />} />
        <Route path="shared" element={<SharedPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/storage" element={<StoragePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard/files" replace />} />
    </Routes>
  )
}
