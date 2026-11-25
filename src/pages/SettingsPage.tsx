import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Loader2, Settings, UserRound } from 'lucide-react'
import { errorMessage, supabase } from '../lib/supabase'
import { getReduceMotion, setReduceMotion } from '../lib/motion'
import { useAuth } from '../lib/useAuth'
import { Toggle } from '../components/form'

const inputClass =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function SettingsPage() {
  const { session } = useAuth()
  const [reduce, setReduce] = useState(getReduceMotion)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setStatus(null)
    if (pw.length < 8) return setStatus({ ok: false, msg: 'Kata sandi minimal 8 karakter.' })
    if (pw !== pw2) return setStatus({ ok: false, msg: 'Konfirmasi kata sandi tidak sama.' })
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setStatus({ ok: false, msg: errorMessage(error) })
    setPw('')
    setPw2('')
    setStatus({ ok: true, msg: 'Kata sandi berhasil diganti.' })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
        <Settings /> Pengaturan
      </h1>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Tampilan</h2>
        <Toggle
          checked={reduce}
          onChange={(v) => {
            setReduce(v)
            setReduceMotion(v)
          }}
          label="Kurangi animasi"
          hint="Mematikan efek gerak (dadu, transisi). Disimpan di perangkat ini."
        />
      </section>

      <form onSubmit={changePassword} className="card space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <KeyRound size={18} /> Ganti kata sandi
        </h2>
        <p className="text-xs text-muted">Akun: {session?.user.email}</p>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Kata sandi baru</span>
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Ulangi kata sandi baru</span>
          <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={inputClass} />
        </label>
        {status && <p className={`text-sm ${status.ok ? 'text-emerald-700' : 'text-red-700'}`}>{status.msg}</p>}
        <button disabled={busy || !pw} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />} Simpan kata sandi
        </button>
      </form>

      <Link to="/app/profil" className="card flex items-center gap-3 p-5 text-sm font-semibold text-primary hover:bg-stone-50">
        <UserRound size={18} /> Ubah nickname, nama, dan avatar di halaman Profil
      </Link>
    </div>
  )
}
