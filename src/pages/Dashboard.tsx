import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ChevronRight, DoorOpen, Flame, Gamepad2, Play, Plus, Star, Target, Trophy } from 'lucide-react'
import { ARENA_BY_DB, ARENA_LIST } from '../lib/arenas'
import { api, type Badge, type ChallengeRow, type LeaderboardRow, type Mission, type PlayerStats, type RecentGame } from '../lib/api'
import { useAuth } from '../lib/useAuth'
import { levelProgress } from '../lib/level'
import Avatar from '../components/Avatar'
import BadgeGrid from '../components/BadgeGrid'
import MissionCard from '../components/MissionCard'
import ChallengeCard from '../components/ChallengeCard'
import { isAdmin, isStaff } from '../lib/roles'
import { Arabic, ArenaIcon } from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const actions = [
  { to: '/app/quick-play', label: 'Mulai Bermain', icon: Play, primary: true },
  { to: '/app/lobby', label: 'Buat Room', icon: Plus },
  { to: '/app/lobby', label: 'Gabung Room', icon: DoorOpen },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/app/progres', label: 'Progres', icon: BarChart3 },
]

function SectionTitle({ title, to }: { title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center text-xs font-semibold text-primary hover:underline">
          Lihat semua <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'Baru saja'
  if (min < 60) return `${min} menit lalu`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} jam lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [st, setSt] = useState<PlayerStats | null>(null)
  const [recent, setRecent] = useState<RecentGame[] | null>(null)
  const [board, setBoard] = useState<LeaderboardRow[] | null>(null)
  const [challenges, setChallenges] = useState<ChallengeRow[] | null>(null)
  const [missions, setMissions] = useState<Mission[] | null>(null)
  const [badges, setBadges] = useState<Badge[] | null>(null)
  const loadMissions = () => api.myMissions().then(setMissions).catch(() => setMissions([]))

  useEffect(() => {
    if (!session) return
    api.myStats(session.user.id).then(setSt).catch(() => setSt(null))
    api.recentGames(5).then(setRecent).catch(() => setRecent([]))
    api.leaderboard('week').then(setBoard).catch(() => setBoard([]))
    api.myChallenges().then(setChallenges).catch(() => setChallenges([]))
    api.myMissions().then(setMissions).catch(() => setMissions([]))
    api.myBadges().then(setBadges).catch(() => setBadges([]))
  }, [session])

  const xp = st?.xp ?? 0
  const lvl = levelProgress(xp)
  const accuracy = st?.total_answered ? Math.round((st.total_correct / st.total_answered) * 100) : 0
  const stats = [
    { label: 'Total XP', value: xp.toLocaleString('id-ID'), icon: Star, tint: 'bg-gold-soft text-amber-600' },
    { label: 'Permainan', value: st?.total_games ?? 0, icon: Gamepad2, tint: 'bg-sky-50 text-sky-600' },
    { label: 'Akurasi', value: st?.total_answered ? `${accuracy}%` : '–', icon: Target, tint: 'bg-emerald-50 text-emerald-600' },
    { label: 'Streak', value: `${st?.current_streak ?? 0} hari`, icon: Flame, tint: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Sapaan & level */}
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-8">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-gold/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Avatar url={profile?.avatar_url} name={profile?.nickname} size={52} className="ring-2 ring-white/25" />
              <div>
                <p className="text-sm text-white/70">{greeting()},</p>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{profile?.nickname || 'Santri'}</h1>
              </div>
            </div>
            <p className="mt-1 text-sm text-white/70">
              <Arabic className="text-base text-white/90">أَهْلًا وَسَهْلًا</Arabic> — siap menambah ilmu hari ini?
            </p>
          </div>
          <div className="w-full rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 sm:w-72">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Level {lvl.level}</span>
              <span className="text-xs text-white/70">
                {lvl.current} / {lvl.needed} XP
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${(lvl.current / lvl.needed) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/70">
              {st?.total_games ? `Streak terbaik: ${st.longest_streak} hari` : 'Main Quick Play pertamamu untuk mendapat XP!'}
            </p>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="card flex items-center gap-3 p-4">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tint}`}>
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">{label}</p>
              <p className="truncate text-lg font-extrabold">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Pintasan guru/admin (penting di HP yang tidak punya menu samping) */}
      {isStaff(profile?.role) && (
        <section className="card flex flex-wrap items-center gap-2 p-4">
          <span className="mr-2 text-sm font-bold text-primary">Panel guru:</span>
          {[
            ['/guru', 'Dashboard Guru'],
            ['/guru/kelas', 'Kelas'],
            ['/guru/bank-soal', 'Bank Soal'],
            ['/guru/tantangan', 'Tantangan'],
            ...(isAdmin(profile?.role) ? [['/admin', 'Admin']] : []),
          ].map(([to, label]) => (
            <Link key={to} to={to} className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
              {label}
            </Link>
          ))}
        </section>
      )}

      {/* Aksi utama */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {actions.map(({ to, label, icon: Icon, primary }) => (
          <Link
            key={label}
            to={to}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
              primary
                ? 'col-span-2 bg-gold text-primary-dark shadow-sm hover:brightness-105 sm:col-span-1'
                : 'border border-line bg-white text-primary hover:border-primary/30 hover:bg-stone-50'
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        ))}
      </section>

      {/* Arena */}
      <section>
        <SectionTitle title="Pilih Arena" />
        <div className="grid gap-4 md:grid-cols-3">
          {ARENA_LIST.map((a) => (
            <Link key={a.id} to={a.path} className="card lift group relative overflow-hidden p-5">
              <div className={`absolute -top-8 -right-8 size-28 rounded-full ${a.color.soft}`} aria-hidden />
              <div className="relative">
                <span className={`grid size-12 place-items-center rounded-2xl ${a.color.bg} text-white shadow-sm`}>
                  <ArenaIcon arena={a.id} size={24} />
                </span>
                <Arabic className={`mt-4 block text-lg font-semibold ${a.color.text}`}>{a.ar}</Arabic>
                <h3 className="font-bold">{a.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{a.tagline}</p>
                <span className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${a.color.text}`}>
                  Masuk arena <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {/* Misi harian: yang belum diklaim lebih dulu */}
          <section>
            <SectionTitle title="Misi Hari Ini" to="/app/tantangan" />
            <div className="grid gap-3 sm:grid-cols-2">
              {missions === null && <p className="card p-4 text-sm text-muted">Memuat…</p>}
              {missions
                ?.filter((m) => m.period === 'daily')
                .sort((x, y) => Number(x.claimed) - Number(y.claimed))
                .slice(0, 2)
                .map((m) => <MissionCard key={m.code} m={m} onClaimed={loadMissions} />)}
            </div>
          </section>

          {/* Tantangan aktif */}
          <section>
            <SectionTitle title="Tantangan Aktif" to="/app/tantangan" />
            <div className="space-y-3">
              {challenges === null && <p className="card p-4 text-sm text-muted">Memuat…</p>}
              {challenges?.length === 0 && (
                <p className="card p-4 text-sm text-muted">
                  Belum ada tantangan. Gabung kelas di menu{' '}
                  <Link to="/app/kelas" className="font-semibold text-primary">
                    Kelas Saya
                  </Link>{' '}
                  agar tantangan dari ustadz/ustadzah muncul di sini.
                </p>
              )}
              {/* Yang belum selesai lebih dulu */}
              {challenges
                ?.slice()
                .sort((x, y) => Number(x.completed) - Number(y.completed))
                .slice(0, 3)
                .map((c) => <ChallengeCard key={c.id} c={c} />)}
            </div>
          </section>

          {/* Riwayat */}
          <section>
            <SectionTitle title="Riwayat Permainan" to="/app/riwayat" />
            <div className="card divide-y divide-line">
              {recent === null && <p className="p-4 text-sm text-muted">Memuat…</p>}
              {recent?.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted">Belum ada permainan.</p>
                  <Link to="/app/quick-play" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
                    Main sekarang
                  </Link>
                </div>
              )}
              {recent?.map((h) => {
                const arena = ARENA_BY_DB[h.arena]
                return (
                  <Link key={h.session_id} to={`/app/hasil/${h.session_id}`} className="flex items-center gap-3 p-4 hover:bg-stone-50">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${arena.color.soft} ${arena.color.text}`}>
                      <ArenaIcon arena={arena.id} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{h.category_name}</p>
                      <p className="text-xs text-muted">
                        {arena.name} · {timeAgo(h.ended_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{h.score}</p>
                      <p className="text-xs text-muted">
                        {h.correct_count}/{h.answered_count} benar
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Peringkat */}
          <section>
            <SectionTitle title="Peringkat Minggu Ini" to="/app/leaderboard" />
            <div className="card p-2">
              {board === null && <p className="p-3 text-sm text-muted">Memuat…</p>}
              {board?.length === 0 && <p className="p-3 text-sm text-muted">Belum ada skor minggu ini. Jadilah yang pertama!</p>}
              {/* 5 teratas + posisimu jika di luar 5 besar */}
              {board
                ?.filter((r, i) => i < 5 || r.is_me)
                .map((r) => (
                  <div key={r.user_id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${r.is_me ? 'bg-primary/5 ring-1 ring-primary/15' : ''}`}>
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                        r.rank === 1 ? 'bg-gold text-white' : r.rank === 2 ? 'bg-stone-300 text-white' : r.rank === 3 ? 'bg-orange-300 text-white' : 'bg-stone-100 text-muted'
                      }`}
                    >
                      {r.rank}
                    </span>
                    <span className={`flex-1 truncate text-sm ${r.is_me ? 'font-bold text-primary' : 'font-medium'}`}>
                      {r.nickname} {r.is_me && '(kamu)'}
                    </span>
                    <span className="text-sm font-semibold text-muted">{r.total_score.toLocaleString('id-ID')}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Badge */}
          <section>
            <SectionTitle title="Badge" to="/app/profil" />
            <div className="card p-4">
              {badges === null ? <p className="text-sm text-muted">Memuat…</p> : <BadgeGrid badges={badges} limit={6} cols="grid-cols-3" />}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
