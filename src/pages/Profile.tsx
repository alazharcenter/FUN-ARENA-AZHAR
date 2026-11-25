import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Loader2 } from 'lucide-react'
import { api, type Badge, type PlayerStats } from '../lib/api'
import { useAuth } from '../lib/useAuth'
import { levelProgress } from '../lib/level'
import { errorMessage, supabase } from '../lib/supabase'
import { ProgressBar } from '../components/ui'
import Avatar from '../components/Avatar'
import { PRESET_AVATARS } from '../lib/avatars'
import BadgeGrid from '../components/BadgeGrid'

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  institution_admin: 'Admin Lembaga',
  teacher: 'Guru',
  student: 'Santri',
  parent: 'Orang Tua',
}

const inputClass =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

// Form diisi dari profil; komponen dalam baru dirender setelah profil termuat
export default function Profile() {
  const { profile } = useAuth()
  if (!profile)
    return (
      <div className="flex justify-center py-24 text-primary">
        <Loader2 size={28} className="animate-spin" />
      </div>
    )
  return <ProfileView key={profile.id} />
}

function ProfileView() {
  const { session, profile, refreshProfile } = useAuth()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [badges, setBadges] = useState<Badge[] | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null)

  useEffect(() => {
    if (session) api.myStats(session.user.id).then(setStats).catch(() => setStats(null))
    api.myBadges().then(setBadges).catch(() => setBadges([]))
  }, [session])

  async function setAvatar(url: string | null) {
    if (!profile) return
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
    if (error) throw error
    await refreshProfile()
  }

  async function pickPreset(emoji: string) {
    setAvatarMsg(null)
    try {
      await setAvatar(`emoji:${emoji}`)
    } catch (e) {
      setAvatarMsg(errorMessage(e))
    }
  }

  // Foto disimpan di bucket "avatars" dalam folder milik pengguna sendiri (dijaga policy Storage)
  async function upload(file: File) {
    if (!profile) return
    setAvatarMsg(null)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setAvatarMsg('Format harus PNG, JPG, atau WEBP.')
    if (file.size > 2 * 1024 * 1024) return setAvatarMsg('Ukuran foto maksimal 2 MB.')
    setAvatarBusy(true)
    try {
      const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
      if (error) throw error
      const old = profile.avatar_url?.match(/\/avatars\/(.+)$/)?.[1]
      await setAvatar(supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl)
      if (old) await supabase.storage.from('avatars').remove([old])
    } catch (e) {
      setAvatarMsg(errorMessage(e))
    } finally {
      setAvatarBusy(false)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setStatus(null)
    const { error } = await supabase
      .from('profiles')
      .update({ nickname: nickname.trim(), full_name: fullName.trim() })
      .eq('id', profile.id)
    setBusy(false)
    if (error) return setStatus({ ok: false, msg: errorMessage(error) })
    await refreshProfile()
    setStatus({ ok: true, msg: 'Profil tersimpan.' })
  }

  const lvl = levelProgress(stats?.xp ?? 0)
  const accuracy = stats?.total_answered ? Math.round((stats.total_correct / stats.total_answered) * 100) : 0

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card flex items-center gap-4 p-5">
        <Avatar url={profile?.avatar_url} name={profile?.nickname} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold text-primary">{profile?.nickname}</h1>
          <p className="truncate text-sm text-muted">
            {profile ? ROLE_LABEL[profile.role] : ''} · {session?.user.email}
          </p>
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold">Level {lvl.level}</span>
              <span className="text-muted">
                {lvl.current}/{lvl.needed} XP
              </span>
            </div>
            <ProgressBar value={lvl.current} max={lvl.needed} className="bg-gold" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total XP', stats?.xp ?? 0],
          ['Permainan', stats?.total_games ?? 0],
          ['Akurasi', `${accuracy}%`],
          ['Streak terbaik', `${stats?.longest_streak ?? 0} hari`],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-lg font-extrabold">{value}</p>
          </div>
        ))}
      </section>

      <nav className="grid grid-cols-3 gap-2 text-sm font-semibold">
        {[
          ['/app/progres', 'Progres'],
          ['/app/riwayat', 'Riwayat'],
          ['/pengaturan', 'Pengaturan'],
        ].map(([to, label]) => (
          <Link key={to} to={to} className="card p-3 text-center text-primary hover:bg-stone-50">
            {label}
          </Link>
        ))}
      </nav>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Avatar</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_AVATARS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => pickPreset(e)}
              aria-label={`Pakai avatar ${e}`}
              className={`rounded-full ring-2 transition ${profile?.avatar_url === `emoji:${e}` ? 'ring-primary' : 'ring-transparent hover:ring-line'}`}
            >
              <Avatar url={`emoji:${e}`} size={44} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary hover:bg-stone-50">
            {avatarBusy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} Unggah foto
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={avatarBusy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) upload(f)
              }}
            />
          </label>
          {profile?.avatar_url && (
            <button type="button" onClick={() => setAvatar(null).catch((e) => setAvatarMsg(errorMessage(e)))} className="text-sm text-muted hover:text-red-600">
              Hapus avatar
            </button>
          )}
          <span className="text-xs text-muted">PNG/JPG/WEBP, maks. 2 MB</span>
        </div>
        {avatarMsg && <p className="text-sm text-red-700">{avatarMsg}</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-bold">
          Badge{' '}
          {badges && (
            <span className="text-sm font-normal text-muted">
              ({badges.filter((b) => b.earned_at).length}/{badges.length})
            </span>
          )}
        </h2>
        {badges ? <BadgeGrid badges={badges} /> : <Loader2 className="mx-auto animate-spin text-primary" />}
      </section>

      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="font-bold">Ubah profil</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nickname</span>
          <input required maxLength={24} value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nama lengkap</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>
        {status && <p className={`text-sm ${status.ok ? 'text-emerald-700' : 'text-red-700'}`}>{status.msg}</p>}
        <button disabled={busy} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />} Simpan
        </button>
      </form>
    </div>
  )
}
