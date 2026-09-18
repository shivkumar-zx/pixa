import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { HardDrive, TrendingUp, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { StorageConsumersClient } from "@/components/admin/storage-consumers-client"

function formatBytes(bytes: bigint): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default async function AdminStoragePage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/dashboard")

  // Calculate global storage stats
  const users = await prisma.user.findMany({
    select: {
      id: true,
      storageUsed: true,
      storageQuota: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
    orderBy: { storageUsed: "desc" },
    take: 50,
  })

  let totalUsed = BigInt(0)
  let totalQuota = BigInt(0)

  users.forEach((u) => {
    totalUsed += u.storageUsed
    totalQuota += u.storageQuota
  })

  const globalPercent =
    totalQuota > 0
      ? Math.min(100, Math.round((Number(totalUsed) / Number(totalQuota)) * 100))
      : 0

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    storageUsed: Number(u.storageUsed),
    storageQuota: Number(u.storageQuota),
    isActive: u.isActive,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive size={22} className="text-primary" /> System Storage
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor overall system storage, view allocations, and adjust user quotas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <HardDrive className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Storage Used</p>
                <h3 className="text-2xl font-bold">{formatBytes(totalUsed)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Allocated Quota</p>
                <h3 className="text-2xl font-bold">{formatBytes(totalQuota)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Users className="text-emerald-500" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users Tracked</p>
                <h3 className="text-2xl font-bold">{users.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Storage Bar */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-2">Global Usage Allocation</h3>
          <Progress value={globalPercent} className="h-4 w-full mb-2" />
          <p className="text-sm text-muted-foreground">
            {globalPercent}% of allocated quota used ({formatBytes(totalUsed)} / {formatBytes(totalQuota)})
          </p>
        </CardContent>
      </Card>

      {/* Interactive Top Consumers Table */}
      <div>
        <h3 className="text-base font-semibold mb-3">User Allocations & Consumption</h3>
        <StorageConsumersClient initialUsers={serializedUsers} />
      </div>
    </div>
  )
}
