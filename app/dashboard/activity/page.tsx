import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ActivityClient } from "./activity-client"

export default async function ActivityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!
  const role = (session.user as { role?: string }).role

  const logs = await prisma.activityLog.findMany({
    where: role === "ADMIN" || role === "MANAGER" ? {} : { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      file: { select: { originalName: true } },
    },
  })

  const serializedLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }))

  return <ActivityClient initialLogs={serializedLogs} />
}

