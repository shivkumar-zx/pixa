"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { PixBoxLogo } from "@/components/pixbox-logo"
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
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
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

const adminNavItems: NavItem[] = [
  { label: "Users", href: "/dashboard/admin/users", icon: <Users size={18} />, adminOnly: true },
  { label: "Storage Stats", href: "/dashboard/admin/storage", icon: <HardDrive size={18} />, adminOnly: true },
]

interface SidebarProps {
  userRole?: string
  storageUsed?: number
  storageQuota?: number
}

export default function Sidebar({ userRole, storageUsed = 0, storageQuota = 100 }: SidebarProps) {
  const pathname = usePathname()

  const storagePercentage = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0
  const clampedPercentage = Math.min(100, Math.max(0, storagePercentage))
  
  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  let progressColor = "bg-green-500"
  if (clampedPercentage >= 50 && clampedPercentage < 80) {
    progressColor = "bg-yellow-500"
  } else if (clampedPercentage >= 80) {
    progressColor = "bg-red-500"
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shrink-0">
      {/* Logo */}
      <div className="flex items-center px-6 h-[72px] shrink-0 border-b border-border">
        <Link href="/dashboard/files">
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
            href={item.href}
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
        )})}

        {/* Admin section */}
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mt-6 mb-2">Admin</p>
            {adminNavItems.map((item) => {
              const active = isActive(item.href);
              return (
              <Link
                key={item.href}
                href={item.href}
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
            )})}
          </>
        )}
      </nav>

      {/* Footer / Storage */}
      <div className="px-5 py-5 border-t border-border space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-bold tracking-tight">Storage</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">{formatBytes(storageUsed)} / {formatBytes(storageQuota)}</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
            <div 
              className={cn("h-full transition-all duration-500 rounded-full", progressColor)}
              style={{ width: `${clampedPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {clampedPercentage.toFixed(1)}% used
            </p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">PixBox v1.0</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
