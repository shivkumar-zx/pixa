import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { TrashClient } from "./trash-client"

export default async function TrashPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!

  const trashedFiles = await prisma.file.findMany({
    where: { uploadedById: userId, status: "DELETED" },
    orderBy: { deletedAt: "desc" },
  })

  const serializedFiles = trashedFiles.map((f) => ({
    ...f,
    size: Number(f.size),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    deletedAt: f.deletedAt ? f.deletedAt.toISOString() : null,
  }))

  return <TrashClient initialFiles={serializedFiles} />
}

