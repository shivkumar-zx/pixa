import { z } from "zod"

const roleEnum = z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "FAMILY"])

export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(2, "Username must be at least 2 characters").optional().nullable(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: roleEnum.default("EMPLOYEE"),
  storageQuota: z.coerce.number().positive("Storage quota must be greater than 0").optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  storageQuota: z.coerce.number().positive("Storage quota must be greater than 0").optional(),
})

