import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst() // Get the first user since we just want to test notifications

  if (!user) {
    console.log("No user found!")
    return
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: "Welcome to EmpVault!",
        message: "Your premium dashboard is ready. Start by uploading some files.",
        type: "SYSTEM",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Storage Update",
        message: "You have used 20% of your 5GB storage quota.",
        type: "STORAGE_WARNING",
        isRead: false,
      },
      {
        userId: user.id,
        title: "File Shared With You",
        message: "Admin shared 'Q3_Financial_Report.pdf' with you.",
        type: "SHARE",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Upload Complete",
        message: "Your batch of 15 images was successfully uploaded to Wallpapers.",
        type: "UPLOAD",
        isRead: false,
      }
    ]
  })

  console.log("Dummy notifications generated successfully!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
