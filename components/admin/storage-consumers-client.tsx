"use client"

import * as React from "react"
import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Sliders } from "lucide-react"
import { EditQuotaModal, AdminUserItem } from "./edit-quota-modal"

interface StorageConsumersClientProps {
  initialUsers: AdminUserItem[]
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function StorageConsumersClient({ initialUsers }: StorageConsumersClientProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers)
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleQuotaUpdated = (updatedUser: AdminUserItem) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    )
  }

  const openEditModal = (user: AdminUserItem) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Used</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allocated Quota</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usage %</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const percent = user.storageQuota > 0
                    ? Math.min(100, Math.round((user.storageUsed / user.storageQuota) * 100))
                    : 0
                  return (
                    <tr key={user.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{formatBytes(user.storageUsed)}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                        {formatBytes(user.storageQuota)}
                      </td>
                      <td className="px-6 py-4 w-60">
                        <div className="flex items-center gap-3">
                          <Progress value={percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10 font-mono">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-2xs"
                        >
                          <Sliders size={13} className="text-primary" />
                          <span>Adjust Quota</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditQuotaModal
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onQuotaUpdated={handleQuotaUpdated}
      />
    </>
  )
}
