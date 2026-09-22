"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Camera, User, Mail, AtSign, KeyRound, Lock, Eye, EyeOff } from "lucide-react"

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState("")
  const [role, setRole] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setName(data.user.name || "")
            setUsername(data.user.username || "")
            setEmail(data.user.email || "")
            setAvatar(data.user.avatar || "")
            setRole(data.user.role || "")
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err)
      } finally {
        setIsFetching(false)
      }
    }
    loadProfile()
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Password mismatch", {
        description: "New password and confirmation password do not match.",
      })
      return
    }

    if (newPassword && newPassword.length < 6) {
      toast.error("Weak password", {
        description: "New password must be at least 6 characters long.",
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          avatar,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Profile updated", {
          description: data.message || "Your profile and credentials have been updated successfully.",
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error("Update failed", {
          description: data.error || "Failed to update profile settings.",
        })
      }
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "An unexpected error occurred.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm text-center text-muted-foreground text-sm">
        Loading profile settings...
      </div>
    )
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground tracking-tight">Personal & Account Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Update your username, email address, and login credentials.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Avatar / Profile Header */}
        <div className="flex items-center gap-x-6">
          <div className="relative group cursor-pointer">
            <div className="h-20 w-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-500/20 overflow-hidden relative">
              <span className="relative z-10">{name ? name.charAt(0).toUpperCase() : "U"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">{name || "User"}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Role: <strong className="uppercase text-foreground">{role || "EMPLOYEE"}</strong>
            </p>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="space-y-5 max-w-xl">
          {/* Full Name */}
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-indigo-500" /> Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              required
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
          </div>

          {/* Username */}
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AtSign size={14} className="text-indigo-500" /> Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alexrivera"
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
            <p className="text-[12px] text-muted-foreground">
              You can log in using either your username or email address.
            </p>
          </div>

          {/* Email Address */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={14} className="text-indigo-500" /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              required
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
          </div>
        </div>

        {/* Security / Password Section */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-5 max-w-xl">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <KeyRound size={16} className="text-indigo-500" /> Change Password
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">Leave blank if you do not wish to change your password.</p>
          </div>

          <div className="grid gap-4">
            {/* Current Password */}
            <div className="grid gap-2">
              <Label htmlFor="currentPassword" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-brand-gradient hover:opacity-90 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all font-semibold px-8"
          >
            {isLoading ? "Saving changes..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
