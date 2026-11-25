import { useCallback, useEffect, useState } from 'react'
import { Loader2, Search, ShieldCheck } from 'lucide-react'
import { api, type AdminStats, type AdminUser } from '../lib/api'
import { ARENA_BY_DB } from '../lib/arenas'
import { useCategoryTree } from '../lib/catalog'
import { ROLE_LABEL } from '../lib/roles'
import { errorMessage } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import type { Profile } from '../lib/useAuth'

const inputClass = 'rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary'

export default function AdminPage() {
  const { profile } = useAuth()
  const isSuper = profile?.role === 'super_admin'
  const tree = useCategoryTree()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [inst, setInst] = useState({ name: '', slug: '' })
  const [cat, setCat] = useState({ parent: '', slug: '', name: '', name_ar: '' })

  const loadUsers = useCallback(() => {
    api.adminUsers(search).then(setUsers).catch((e) => setMsg({ ok: false, text: errorMessage(e) }))
  }, [search])
  useEffect(() => {
    const t = setTimeout(loadUsers, 250)
    return () => clearTimeout(t)
  }, [loadUsers])
  useEffect(() => {
    api.adminStats().then(setStats).catch((e) => setMsg({ ok: false, text: errorMessage(e) }))
  }, [])

  async function changeRole(u: AdminUser, role: Profile['role']) {
    if (!confirm(`Ubah peran ${u.nickname || u.email} menjadi ${ROLE_LABEL[role]}?`)) return
    try {
      await api.setUserRole(u.id, role)
      setMsg({ ok: true, text: `Peran ${u.nickname || u.email} sekarang ${ROLE_LABEL[role]}.` })
      loadUsers()
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) })
    }
  }

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn()
      setMsg({ ok: true, text: ok })
      api.adminStats().then(setStats)
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) })
    }
  }

  const roles: Profile['role'][] = isSuper ? ['student', 'teacher', 'parent', 'institution_admin', 'super_admin'] : ['student', 'teacher', 'parent', 'institution_admin']
  const groups = [...new Map((tree ?? []).map((c) => [c.group_slug, c])).values()]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
          <ShieldCheck /> Dashboard Admin
        </h1>
        <p className="mt-1 text-sm text-muted">Cakupan: {stats?.scope ?? '…'}</p>
      </div>

      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Santri', stats?.users_by_role?.student ?? 0],
          ['Guru', stats?.users_by_role?.teacher ?? 0],
          ['Kelas', stats?.classes ?? 0],
          ['Soal (bawaan + lembaga)', stats ? `${stats.questions_global} + ${stats.questions_institution}` : '–'],
          ['Permainan 7 hari', stats?.games_7d ?? 0],
          ['Jawaban 7 hari', stats?.answers_7d ?? 0],
          ['Pemain aktif 7 hari', stats?.active_players_7d ?? 0],
          ['Room aktif', stats?.rooms_active ?? 0],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="text-xl font-extrabold">{v}</p>
          </div>
        ))}
      </section>

      {stats && stats.top_categories.length > 0 && (
        <section className="card p-5">
          <h2 className="font-bold">Materi paling banyak dimainkan (7 hari)</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.top_categories.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                <span>
                  {c.name}
                  <span className="block text-[11px] text-muted">{ARENA_BY_DB[c.arena].name}</span>
                </span>
                <span className="text-right">
                  <b>{c.answers}</b> jawaban
                  <span className="block text-[11px] text-muted">{c.accuracy}% benar</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="font-bold">Pengguna & peran</h2>
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari email / nama" className={`${inputClass} pl-8`} />
          </div>
        </div>
        {!users && <Loader2 className="mx-auto my-8 animate-spin text-primary" />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2">Pengguna</th>
                {isSuper && <th className="px-2 py-2">Lembaga</th>}
                <th className="px-2 py-2">Bergabung</th>
                <th className="px-2 py-2 text-right">XP</th>
                <th className="px-4 py-2">Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users?.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold">{u.nickname || '—'}</span>
                    <span className="block text-[11px] text-muted">
                      {u.email} {u.full_name && `· ${u.full_name}`}
                    </span>
                  </td>
                  {isSuper && <td className="px-2 text-xs">{u.institution_name ?? '—'}</td>}
                  <td className="px-2 text-xs text-muted">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="px-2 text-right">{u.xp ?? 0}</td>
                  <td className="px-4">
                    <select
                      value={u.role}
                      disabled={u.id === profile?.id || (!isSuper && u.role === 'super_admin')}
                      onChange={(e) => changeRole(u, e.target.value as Profile['role'])}
                      aria-label={`Peran ${u.nickname}`}
                      className={`${inputClass} py-1.5`}
                    >
                      {(u.role === 'super_admin' && !isSuper ? ['super_admin' as const] : roles).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line p-3 text-xs text-muted">Peran sendiri tidak bisa diubah (mencegah terkunci dari panel admin).</p>
      </section>

      {isSuper && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card space-y-3 p-5">
            <h2 className="font-bold">Lembaga</h2>
            <ul className="space-y-1 text-sm">
              {stats?.institutions?.map((i) => (
                <li key={i.id} className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
                  <span>
                    {i.name} <span className="text-xs text-muted">({i.slug})</span>
                  </span>
                  <span className="text-xs text-muted">{i.users} pengguna</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <input value={inst.name} onChange={(e) => setInst({ ...inst, name: e.target.value })} placeholder="Nama lembaga" className={`${inputClass} flex-1`} />
              <input value={inst.slug} onChange={(e) => setInst({ ...inst, slug: e.target.value.toLowerCase() })} placeholder="slug-lembaga" className={`${inputClass} w-36`} />
              <button onClick={() => run(() => api.createInstitution(inst.name, inst.slug), `Lembaga ${inst.name} dibuat.`)} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
                Tambah
              </button>
            </div>
          </section>
          <section className="card space-y-3 p-5">
            <h2 className="font-bold">Tambah materi (kategori)</h2>
            <select value={cat.parent} onChange={(e) => setCat({ ...cat, parent: e.target.value })} className={`${inputClass} w-full`}>
              <option value="">— kelompok induk —</option>
              {groups.map((g) => (
                <option key={g.group_slug} value={g.group_slug}>
                  {ARENA_BY_DB[g.arena].name} · {g.group_name}
                </option>
              ))}
            </select>
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={cat.slug} onChange={(e) => setCat({ ...cat, slug: e.target.value.toLowerCase() })} placeholder="slug" className={inputClass} />
              <input value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} placeholder="Nama" className={inputClass} />
              <input dir="rtl" value={cat.name_ar} onChange={(e) => setCat({ ...cat, name_ar: e.target.value })} placeholder="الِاسْمُ" className={`${inputClass} arabic`} />
            </div>
            <button onClick={() => run(() => api.saveCategory(cat.parent, cat.slug, cat.name, cat.name_ar), `Materi ${cat.name} disimpan.`)} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
              Simpan materi
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
