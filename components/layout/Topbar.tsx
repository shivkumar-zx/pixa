"use client"

import { signOut } from "next-auth/react"
import { Bell, Search, LogOut, Settings, User, Moon, Sun, Upload, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

interface TopbarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
  onOpenMobileMenu?: () => void
}

export default function Topbar({ user, onOpenMobileMenu }: TopbarProps) {
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentQ = searchParams.get("q") || ""
  const [search, setSearch] = useState(currentQ)

  useEffect(() => {
    setSearch(currentQ)
  }, [currentQ])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pathname.startsWith("/dashboard/files")) {
        const params = new URLSearchParams(searchParams.toString())
        if (search) {
          params.set("q", search)
        } else {
          params.delete("q")
        }
        router.push(`${pathname}?${params.toString()}`)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const categoryId = searchParams.get("category")
  const uploadUrl = categoryId && pathname.startsWith("/dashboard/files")
    ? `/dashboard/upload?category=${categoryId}`
    : "/dashboard/upload"

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const dark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(dark)
    document.documentElement.classList.toggle("dark", dark)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("theme", next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <header className="h-[72px] border-b border-border bg-[var(--sidebar-bg)] flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2 sm:gap-4">
      {/* Mobile Hamburger Menu (visible on screens <= 1024px) */}
      <div className="flex items-center gap-2 lg:hidden">
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
            className="rounded-xl text-foreground hover:bg-muted"
            title="Toggle Menu"
          >
            <Menu size={22} />
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex-1 flex justify-center max-w-xl">
        <div className="flex items-center gap-2 sm:gap-3 bg-card border border-border hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 rounded-full px-3.5 py-1.5 sm:py-2 w-full text-xs sm:text-sm text-foreground transition-all">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search your files..."
            className="bg-transparent border-none outline-none w-full placeholder:text-muted-foreground font-medium text-foreground text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>


      {/* Actions */}
      <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
        {/* Upload button with visible icon and text */}
        <Button asChild className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm h-9 px-3.5 gap-2 shrink-0 shadow-xs">
          <Link href={uploadUrl} title="Upload Files">
            <Upload size={16} />
            <span className="font-semibold">Upload</span>
          </Link>
        </Button>


        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Notifications */}
        <Button asChild variant="ghost" size="icon" className="relative rounded-full">
          <Link href="/dashboard/notifications">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.role && (
                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                  {user.role}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile" className="flex items-center w-full cursor-pointer">
                <User size={14} className="mr-2 shrink-0" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center w-full cursor-pointer">
                <Settings size={14} className="mr-2 shrink-0" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer font-medium"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={14} className="mr-2 shrink-0 text-red-500" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
