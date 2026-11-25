import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Info, Loader2 } from 'lucide-react'
import { Logo } from '../components/ui'
import { useAuth } from '../lib/useAuth'
import { errorMessage, supabase } from '../lib/supabase'

const inputClass =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/15'

// Pesan error Supabase Auth → bahasa Indonesia
function translate(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Email atau kata sandi salah.'
  if (/email not confirmed/i.test(msg)) return 'Email belum dikonfirmasi. Buka kotak masuk email Anda dan klik tautan konfirmasi.'
  if (/already registered/i.test(msg)) return 'Email ini sudah terdaftar. Silakan masuk.'
  if (/password should be at least/i.test(msg)) return 'Kata sandi minimal 6 karakter.'
  if (/rate limit/i.test(msg)) return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
  if (/valid email|invalid format/i.test(msg)) return 'Format email tidak valid.'
  return msg
}

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  if (session) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim(), nickname: nickname.trim() },
            emailRedirectTo: `${window.location.origin}/app`,
          },
        })
        if (error) throw error
        // Jika konfirmasi email aktif, Supabase belum memberi sesi
        if (!data.session) setCheckEmail(true)
        else navigate('/app', { replace: true })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(translate(errorMessage(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 flex w-fit">
          <Logo />
        </Link>

        <div className="card p-6 sm:p-8">
          {checkEmail ? (
            <div className="text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <h1 className="mt-4 text-xl font-extrabold text-primary">Cek email Anda</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Kami mengirim tautan konfirmasi ke <b className="text-ink">{email}</b>. Klik tautan tersebut, lalu Anda
                akan langsung masuk. Periksa juga folder spam.
              </p>
              <Link to="/masuk" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-primary">
                {isRegister ? 'Buat akun santri' : 'Selamat datang kembali'}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {isRegister ? 'Daftar untuk mulai bermain dan menyimpan progres.' : 'Masuk untuk melanjutkan permainan.'}
              </p>

              {isRegister && (
                <div className="mt-5 flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <span>Akun guru dan admin dibuat oleh pengelola lembaga, bukan lewat formulir ini.</span>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                {isRegister && (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium">Nama lengkap</span>
                      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Nama sesuai data lembaga" autoComplete="name" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium">Nickname</span>
                      <input required maxLength={24} value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} placeholder="Nama yang tampil di leaderboard" />
                    </label>
                  </>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Email</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="nama@email.com" autoComplete="email" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Kata sandi</span>
                  <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder={isRegister ? 'Minimal 6 karakter' : '••••••••'} autoComplete={isRegister ? 'new-password' : 'current-password'} />
                </label>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-light disabled:opacity-60"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  {isRegister ? 'Daftar' : 'Masuk'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                <Link to={isRegister ? '/masuk' : '/daftar'} className="font-semibold text-primary hover:underline">
                  {isRegister ? 'Masuk' : 'Daftar'}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
