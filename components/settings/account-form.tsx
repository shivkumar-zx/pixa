"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { User, Mail, Shield, HardDrive, Edit3 } from "lucide-react"

export function AccountForm() {
  const [user, setUser] = useState<{
    email: string
    username: string
    name: string
    role: string
    storageUsed: number
    storageQuota: number
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (err) {
        console.error("Failed to fetch user account details:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm text-center text-sm text-muted-foreground">
        Loading account details...
      </div>
    )
  }

  const storageUsed = user?.storageUsed || 0
  const storageQuota = user?.storageQuota || 5368709120
  const storagePercentage = storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-5">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">Account Information</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Overview of your account credentials and system limits.</p>
        </div>
        <Link
          href="/dashboard/settings/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all"
        >
          <Edit3 size={14} />
          Edit Profile & Password
        </Link>
      </div>

      <div className="space-y-5 max-w-md">
        {/* Full Name */}
        <div className="grid gap-2">
          <Label className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <User size={14} /> Full Name
          </Label>
          <Input value={user?.name || ""} disabled className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-medium" />
        </div>

        {/* Username */}
        <div className="grid gap-2">
          <Label className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <User size={14} /> Username
          </Label>
          <Input value={user?.username || "Not set"} disabled className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-medium" />
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <Label className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <Mail size={14} /> Email Address
          </Label>
          <Input value={user?.email || ""} disabled className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-medium" />
        </div>

        {/* Role */}
        <div className="grid gap-2">
          <Label className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <Shield size={14} /> Access Role
          </Label>
          <Input value={user?.role || "EMPLOYEE"} disabled className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-bold uppercase" />
        </div>

        {/* Storage Bar */}
        <div className="space-y-3 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
              <HardDrive size={14} /> Storage Usage
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{storagePercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-brand-gradient rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Used <strong className="text-slate-700 dark:text-slate-300">{(storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB</strong> of {(storageQuota / (1024 * 1024 * 1024)).toFixed(2)} GB total quota.
          </p>
        </div>
      </div>
    </div>
  )
}
