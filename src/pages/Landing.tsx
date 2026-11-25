import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, BookOpen, Radio, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { ARENA_LIST } from '../lib/arenas'
import { Arabic, ArenaIcon, Logo } from '../components/ui'

const steps = [
  { title: 'Pilih arena', text: 'Mufrodat & Muhadatsah, Qowaid, atau Ular Tangga Arab.' },
  { title: 'Main & jawab', text: 'Soal berharakat dengan timer — sendiri atau bersama teman.' },
  { title: 'Pahami & naik level', text: 'Setiap jawaban disertai penjelasan. Kumpulkan XP dan badge.' },
]

const teacherFeatures = [
  { icon: Users, title: 'Kelas & room', text: 'Buat kelas, bagikan kode, jadi host permainan satu kelas.' },
  { icon: BookOpen, title: 'Bank soal', text: 'Kelola soal Fusha & Amiyah, harakat, gambar, dan audio.' },
  { icon: BarChart3, title: 'Analitik', text: 'Lihat materi yang paling sering salah untuk diulang.' },
  { icon: Radio, title: 'Realtime', text: 'Skor, giliran, dan timer tersinkron untuk 2–30 pemain.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-mufrodat/25 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <header className="flex items-center justify-between py-5">
            <Logo light />
            <div className="flex items-center gap-2">
              <Link to="/masuk" className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 hover:text-white">
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="hidden rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90 sm:block"
              >
                Daftar
              </Link>
            </div>
          </header>

          <div className="grid items-center gap-10 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
            <div>
              <img src="/logo-192.png" alt="Logo Fun Arena Center" width={112} height={112} className="mb-6 size-24 rounded-[22px] shadow-2xl shadow-black/30 sm:size-28" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                <Sparkles size={14} className="text-gold" /> Platform permainan bahasa Arab
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                Belajar, Bermain, Berkompetisi, dan <span className="text-gold">Menguasai Bahasa Arab!</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
                Mufrodat, muhadatsah, Nahwu, dan Shorof lewat permainan individu, duel, hingga ular tangga bersama satu
                kelas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3.5 font-bold text-primary-dark shadow-lg shadow-black/10 transition hover:brightness-105"
                >
                  Mulai Bermain <ArrowRight size={18} />
                </Link>
                <Link
                  to="/masuk"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white ring-1 ring-white/30 hover:bg-white/10"
                >
                  Saya Guru
                </Link>
              </div>
            </div>

            {/* Kartu pratinjau soal */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-3 rotate-3 rounded-3xl bg-white/10" aria-hidden />
              <div className="relative rounded-3xl bg-white p-6 text-ink shadow-2xl">
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span className="rounded-full bg-mufrodat-soft px-2.5 py-1 text-mufrodat">Vocabulary Challenge</span>
                  <span>Contoh soal</span>
                </div>
                <p className="mt-6 text-center text-sm text-muted">Apa arti kata berikut?</p>
                <p className="mt-2 text-center">
                  <Arabic className="text-5xl font-semibold text-primary">مَكْتَبَةٌ</Arabic>
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2.5 text-sm font-semibold">
                  {['Meja', 'Perpustakaan', 'Kantor', 'Pena'].map((o) => (
                    <span
                      key={o}
                      className={`rounded-xl border px-3 py-3 text-center ${
                        o === 'Perpustakaan'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-line text-ink'
                      }`}
                    >
                      {o}
                    </span>
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-muted">
                  <Arabic className="text-sm text-ink">مَكْتَبَةٌ</Arabic> berpola <Arabic className="text-sm text-ink">مَفْعَلَةٌ</Arabic>{' '}
                  (isim makan): tempat kegiatan <Arabic className="text-sm text-ink">كَتَبَ</Arabic> — perpustakaan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Arena */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Tiga arena, satu tujuan</h2>
        <p className="mt-2 text-muted">Pilih arena sesuai fokus belajarmu.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {ARENA_LIST.map((a) => (
            <div key={a.id} className="card lift overflow-hidden">
              <div className={`h-1.5 ${a.color.bg}`} />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <span className={`grid size-12 place-items-center rounded-2xl ${a.color.soft} ${a.color.text}`}>
                    <ArenaIcon arena={a.id} size={24} />
                  </span>
                  <Arabic className={`text-xl font-semibold ${a.color.text}`}>{a.ar}</Arabic>
                </div>
                <h3 className="mt-5 text-lg font-bold">{a.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Untuk guru */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Untuk guru & lembaga</h2>
            <p className="mt-3 text-muted">
              Kendalikan permainan kelas, susun paket soal, dan pantau perkembangan setiap santri.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink">
              <ShieldCheck size={18} className="text-mufrodat" /> Data setiap lembaga terpisah & aman.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {teacherFeatures.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-5">
                <Icon size={22} className="text-primary" />
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>© Al-Azhar Center</p>
        </div>
      </footer>
    </div>
  )
}
