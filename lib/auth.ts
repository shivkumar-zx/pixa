import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const rawInput = (credentials.email as string).trim()
        const identifier = rawInput.toLowerCase()
        const strippedIdentifier = identifier.replace(/\s+/g, "")

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
              { username: strippedIdentifier },
              { name: rawInput },
            ]
          },
        })

        if (!user) {
          const allUsers = await prisma.user.findMany()
          user = allUsers.find((u) => {
            const normName = u.name.toLowerCase().replace(/\s+/g, "")
            const normUser = u.username ? u.username.toLowerCase().replace(/\s+/g, "") : ""
            return (
              (normName && normName === strippedIdentifier) ||
              (normUser && normUser === strippedIdentifier) ||
              (normName && normName.includes(strippedIdentifier)) ||
              (normUser && normUser.includes(strippedIdentifier)) ||
              (normName && strippedIdentifier.includes(normName))
            )
          }) || null
        }

        if (!user || !user.isActive) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
