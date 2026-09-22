import React from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { PixBoxLogo } from "../PixBoxLogo"
import {
  LayoutDashboard,
  Files,
  Upload,
  FolderOpen,
  Share2,
  Trash2,
  Activity,
  Bell,
  Users,
  HardDrive,
  ChevronRight,
  Settings,
  Star,
} from "lucide-react"
import { cn } from "../../lib/utils"

const navItems = [
  { label: "All Files", href: "/dashboard/files", icon: <Files size={18} /> },
  { label: "Favorites", href: "/dashboard/favorites", icon: <Star size={18} /> },
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Upload", href: "/dashboard/upload", icon: <Upload size={18} /> },
  { label: "My Folders", href: "/dashboard/folders", icon: <FolderOpen size={18} /> },
  { label: "Shared with Me", href: "/dashboard/shared", icon: <Share2 size={18} /> },
  { label: "Trash", href: "/dashboard/trash", icon: <Trash2 size={18} /> },
  { label: "Activity Log", href: "/dashboard/activity", icon: <Activity size={18} /> },
  { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={18} /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
]

const adminNavItems = [
  { label: "Users", href: "/dashboard/admin/users", icon: <Users size={18} />, adminOnly: true },
  { label: "Storage Stats", href: "/dashboard/admin/storage", icon: <HardDrive size={18} />, adminOnly: true },
]

export default function Sidebar({ userRole = "ADMIN", storageUsed = 0, storageQuota = 5368709120 }) {
  const location = useLocation()
  const pathname = location.pathname

  const storagePercentage = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0
  const clampedPercentage = Math.min(100, Math.max(0, storagePercentage))

  let progressColor = "bg-green-500"
  if (clampedPercentage >= 50 && clampedPercentage < 80) {
    progressColor = "bg-yellow-500"
  } else if (clampedPercentage >= 80) {
    progressColor = "bg-red-500"
  }

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shrink-0 border-r border-border">
      {/* Logo */}
      <div className="flex items-center px-6 h-[72px] shrink-0 border-b border-border">
        <Link to="/dashboard/files">
          <PixBoxLogo size={32} showText={true} />
        </Link>
      </div>


      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">Main</p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 group z-10",
                active
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-brand-gradient rounded-xl shadow-md shadow-indigo-500/20 z-[-1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className={cn(
                "transition-colors",
                active ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-brand-gradient dark:group-hover:text-indigo-400"
              )}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <ChevronRight size={14} className="ml-auto text-white/80" />
              )}
            </Link>
          )
        })}

        {/* Admin section */}
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mt-6 mb-2">Admin</p>
            {adminNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 group z-10",
                    active
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-brand-gradient rounded-xl shadow-md shadow-indigo-500/20 z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className={cn(
                    "transition-colors",
                    active ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-brand-gradient dark:group-hover:text-indigo-400"
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer / Storage */}
      <div className="px-5 py-5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-900 dark:text-slate-100 font-bold tracking-tight">Storage</span>
            <span className="text-slate-700 dark:text-slate-400 font-medium">{formatBytes(storageUsed)} / {formatBytes(storageQuota)}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700/80">
            <div 
              className={cn("h-full transition-all duration-500 rounded-full", progressColor)}
              style={{ width: `${clampedPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {clampedPercentage.toFixed(1)}% used
            </p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">PixBox v1.0</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
