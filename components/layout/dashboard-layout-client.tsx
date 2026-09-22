"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Toaster } from "sonner"
import { X } from "lucide-react"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
    role?: string
  }
  storageUsed: number
  storageQuota: number
}

export function DashboardLayoutClient({
  children,
  user,
  storageUsed,
  storageQuota,
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (visible on lg: >=1024px) */}
      <div className="hidden lg:flex h-full">
        <Sidebar
          userRole={user.role}
          storageUsed={storageUsed}
          storageQuota={storageQuota}
        />
      </div>

      {/* Mobile Drawer (visible when open on screens <= 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding Content */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-card h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="h-full overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
              <Sidebar
                userRole={user.role}
                storageUsed={storageUsed}
                storageQuota={storageQuota}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={user} onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 scrollbar-thin">
          {children}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  )
}
