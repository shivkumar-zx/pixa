import { User } from "@prisma/client"

export const ROLE_HIERARCHY: Record<string, number> = {
  FAMILY: 1,
  EMPLOYEE: 2,
  MANAGER: 3,
  ADMIN: 4,
}

export type Action = 
  | "create_file"
  | "delete_own_file"
  | "delete_any_file"
  | "manage_users"
  | "view_all_files"

/**
 * Checks if a role has permission to perform a generic action based on role hierarchy
 */
export function hasPermission(userRole: string, action: Action): boolean {
  switch (action) {
    case "create_file":
    case "delete_own_file":
      return (ROLE_HIERARCHY[userRole] || 0) >= ROLE_HIERARCHY.EMPLOYEE
    case "delete_any_file":
    case "manage_users":
    case "view_all_files":
      return (ROLE_HIERARCHY[userRole] || 0) >= ROLE_HIERARCHY.ADMIN
    default:
      return false
  }
}
