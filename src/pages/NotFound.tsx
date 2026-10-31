import { Link } from 'react-router-dom'
import { Arabic } from '../components/ui'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 text-center">
      <div>
        <Arabic className="text-5xl font-semibold text-primary">الصَّفْحَةُ غَيْرُ مَوْجُودَةٍ</Arabic>
        <p className="mt-3 text-muted">Halaman tidak ditemukan (404).</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Ke halaman utama
        </Link>
      </div>
    </div>
  )
}
