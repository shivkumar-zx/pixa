import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
    role?: string
  }

  let storageUsed = BigInt(0)
  let storageQuota = BigInt(5368709120) // 5GB default

  if (user.id) {
    const [dbUser, fileAggregate] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { storageUsed: true, storageQuota: true },
      }),
      prisma.file.aggregate({
        where: {
          uploadedById: user.id,
          status: "ACTIVE"
        },
        _sum: { size: true }
      })
    ])

    if (dbUser) {
      storageQuota = dbUser.storageQuota
      const realUsed = fileAggregate._sum.size ?? BigInt(0)
      storageUsed = realUsed

      // Sync user table in the background if out of sync
      if (dbUser.storageUsed !== realUsed) {
        prisma.user.update({
          where: { id: user.id },
          data: { storageUsed: realUsed }
        }).catch(() => {})
      }
    }
  }

  return (
    <DashboardLayoutClient
      user={user}
      storageUsed={Number(storageUsed)}
      storageQuota={Number(storageQuota)}
    >
      {children}
    </DashboardLayoutClient>
  )
}


