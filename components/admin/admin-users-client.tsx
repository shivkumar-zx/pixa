"use client"

import * as React from "react"
import { useState } from "react"
import { Shield, HardDrive, Search, Filter, Sliders, CheckCircle2, XCircle, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { CreateUserModal } from "./create-user-modal"
import { EditQuotaModal, AdminUserItem } from "./edit-quota-modal"

interface AdminUsersClientProps {
  initialUsers: AdminUserItem[]
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const roleVariant: Record<string, "default" | "success" | "warning" | "info" | "secondary"> = {
  ADMIN: "default",
  MANAGER: "warning",
  EMPLOYEE: "success",
  FAMILY: "secondary",
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [selectedUserForQuota, setSelectedUserForQuota] = useState<AdminUserItem | null>(null)
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const refreshUsers = async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        if (data.users) {
          setUsers(data.users)
        }
      }
    } catch (e) {
      console.error("Failed to refresh users", e)
    }
  }

  const handleQuotaUpdated = (updatedUser: AdminUserItem) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    )
  }

  const handleOpenQuotaModal = (user: AdminUserItem) => {
    setSelectedUserForQuota(user)
    setIsQuotaModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user")
      }
      toast.success(`User "${deletingUser.name}" deleted successfully`)
      setDeletingUser(null)
      refreshUsers()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={22} className="text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage employee & family access, assign roles, and allocate storage quotas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateUserModal onUserCreated={refreshUsers} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Filter size={14} /> Role:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 text-xs rounded-md border border-input bg-background px-2.5 py-1 shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="FAMILY">Family</option>
          </select>
          <span className="text-xs text-muted-foreground font-mono ml-2">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">Allocated Storage</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Files</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initials = user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  const storagePercent = user.storageQuota > 0
                    ? Math.min(100, Math.round((user.storageUsed / user.storageQuota) * 100))
                    : 0

                  return (
                    <tr key={user.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 text-xs">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleVariant[user.role] ?? "secondary"}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-foreground">
                              {formatBytes(user.storageUsed)}
                            </span>
                            <span className="text-muted-foreground">
                              of {formatBytes(user.storageQuota)}
                            </span>
                          </div>
                          <Progress value={storagePercent} className="h-1.5" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{storagePercent}% used</span>
                            <span>{formatBytes(Math.max(0, user.storageQuota - user.storageUsed))} free</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-center font-medium">
                        {user.fileCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? "success" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenQuotaModal(user)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-2xs"
                            title="Increase or decrease storage quota"
                          >
                            <Sliders size={13} className="text-primary" />
                            <span>Edit Quota</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-2xs cursor-pointer"
                            title={`Delete user account ${user.name}`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quota Modal */}
      <EditQuotaModal
        user={selectedUserForQuota}
        open={isQuotaModalOpen}
        onOpenChange={setIsQuotaModalOpen}
        onQuotaUpdated={handleQuotaUpdated}
      />

      {/* Delete User Confirmation Modal */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-md border-destructive">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={22} className="text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-destructive">
                  Confirm User Deletion
                </DialogTitle>
                <DialogDescription className="text-xs">
                  This action is permanent and only Admins can perform it.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingUser && (
            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs space-y-1">
                <p className="font-semibold text-foreground">{deletingUser.name}</p>
                <p className="text-muted-foreground">{deletingUser.email}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Role: <span className="font-medium text-foreground">{deletingUser.role}</span></p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete <strong>{deletingUser.name}</strong>? All associated files, activity logs, and account access will be removed.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
