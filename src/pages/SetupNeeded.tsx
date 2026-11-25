import { Logo } from '../components/ui'

// Ditampilkan jika file .env.local belum diisi
export default function SetupNeeded() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-extrabold text-primary">Supabase belum terhubung</h1>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            Salin file <code className="rounded bg-stone-100 px-1.5 py-0.5 text-ink">.env.example</code> menjadi{' '}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-ink">.env.local</code>.
          </li>
          <li>Isi Project URL dan Publishable key dari dashboard Supabase.</li>
          <li>
            Hentikan server (Ctrl+C) lalu jalankan lagi <code className="rounded bg-stone-100 px-1.5 py-0.5 text-ink">npm run dev</code>.
          </li>
        </ol>
      </div>
    </div>
  )
}
