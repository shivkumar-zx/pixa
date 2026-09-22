import React, { useState, useEffect } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Bell, Search, LogOut, Settings, User, Moon, Sun, Upload, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export default function Topbar({ user = { name: "Admin User", email: "admin@pixbox.com", role: "ADMIN" }, onOpenMobileMenu }) {
  const [isDark, setIsDark] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentQ = searchParams.get("q") || ""
  const [search, setSearch] = useState(currentQ)

  useEffect(() => {
    setSearch(currentQ)
  }, [currentQ])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (location.pathname.startsWith("/dashboard/files")) {
        const newParams = new URLSearchParams(searchParams)
        if (search) {
          newParams.set("q", search)
        } else {
          newParams.delete("q")
        }
        setSearchParams(newParams)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const dark = saved === "dark"
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("theme", next ? "dark" : "light")
    if (next) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AU"

  return (
    <header className="h-[72px] border-b border-border bg-[var(--sidebar-bg)] flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2 sm:gap-4">
      {/* Mobile Hamburger Menu (screens <= 1024px) */}
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
        <Button asChild variant="ghost" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
          <Link to="/dashboard/upload" title="Upload">
            <Upload size={18} />
          </Link>
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <Button asChild variant="ghost" size="icon" className="relative rounded-full">
          <Link to="/dashboard/notifications">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} />
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
              <Link to="/dashboard/settings" className="flex items-center w-full cursor-pointer">
                <User size={14} className="mr-2 shrink-0" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="flex items-center w-full cursor-pointer">
                <Settings size={14} className="mr-2 shrink-0" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer font-medium"
              onClick={handleSignOut}
            >
              <LogOut size={14} className="mr-2 shrink-0 text-red-500" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
