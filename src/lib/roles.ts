import type { Profile } from './useAuth'

type Role = Profile['role'] | undefined

export const isStaff = (r: Role) => r === 'teacher' || r === 'institution_admin' || r === 'super_admin'
export const isAdmin = (r: Role) => r === 'institution_admin' || r === 'super_admin'

export const ROLE_LABEL: Record<Profile['role'], string> = {
  super_admin: 'Super Admin',
  institution_admin: 'Admin Lembaga',
  teacher: 'Guru',
  student: 'Santri',
  parent: 'Orang Tua',
}
