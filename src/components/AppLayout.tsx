import { Suspense } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  BarChart3, BookOpen, Loader2, Flag, GraduationCap, History, Home, LogOut, School, Settings, ShieldCheck, Target, Trophy, User, Users,
} from 'lucide-react'
import { ARENA_LIST } from '../lib/arenas'
import { useAuth } from '../lib/useAuth'
import { isAdmin, isStaff } from '../lib/roles'
import Avatar from './Avatar'
import { ArenaIcon, Logo } from './ui'

const mainNav = [
  { to: '/app', label: 'Beranda', icon: Home, end: true },
  { to: '/app/lobby', label: 'Main Bareng', icon: Users },
  { to: '/app/leaderboard', label: 'Peringkat', icon: Trophy },
  { to: '/app/tantangan', label: 'Misi', icon: Flag },
  { to: '/app/kelas', label: 'Kelas Saya', icon: School },
  { to: '/app/progres', label: 'Progres', icon: BarChart3 },
  { to: '/app/riwayat', label: 'Riwayat', icon: History },
  { to: '/app/profil', label: 'Profil', icon: User },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

const staffNav = [
  { to: '/guru', label: 'Dashboard Guru', icon: GraduationCap, end: true },
  { to: '/guru/kelas', label: 'Kelas', icon: Users },
  { to: '/guru/bank-soal', label: 'Bank Soal', icon: BookOpen },
  { to: '/guru/tantangan', label: 'Tantangan', icon: Target },
]
const adminNav = [{ to: '/admin', label: 'Admin', icon: ShieldCheck }]

const mobileNav = [
  { to: '/app', label: 'Beranda', icon: Home, end: true },
  { to: '/app/lobby', label: 'Main', icon: Users },
  { to: '/app/tantangan', label: 'Misi', icon: Flag },
  { to: '/app/leaderboard', label: 'Peringkat', icon: Trophy },
  { to: '/app/profil', label: 'Profil', icon: User },
]

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'
  }`
}

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function logout() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primary px-4 py-5 lg:flex">
        <Link to="/" className="px-2">
          <Logo light />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {mainNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
          <p className="mt-6 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Arena</p>
          {ARENA_LIST.map((a) => (
            <NavLink key={a.id} to={a.path} className={linkClass}>
              <ArenaIcon arena={a.id} size={18} /> {a.name}
            </NavLink>
          ))}
          {isStaff(profile?.role) && (
            <>
              <p className="mt-6 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Guru</p>
              {[...staffNav, ...(isAdmin(profile?.role) ? adminNav : [])].map(({ to, label, icon: Icon, ...rest }) => (
                <NavLink key={to} to={to} end={'end' in rest} className={linkClass}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="mt-4 border-t border-white/10 pt-4">
          <Link to="/app/profil" className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-white/6">
            <Avatar url={profile?.avatar_url} name={profile?.nickname} size={32} className="ring-2 ring-white/20" />
            <span className="truncate text-sm font-semibold text-white">{profile?.nickname || 'Santri'}</span>
          </Link>
          <button onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/6 hover:text-white">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* Header HP */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/app">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/pengaturan" aria-label="Pengaturan" className="rounded-lg p-2 text-muted hover:bg-slate-100">
            <Settings size={20} />
          </Link>
          <button onClick={logout} aria-label="Keluar" className="rounded-lg p-2 text-muted hover:bg-slate-100">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
        <Suspense fallback={<Loader2 size={28} className="mx-auto mt-24 animate-spin text-primary" />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Navigasi bawah HP */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${isActive ? 'text-primary' : 'text-muted'}`
            }
          >
            <Icon size={21} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
