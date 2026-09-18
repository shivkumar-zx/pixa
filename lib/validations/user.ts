import { z } from "zod"

const roleEnum = z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"])

export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: roleEnum.default("EMPLOYEE"),
  department: z.string().optional().nullable(),
  storageQuota: z.coerce.number().positive("Storage quota must be greater than 0").optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleEnum.optional(),
  department: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  storageQuota: z.coerce.number().positive("Storage quota must be greater than 0").optional(),
})

