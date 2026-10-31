import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// false jika .env.local belum diisi — aplikasi menampilkan petunjuk, bukan layar kosong
export const isSupabaseConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing-key')

// Pesan error dari server (raise exception) sudah berbahasa Indonesia
export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message)
  return 'Terjadi kesalahan. Coba lagi.'
}
