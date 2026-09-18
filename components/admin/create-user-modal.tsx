"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, HardDrive, Shield, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreateUserModalProps {
  onUserCreated?: () => void
}

const PRESET_QUOTAS = [
  { label: "1 GB", bytes: 1 * 1024 * 1024 * 1024 },
  { label: "2 GB", bytes: 2 * 1024 * 1024 * 1024 },
  { label: "5 GB", bytes: 5 * 1024 * 1024 * 1024 },
  { label: "10 GB", bytes: 10 * 1024 * 1024 * 1024 },
  { label: "25 GB", bytes: 25 * 1024 * 1024 * 1024 },
  { label: "50 GB", bytes: 50 * 1024 * 1024 * 1024 },
]

export function CreateUserModal({ onUserCreated }: CreateUserModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "EMPLOYEE" | "VIEWER">("EMPLOYEE")
  const [department, setDepartment] = useState("")

  // Storage Allocation State
  const [quotaUnit, setQuotaUnit] = useState<"GB" | "MB">("GB")
  const [quotaValue, setQuotaValue] = useState<number>(5)

  // Compute bytes from quotaValue and quotaUnit
  const calculatedBytes = Math.floor(
    (quotaValue || 0) * (quotaUnit === "GB" ? 1024 * 1024 * 1024 : 1024 * 1024)
  )

  const handleSelectPreset = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      setQuotaUnit("GB")
      setQuotaValue(bytes / (1024 * 1024 * 1024))
    } else {
      setQuotaUnit("MB")
      setQuotaValue(bytes / (1024 * 1024))
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole("EMPLOYEE")
    setDepartment("")
    setQuotaUnit("GB")
    setQuotaValue(5)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter the user's name")
      return
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    if (calculatedBytes <= 0) {
      toast.error("Storage quota must be greater than 0")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim() || undefined,
          role,
          department: department.trim() || undefined,
          storageQuota: calculatedBytes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      toast.success(
        `User ${data.user.name} created with ${quotaValue} ${quotaUnit} storage!`,
        {
          description: data.temporaryPassword
            ? `Default Password: ${data.temporaryPassword}`
            : undefined,
          duration: 6000,
        }
      )

      resetForm()
      setOpen(false)
      if (onUserCreated) {
        onUserCreated()
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg px-4 py-2 transition-all shadow-sm">
            <UserPlus size={16} />
            <span>+ Add New User</span>
          </button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus size={18} className="text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">Create User & Allocate Storage</DialogTitle>
          </div>
          <DialogDescription>
            Create an employee account and define their allowed storage space.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-semibold">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-name"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-xs font-semibold">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-role" className="text-xs font-semibold">
                Role
              </Label>
              <select
                id="create-role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-department" className="text-xs font-semibold">
                Department
              </Label>
              <Input
                id="create-department"
                placeholder="e.g. Engineering, Sales"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          {/* Optional Initial Password */}
          <div className="space-y-1.5">
            <Label htmlFor="create-password" className="text-xs font-semibold flex items-center justify-between">
              <span>Temporary Password</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                (Defaults to Welcome@123 if empty)
              </span>
            </Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Leave empty for default (Welcome@123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Storage Quota Allocation Section */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-primary" />
                <Label className="text-sm font-semibold">Storage Quota Allocation</Label>
              </div>
              <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {quotaValue || 0} {quotaUnit}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Choose a preset or enter a custom amount of disk space this user is allowed to consume.
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUOTAS.map((preset) => {
                const isSelected = calculatedBytes === preset.bytes
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset.bytes)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Custom Storage Input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  value={quotaValue || ""}
                  onChange={(e) => setQuotaValue(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  className="h-9"
                />
              </div>
              <div className="flex rounded-md border border-input bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setQuotaUnit("GB")}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    quotaUnit === "GB"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  GB
                </button>
                <button
                  type="button"
                  onClick={() => setQuotaUnit("MB")}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    quotaUnit === "MB"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  MB
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
