"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export function AccountForm() {
  const [isLoading, setIsLoading] = useState(false)

  // Example data that would normally come from the user session/database
  const user = {
    email: "user@example.com",
    role: "EMPLOYEE",
    storageUsed: 1073741824, // 1GB
    storageQuota: 5368709120, // 5GB
  }
  
  const storagePercentage = (user.storageUsed / user.storageQuota) * 100

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Account updated", {
        description: "Your account settings have been updated.",
      })
    }, 1000)
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-slate-600 dark:text-slate-400 font-medium">Email</Label>
            <Input id="email" type="email" defaultValue={user.email} disabled className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-md opacity-70" />
            <p className="text-[13px] text-muted-foreground mt-1">
              Your email address is managed by your administrator.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role" className="text-slate-600 dark:text-slate-400 font-medium">Role</Label>
            <Input id="role" defaultValue={user.role} disabled className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-md opacity-70" />
          </div>
          
          <div className="space-y-3 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 max-w-md">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-700 dark:text-slate-300 font-bold">Storage Usage</span>
              <span className="text-indigo-600 dark:text-indigo-400">{storagePercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-brand-gradient rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              You have used <strong className="text-slate-700 dark:text-slate-300">{(user.storageUsed / (1024*1024*1024)).toFixed(2)} GB</strong> of your {(user.storageQuota / (1024*1024*1024)).toFixed(2)} GB quota.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
