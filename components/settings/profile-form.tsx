"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      })
    }, 1000)
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm">
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="flex items-center gap-x-6">
          <div className="relative group cursor-pointer">
            <div className="h-24 w-24 rounded-full bg-brand-gradient flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-indigo-500/20 overflow-hidden relative">
              <span className="relative z-10 group-hover:opacity-0 transition-opacity">U</span>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="avatarUrl" className="text-slate-600 dark:text-slate-400 font-medium">Avatar URL</Label>
            <Input id="avatarUrl" placeholder="https://github.com/shadcn.png" className="w-[300px] rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors" />
            <p className="text-[13px] text-muted-foreground mt-1">
              Provide a URL to an image for your avatar.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-600 dark:text-slate-400 font-medium">Full Name</Label>
            <Input id="name" placeholder="John Doe" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors max-w-md" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department" className="text-slate-600 dark:text-slate-400 font-medium">Department</Label>
            <Input id="department" placeholder="Engineering" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors max-w-md" />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-brand-gradient hover:opacity-90 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all font-semibold px-8"
        >
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  )
}
