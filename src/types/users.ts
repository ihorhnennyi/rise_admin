export type AdminUserRole = 'superadmin' | 'user'

export type AdminUserRow = {
  id: string
  email: string
  role: AdminUserRole
  createdAt: string
  updatedAt: string
}

export type UsersListResponse = {
  data: AdminUserRow[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}
