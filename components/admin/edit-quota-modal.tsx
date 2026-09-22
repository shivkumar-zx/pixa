"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  HardDrive,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Check,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

export interface AdminUserItem {
  id: string
  name: string
  email: string
  role: string
  storageUsed: number
  storageQuota: number
  fileCount?: number
  isActive: boolean
}

interface EditQuotaModalProps {
  user: AdminUserItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuotaUpdated: (updatedUser: AdminUserItem) => void
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function EditQuotaModal({
  user,
  open,
  onOpenChange,
  onQuotaUpdated,
}: EditQuotaModalProps) {
  const [loading, setLoading] = useState(false)
  const [quotaUnit, setQuotaUnit] = useState<"GB" | "MB">("GB")
  const [quotaValue, setQuotaValue] = useState<number>(5)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  // Initialize from user whenever user changes
  useEffect(() => {
    if (user) {
      const quotaBytes = user.storageQuota
      if (quotaBytes >= 1024 * 1024 * 1024) {
        setQuotaUnit("GB")
        setQuotaValue(parseFloat((quotaBytes / (1024 * 1024 * 1024)).toFixed(2)))
      } else {
        setQuotaUnit("MB")
        setQuotaValue(parseFloat((quotaBytes / (1024 * 1024)).toFixed(2)))
      }
      setShowConfirmPopup(false)
    }
  }, [user])

  if (!user) return null

  const multiplier = quotaUnit === "GB" ? 1024 * 1024 * 1024 : 1024 * 1024
  const newQuotaBytes = Math.floor((quotaValue || 0) * multiplier)
  const quotaDifference = newQuotaBytes - user.storageQuota

  const currentPercent = user.storageQuota > 0
    ? Math.min(100, Math.round((user.storageUsed / user.storageQuota) * 100))
    : 0

  const newPercent = newQuotaBytes > 0
    ? Math.round((user.storageUsed / newQuotaBytes) * 100)
    : 100

  const isBelowUsed = newQuotaBytes < user.storageUsed

  // Quick adjust handlers
  const adjustBytes = (deltaBytes: number) => {
    const targetBytes = Math.max(1024 * 1024, newQuotaBytes + deltaBytes)
    if (quotaUnit === "GB") {
      setQuotaValue(parseFloat((targetBytes / (1024 * 1024 * 1024)).toFixed(2)))
    } else {
      setQuotaValue(parseFloat((targetBytes / (1024 * 1024)).toFixed(2)))
    }
  }

  // Minimum safe quota button
  const setMinimumSafeQuota = () => {
    const safeBytes = Math.max(1024 * 1024 * 1024, user.storageUsed)
    setQuotaUnit("GB")
    setQuotaValue(parseFloat((safeBytes / (1024 * 1024 * 1024)).toFixed(2)))
  }

  const handlePreSave = () => {
    if (newQuotaBytes <= 0) {
      toast.error("Storage quota must be greater than 0")
      return
    }

    // If decreasing below what the user has currently used, show popup confirmation!
    if (isBelowUsed) {
      setShowConfirmPopup(true)
      return
    }

    executeSave(false)
  }

  const executeSave = async (forceBelowUsed: boolean) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageQuota: newQuotaBytes,
          allowBelowUsed: forceBelowUsed,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.requiresConfirmation) {
          setShowConfirmPopup(true)
          throw new Error(data.error)
        }
        throw new Error(data.error || "Failed to update storage quota")
      }

      toast.success(`Updated storage quota for ${user.name} to ${formatBytes(newQuotaBytes)}`)
      onQuotaUpdated(data.user)
      setShowConfirmPopup(false)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update quota")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardDrive size={18} className="text-primary" />
              </div>
              <DialogTitle className="text-lg font-bold">Manage Storage Quota</DialogTitle>
            </div>
            <DialogDescription>
              Increase or decrease the storage memory limit for <span className="font-semibold text-foreground">{user.name}</span> ({user.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current Usage Status */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Currently Used Storage</span>
                <span className="font-semibold">
                  {formatBytes(user.storageUsed)} of {formatBytes(user.storageQuota)} ({currentPercent}%)
                </span>
              </div>
              <Progress value={Math.min(100, currentPercent)} className="h-2" />
            </div>

            {/* Quick Adjustment (Increase / Decrease) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Adjust Quota
                </Label>
                {user.storageUsed > 0 && (
                  <button
                    type="button"
                    onClick={setMinimumSafeQuota}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Reset to Used ({formatBytes(user.storageUsed)})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight size={14} /> Increase
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustBytes(1 * 1024 * 1024 * 1024)}
                      className="text-xs px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium transition-colors"
                    >
                      +1 GB
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBytes(5 * 1024 * 1024 * 1024)}
                      className="text-xs px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium transition-colors"
                    >
                      +5 GB
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBytes(10 * 1024 * 1024 * 1024)}
                      className="text-xs px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium transition-colors"
                    >
                      +10 GB
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <ArrowDownRight size={14} /> Decrease
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustBytes(-1 * 1024 * 1024 * 1024)}
                      className="text-xs px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-medium transition-colors"
                    >
                      -1 GB
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBytes(-5 * 1024 * 1024 * 1024)}
                      className="text-xs px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-medium transition-colors"
                    >
                      -5 GB
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Custom Quota Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-quota-input" className="text-xs font-semibold">
                  New Allocated Storage Limit
                </Label>
                {quotaDifference !== 0 && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      quotaDifference > 0
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                        : "text-amber-700 dark:text-amber-400 bg-amber-500/10"
                    }`}
                  >
                    {quotaDifference > 0 ? `+${formatBytes(quotaDifference)}` : `-${formatBytes(Math.abs(quotaDifference))}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  id="edit-quota-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={quotaValue || ""}
                  onChange={(e) => setQuotaValue(parseFloat(e.target.value) || 0)}
                  className={`h-9 ${isBelowUsed ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
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

            {/* Prominent Warning if reducing below current usage */}
            {isBelowUsed && (
              <div className="p-3 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={16} className="shrink-0 text-destructive" />
                  <span>Quota Below Currently Used Files!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-destructive/90">
                  This user currently stores <strong>{formatBytes(user.storageUsed)}</strong>. Setting the quota to <strong>{formatBytes(newQuotaBytes)}</strong> means they will be at <strong>{newPercent}%</strong> capacity.
                </p>
                <p className="text-[11px] font-medium text-destructive/90">
                  Saving this will trigger a confirmation popup, and will block the user from uploading any new files until files are deleted.
                </p>
              </div>
            )}

            {/* Preview of New Status */}
            <div className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>New Quota Preview:</span>
                <span className="font-semibold text-foreground">{formatBytes(newQuotaBytes)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Capacity Usage:</span>
                <span className={`font-semibold ${isBelowUsed ? "text-destructive font-bold" : "text-foreground"}`}>
                  {newPercent}%
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePreSave}
              disabled={loading || newQuotaBytes <= 0}
              variant={isBelowUsed ? "destructive" : "default"}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : isBelowUsed ? (
                <>
                  <AlertTriangle size={16} /> Review & Apply Restriction
                </>
              ) : (
                <>
                  <Check size={16} /> Save New Quota
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dedicated Confirmation Popup if reducing below current usage */}
      <Dialog open={showConfirmPopup} onOpenChange={setShowConfirmPopup}>
        <DialogContent className="sm:max-w-md border-destructive">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ShieldAlert size={22} className="text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-destructive">
                  Confirm Storage Restriction
                </DialogTitle>
                <DialogDescription className="text-xs">
                  High-impact action: User is currently using more space than this new limit.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Current Active Files:</span>
                <span className="text-foreground">{formatBytes(user.storageUsed)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Proposed New Quota:</span>
                <span className="text-destructive font-bold">{formatBytes(newQuotaBytes)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Over-Quota Excess:</span>
                <span className="text-destructive font-bold">
                  +{formatBytes(user.storageUsed - newQuotaBytes)} ({newPercent}% used)
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              If you proceed, <strong>{user.name}</strong> will be placed in an <strong>Over Quota</strong> state. Their existing files will remain safe and downloadable, but they will be <strong>strictly blocked from uploading any new files</strong> until they delete existing files or their quota is increased.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmPopup(false)}
              disabled={loading}
            >
              Cancel (Keep Safe Quota)
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => executeSave(true)}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Applying...
                </>
              ) : (
                <>
                  <AlertTriangle size={16} /> Yes, Decrease Quota
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
