import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AppLayout from './components/AppLayout'
import { isAdmin, isStaff } from './lib/roles'
import Auth from './pages/Auth'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import SetupNeeded from './pages/SetupNeeded'
import { AuthProvider } from './lib/auth'
import { useAuth } from './lib/useAuth'
import { isSupabaseConfigured } from './lib/supabase'

// Halaman dimuat saat dibuka (code splitting) agar pembukaan pertama ringan di HP
const AdminPage = lazy(() => import('./pages/AdminPage'))
const MyClassesPage = lazy(() => import('./pages/MyClassesPage'))
const ChallengesPage = lazy(() => import('./pages/teacher/ChallengesPage'))
const ClassDetailPage = lazy(() => import('./pages/teacher/ClassDetailPage'))
const ClassesPage = lazy(() => import('./pages/teacher/ClassesPage'))
const QuestionBankPage = lazy(() => import('./pages/teacher/QuestionBankPage'))
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const ArenaPage = lazy(() => import('./pages/ArenaPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const MissionsPage = lazy(() => import('./pages/MissionsPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const LobbyPage = lazy(() => import('./pages/LobbyPage'))
const RoomPage = lazy(() => import('./pages/RoomPage'))
const Profile = lazy(() => import('./pages/Profile'))
const QuickPlay = lazy(() => import('./pages/QuickPlay'))
const ResultPage = lazy(() => import('./pages/ResultPage'))
const SnakeGamePage = lazy(() => import('./pages/SnakeGamePage'))
const SnakeLadderPage = lazy(() => import('./pages/SnakeLadderPage'))

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center text-primary">
      <Loader2 size={32} className="animate-spin" />
    </div>
  )
}

// Halaman di dalam /app hanya untuk pengguna yang sudah login
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />
  return children
}

// Halaman guru/admin. Server tetap memeriksa peran di setiap fungsi; ini hanya mencegah halaman kosong.
function RequireRole({ allow, children }: { allow: 'staff' | 'admin'; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile) return <FullScreenLoader />
  const ok = allow === 'admin' ? isAdmin(profile.role) : isStaff(profile.role)
  if (!ok) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-6 text-center text-sm text-muted">
        Halaman ini khusus {allow === 'admin' ? 'admin' : 'guru dan admin'}. Minta admin lembaga mengubah peran akunmu.
      </div>
    )
  }
  return children
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />

  return (
    <AuthProvider>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/masuk" element={<Auth mode="login" />} />
          <Route path="/daftar" element={<Auth mode="register" />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/arena/mufrodat" element={<ArenaPage key="mufrodat" id="mufrodat" />} />
            <Route path="/app/arena/qowaid" element={<ArenaPage key="qowaid" id="qowaid" />} />
            <Route path="/app/arena/ular-tangga" element={<SnakeLadderPage />} />
            <Route path="/app/quick-play" element={<QuickPlay />} />
            <Route path="/app/hasil/:sessionId" element={<ResultPage />} />
            <Route path="/app/profil" element={<Profile />} />
            <Route path="/app/lobby" element={<LobbyPage />} />
            <Route path="/app/leaderboard" element={<LeaderboardPage />} />
            <Route path="/app/kelas" element={<MyClassesPage />} />
            <Route path="/guru" element={<RequireRole allow="staff"><TeacherDashboard /></RequireRole>} />
            <Route path="/guru/kelas" element={<RequireRole allow="staff"><ClassesPage /></RequireRole>} />
            <Route path="/guru/kelas/:id" element={<RequireRole allow="staff"><ClassDetailPage /></RequireRole>} />
            <Route path="/guru/statistik" element={<Navigate to="/guru/kelas" replace />} />
            <Route path="/guru/bank-soal" element={<RequireRole allow="staff"><QuestionBankPage /></RequireRole>} />
            <Route path="/guru/tantangan" element={<RequireRole allow="staff"><ChallengesPage /></RequireRole>} />
            <Route path="/admin" element={<RequireRole allow="admin"><AdminPage /></RequireRole>} />
            <Route path="/app/tantangan" element={<MissionsPage />} />
            <Route path="/app/progres" element={<ProgressPage />} />
            <Route path="/app/riwayat" element={<HistoryPage />} />
            <Route path="/pengaturan" element={<SettingsPage />} />
          </Route>

          {/* Layar bermain tanpa sidebar agar fokus */}
          <Route
            path="/app/main/:sessionId"
            element={
              <RequireAuth>
                <GamePage />
              </RequireAuth>
            }
          />

          <Route
            path="/app/room/:code"
            element={
              <RequireAuth>
                <RoomPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/ular-tangga/main/:sessionId"
            element={
              <RequireAuth>
                <SnakeGamePage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
