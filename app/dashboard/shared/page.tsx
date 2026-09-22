import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { SharedClient } from "./shared-client"

export default async function SharedPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!

  const shares = await prisma.fileShare.findMany({
    where: { sharedWithId: userId },
    include: {
      file: { include: { uploadedBy: { select: { name: true } } } },
      sharedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const serializedShares = shares.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    file: {
      ...s.file,
      size: Number(s.file.size),
      createdAt: s.file.createdAt.toISOString(),
      updatedAt: s.file.updatedAt.toISOString(),
    },
  }))

  return <SharedClient initialShares={serializedShares} />
}

