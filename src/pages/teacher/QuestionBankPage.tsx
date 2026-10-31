import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Download, FileUp, Loader2, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api, type BankQuestion, type ClassRow, type DbArena, type PackageRow } from '../../lib/api'
import { ARENA_BY_DB, DIFFICULTIES, DIFFICULTY_LABEL, GAME_TYPE_LABEL, type Difficulty } from '../../lib/arenas'
import { useCategoryTree } from '../../lib/catalog'
import { downloadCsv, parseCsv } from '../../lib/csv'
import { errorMessage } from '../../lib/supabase'
import { RichText } from '../../components/ui'
import QuestionEditor, { Shell } from './QuestionEditor'

const selectClass = 'rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary'

// ---------------------------------------------------------------------
// Impor CSV
const CSV_HEADER = ['kategori', 'jenis', 'tingkat', 'ragam', 'pertanyaan', 'teks_arab', 'pilihan_1', 'pilihan_2', 'pilihan_3', 'pilihan_4', 'pilihan_5', 'pilihan_6', 'jawaban', 'penjelasan', 'waktu']
const CSV_EXAMPLE = [
  ['dasar', 'vocabulary_challenge', 'beginner', 'fusha', 'Apa arti kata berikut?', 'قَلَمٌ', 'Pena', 'Buku', 'Meja', 'Pintu', '', '', '1', 'قَلَمٌ artinya pena.', ''],
  ['fail', 'irab_challenge', 'intermediate', 'fusha', "Tentukan kedudukan kata yang ditandai.", 'قَامَ [[زَيْدٌ]]', "Fa'il marfu' dengan dhammah", "Mubtada' marfu'", "Maf'ul bih manshub", '', '', '', '1', "زَيْدٌ adalah fa'il.", '25'],
  ['dasar', 'true_false', 'beginner', 'fusha', 'Benar atau salah? قَمَرٌ artinya matahari.', 'قَمَرٌ', 'Benar', 'Salah', '', '', '', '', '2', 'Salah. قَمَرٌ = bulan.', ''],
  ['aktivitas', 'sentence_builder', 'beginner', 'fusha', 'Susun: "Saya santri."', '', 'طَالِبٌ', 'أَنَا', '', '', '', '', 'أَنَا طَالِبٌ', 'أَنَا طَالِبٌ = saya santri.', ''],
]

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const tree = useCategoryTree()
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function read(file: File | undefined) {
    if (!file) return
    setResult(null)
    const table = parseCsv(await file.text())
    const [head, ...body] = table
    const idx = (k: string) => head.findIndex((h) => h.trim().toLowerCase() === k)
    const missing = ['kategori', 'jenis', 'tingkat', 'pertanyaan', 'pilihan_1', 'jawaban', 'penjelasan'].filter((k) => idx(k) < 0)
    if (missing.length) {
      setRows(null)
      setProblems([`Kolom tidak ditemukan: ${missing.join(', ')}. Gunakan templat.`])
      return
    }
    const get = (r: string[], k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? '').trim() : '')
    const out: Record<string, unknown>[] = []
    const errs: string[] = []
    body.forEach((r, i) => {
      const line = i + 2
      const type = get(r, 'jenis')
      const options = [1, 2, 3, 4, 5, 6].map((n) => get(r, `pilihan_${n}`)).filter(Boolean)
      const ans = get(r, 'jawaban')
      if (!get(r, 'pertanyaan') || !get(r, 'penjelasan')) errs.push(`Baris ${line}: pertanyaan & penjelasan wajib diisi`)
      out.push({
        _line: String(line),
        category_slug: get(r, 'kategori'),
        game_type: type,
        difficulty: get(r, 'tingkat'),
        variety: get(r, 'ragam') || 'fusha',
        prompt: get(r, 'pertanyaan'),
        prompt_ar: get(r, 'teks_arab'),
        explanation: get(r, 'penjelasan'),
        time_limit_sec: get(r, 'waktu') ? Number(get(r, 'waktu')) : null,
        options,
        correct: type === 'sentence_builder' ? null : Number(ans),
        accepted: type === 'sentence_builder' ? ans.split('|').map((a) => a.trim()) : [],
      })
    })
    setRows(out)
    setProblems(errs)
  }

  async function submit() {
    if (!rows) return
    setBusy(true)
    try {
      const n = await api.importQuestions(rows)
      setResult({ ok: true, text: `${n} soal berhasil diimpor.` })
      setRows(null)
      onDone()
    } catch (e) {
      setResult({ ok: false, text: `${errorMessage(e)} — tidak ada soal yang masuk. Perbaiki lalu impor ulang.` })
    }
    setBusy(false)
  }

  return (
    <Shell title="Impor soal dari CSV" onClose={onClose} wide={false}>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
        <li>
          Unduh templat, isi di Excel/Google Sheets, lalu simpan sebagai <b>CSV (UTF-8)</b>.
        </li>
        <li>
          <b>jawaban</b> = nomor pilihan yang benar. Untuk <code>sentence_builder</code>: tulis susunan yang benar (pisahkan beberapa susunan dengan <code>|</code>).
        </li>
        <li>Semua baris diperiksa server. Jika ada satu yang salah, tidak ada yang masuk dan nomor barisnya ditampilkan.</li>
      </ol>
      <button
        onClick={() => downloadCsv('templat-soal-fun-arena.csv', CSV_HEADER, CSV_EXAMPLE)}
        className="mt-4 flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
      >
        <Download size={16} /> Unduh templat CSV
      </button>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer font-semibold">Daftar kode kategori & jenis</summary>
        <p className="mt-2">
          <b>kategori:</b> {tree?.map((c) => c.slug).join(', ')}
        </p>
        <p className="mt-1">
          <b>jenis:</b> {Object.keys(GAME_TYPE_LABEL).join(', ')}
        </p>
        <p className="mt-1">
          <b>tingkat:</b> beginner, intermediate, advanced · <b>ragam:</b> fusha, amiyah_mesir
        </p>
      </details>
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-sm font-semibold text-muted hover:bg-slate-50">
        <FileUp size={18} /> Pilih file CSV
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
      </label>
      {problems.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          {problems.slice(0, 8).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {rows && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <span className="text-sm">
            <b>{rows.length}</b> soal siap diimpor
          </span>
          <button onClick={submit} disabled={busy || rows.length === 0} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy && <Loader2 size={14} className="animate-spin" />} Impor
          </button>
        </div>
      )}
      {result && <p className={`mt-3 rounded-xl p-3 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{result.text}</p>}
    </Shell>
  )
}

// ---------------------------------------------------------------------
// Paket soal
function PackagesModal({ selected, onClose, onLoad }: { selected: string[]; onClose: () => void; onLoad: (ids: string[]) => void }) {
  const [packages, setPackages] = useState<PackageRow[] | null>(null)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [classId, setClassId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    api.myPackages().then(setPackages).catch((e) => setError(errorMessage(e)))
  }, [])
  useEffect(() => {
    load()
    api.myClasses().then((c) => setClasses(c.filter((x) => x.is_manager))).catch(() => {})
  }, [load])

  async function create() {
    setError(null)
    try {
      await api.savePackage(null, name, desc, classId || null, selected)
      setName('')
      setDesc('')
      load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <Shell title="Paket soal" onClose={onClose} wide={false}>
      <p className="text-sm text-muted">Paket = kumpulan soal pilihan guru, dipakai untuk tantangan kelas.</p>
      <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-bold">Paket baru dari {selected.length} soal yang dicentang</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama paket, mis. Latihan I'rab Pekan 3" className="w-full rounded-xl border border-line px-3 py-2 text-sm" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Keterangan (opsional)" className="w-full rounded-xl border border-line px-3 py-2 text-sm" />
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm">
          <option value="">Untuk semua kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button onClick={create} disabled={selected.length === 0 || name.trim().length < 2} className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-40">
          Simpan paket
        </button>
        {selected.length === 0 && <p className="text-xs text-muted">Centang soal di tabel bank soal terlebih dahulu.</p>}
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 space-y-2">
        {packages?.length === 0 && <p className="text-sm text-muted">Belum ada paket.</p>}
        {packages?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
            <Package size={18} className="shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{p.name}</p>
              <p className="text-xs text-muted">
                {p.question_count} soal · {p.class_name ?? 'Semua kelas'}
              </p>
            </div>
            <button onClick={() => (onLoad(p.question_ids ?? []), onClose())} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-slate-100">
              Tampilkan
            </button>
            <button
              onClick={async () => {
                if (confirm(`Hapus paket ${p.name}?`)) {
                  await api.deletePackage(p.id)
                  load()
                }
              }}
              aria-label={`Hapus paket ${p.name}`}
              className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------
export default function QuestionBankPage() {
  const tree = useCategoryTree()
  const [arena, setArena] = useState<DbArena | ''>('')
  const [category, setCategory] = useState('')
  const [gameType, setGameType] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [source, setSource] = useState<'all' | 'global' | 'mine'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'new' | 'hard'>('new')
  const [rows, setRows] = useState<BankQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [onlyIds, setOnlyIds] = useState<Set<string> | null>(null) // tampilkan isi paket
  const [editing, setEditing] = useState<string | null | undefined>(undefined) // undefined = tertutup, null = baru
  const [modal, setModal] = useState<'import' | 'packages' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(() => {
    setRows(null)
    api
      .bankQuestions({ arena: arena || null, category: category || null, gameType: gameType || null, difficulty: difficulty || null, source, search })
      .then(setRows)
      .catch((e) => setError(errorMessage(e)))
  }, [arena, category, gameType, difficulty, source, search])
  useEffect(() => {
    const t = setTimeout(load, 250) // tunggu selesai mengetik
    return () => clearTimeout(t)
  }, [load])

  const shown = useMemo(() => {
    let r = rows ?? []
    if (onlyIds) r = r.filter((x) => onlyIds.has(x.id))
    if (sort === 'hard') r = [...r].filter((x) => x.times_answered >= 3).sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))
    return r
  }, [rows, sort, onlyIds])

  async function remove(q: BankQuestion) {
    if (!confirm('Hapus soal ini?')) return
    try {
      const r = await api.deleteQuestion(q.id)
      setNotice(r === 'archived' ? 'Soal sudah pernah dimainkan, jadi diarsipkan (tidak terbit) agar riwayat santri tetap utuh.' : 'Soal dihapus.')
      load()
    } catch (e) {
      setNotice(errorMessage(e))
    }
  }

  const toggle = (id: string) => setSelected((s) => (s.has(id) ? (s.delete(id), new Set(s)) : new Set(s.add(id))))
  const categories = (tree ?? []).filter((c) => !arena || c.arena === arena)
  const mineCount = rows?.filter((r) => !r.is_global).length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
          <BookOpen /> Bank Soal
        </h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModal('packages')} className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
            <Package size={16} /> Paket soal {selected.size > 0 && `(${selected.size} dicentang)`}
          </button>
          <button onClick={() => setModal('import')} className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
            <FileUp size={16} /> Impor CSV
          </button>
          <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Tambah Soal
          </button>
        </div>
      </div>

      <section className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-48 flex-1">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari teks soal / Arab / penjelasan" className="w-full rounded-xl border border-line py-2 pr-3 pl-9 text-sm outline-none focus:border-primary" />
        </div>
        <select value={arena} onChange={(e) => (setArena(e.target.value as DbArena | ''), setCategory(''), setGameType(''))} className={selectClass} aria-label="Arena">
          <option value="">Semua arena</option>
          <option value="mufrodat">Mufrodat & Muhadatsah</option>
          <option value="qowaid">Qowaid</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} aria-label="Materi">
          <option value="">Semua materi</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} className={selectClass} aria-label="Jenis">
          <option value="">Semua jenis</option>
          {Object.entries(GAME_TYPE_LABEL)
            .filter(([t]) => !arena || ARENA_BY_DB[arena].games.some((g) => g.type === t))
            .map(([t, l]) => (
              <option key={t} value={t}>
                {l}
              </option>
            ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')} className={selectClass} aria-label="Tingkat">
          <option value="">Semua tingkat</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value as 'all' | 'global' | 'mine')} className={selectClass} aria-label="Sumber">
          <option value="all">Semua sumber</option>
          <option value="mine">Soal lembaga</option>
          <option value="global">Soal bawaan</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'hard')} className={selectClass} aria-label="Urutan">
          <option value="new">Terbaru</option>
          <option value="hard">Paling sering salah</option>
        </select>
      </section>

      {notice && <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-800">{notice}</p>}
      {onlyIds && (
        <p className="flex items-center justify-between rounded-xl bg-primary/5 p-3 text-sm">
          Menampilkan isi paket ({onlyIds.size} soal).
          <button onClick={() => setOnlyIds(null)} className="font-semibold text-primary">Tampilkan semua</button>
        </p>
      )}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <p className="text-xs text-muted">
        {rows ? `${shown.length} soal ditampilkan · ${mineCount} milik lembaga` : 'Memuat…'}
        {sort === 'hard' && ' · hanya soal dengan minimal 3 jawaban'}
      </p>

      <section className="card divide-y divide-line">
        {!rows && <Loader2 className="mx-auto my-10 animate-spin text-primary" />}
        {rows && shown.length === 0 && <p className="p-8 text-center text-sm text-muted">Tidak ada soal untuk filter ini.</p>}
        {shown.map((q) => (
          <div key={q.id} className={`flex items-start gap-3 p-3 sm:p-4 ${q.is_published ? '' : 'bg-slate-50 opacity-70'}`}>
            <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} aria-label="Pilih soal untuk paket" className="mt-1 size-4 accent-[#173b57]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                <RichText text={q.prompt} />
              </p>
              {q.prompt_ar && <p className="arabic text-right text-lg text-primary" dir="rtl">{q.prompt_ar.replace(/\[\[|\]\]/g, '')}</p>}
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${ARENA_BY_DB[q.arena].color.soft} ${ARENA_BY_DB[q.arena].color.text}`}>{GAME_TYPE_LABEL[q.game_type] ?? q.game_type}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{q.category_name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{DIFFICULTY_LABEL[q.difficulty]}</span>
                {q.variety === 'amiyah_mesir' && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Amiyah</span>}
                <span className={`rounded-full px-2 py-0.5 ${q.is_global ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>{q.is_global ? 'Bawaan' : 'Lembaga'}</span>
                {!q.is_published && <span className="rounded-full bg-slate-200 px-2 py-0.5">Tidak terbit</span>}
              </div>
            </div>
            <div className="hidden w-24 shrink-0 text-right text-xs sm:block">
              {q.times_answered > 0 ? (
                <>
                  <span className={`text-base font-extrabold ${q.accuracy !== null && q.accuracy < 50 ? 'text-red-600' : q.accuracy !== null && q.accuracy < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>{q.accuracy}%</span>
                  <span className="block text-muted">{q.times_answered}× dijawab</span>
                </>
              ) : (
                <span className="text-muted">Belum dimainkan</span>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => setEditing(q.id)} aria-label={q.editable ? 'Ubah soal' : 'Lihat soal'} className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-primary">
                <Pencil size={16} />
              </button>
              {q.editable && (
                <button onClick={() => remove(q)} aria-label="Hapus soal" className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {editing !== undefined && (
        <QuestionEditor
          id={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            setNotice('Soal tersimpan.')
            load()
          }}
        />
      )}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onDone={load} />}
      {modal === 'packages' && <PackagesModal selected={[...selected]} onClose={() => setModal(null)} onLoad={(ids) => setOnlyIds(new Set(ids))} />}
    </div>
  )
}
