import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  role: 'super_admin' | 'institution_admin' | 'teacher' | 'student' | 'parent'
  full_name: string
  nickname: string
  avatar_url: string | null
  institution_id: string | null
}

export interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
