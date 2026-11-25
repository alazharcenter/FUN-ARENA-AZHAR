import { useEffect, useState, type ReactNode } from 'react'
import { ImagePlus, Loader2, Music, Plus, Trash2, X } from 'lucide-react'
import { api, type DbArena, type QuestionData, type ServedQuestion } from '../../lib/api'
import { ARENA_BY_DB, DIFFICULTIES, GAME_TYPE_LABEL } from '../../lib/arenas'
import { useCategoryTree } from '../../lib/catalog'
import { errorMessage, supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { QuestionView } from '../../components/QuestionPlayer'
import { RichText } from '../../components/ui'
import { Choice, Toggle } from '../../components/form'

const EMPTY: QuestionData = {
  category_slug: '',
  game_type: 'vocabulary_challenge',
  difficulty: 'beginner',
  variety: 'fusha',
  prompt: '',
  prompt_ar: '',
  explanation: '',
  image_url: '',
  audio_url: '',
  time_limit_sec: null,
  is_published: true,
  options: ['', '', '', ''],
  correct: 1,
  accepted: [''],
}

const ARABIC = /[؀-ۿ]/
const inputClass = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'
const arabicInput = `${inputClass} arabic text-right text-lg`

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 block text-sm font-bold">
      {children} {hint && <span className="font-normal text-muted">{hint}</span>}
    </span>
  )
}

// Unggah gambar/audio ke Supabase Storage (folder lembaga), kembalikan URL publik
async function uploadMedia(file: File, institutionId: string) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran file maksimal 5 MB')
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-40)
  const path = `${institutionId}/${crypto.randomUUID()}-${safe}`
  const { error } = await supabase.storage.from('question-media').upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from('question-media').getPublicUrl(path).data.publicUrl
}

export default function QuestionEditor({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth()
  const tree = useCategoryTree()
  const [q, setQ] = useState<QuestionData | null>(id ? null : EMPTY)
  const [arena, setArena] = useState<DbArena>('mufrodat')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<'image' | 'audio' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .getQuestion(id)
      .then((d) => {
        setArena(d.arena ?? 'mufrodat')
        setQ({ ...EMPTY, ...d, prompt_ar: d.prompt_ar ?? '', image_url: d.image_url ?? '', audio_url: d.audio_url ?? '', accepted: d.accepted?.length ? d.accepted : [''] })
      })
      .catch((e) => setError(errorMessage(e)))
  }, [id])

  if (!q) {
    return (
      <Shell onClose={onClose} title="Memuat soal…">
        {error ? <p className="text-sm text-red-700">{error}</p> : <Loader2 className="mx-auto animate-spin text-primary" />}
      </Shell>
    )
  }

  const readOnly = id !== null && q.editable === false
  const set = (patch: Partial<QuestionData>) => setQ({ ...q, ...patch })
  const isBuilder = q.game_type === 'sentence_builder'
  const isTF = q.game_type === 'true_false'
  const groups = (tree ?? []).filter((c) => c.arena === arena)
  const types = Object.keys(GAME_TYPE_LABEL).filter((t) => ARENA_BY_DB[arena].games.some((g) => g.type === t))

  function chooseType(t: string) {
    if (t === 'true_false') set({ game_type: t, options: ['Benar', 'Salah'], correct: 1 })
    else if (q!.game_type === 'true_false') set({ game_type: t, options: ['', '', '', ''], correct: 1 })
    else set({ game_type: t })
  }

  async function upload(kind: 'image' | 'audio', file: File | undefined) {
    if (!file || !profile?.institution_id) return
    setUploading(kind)
    setError(null)
    try {
      const url = await uploadMedia(file, profile.institution_id)
      set(kind === 'image' ? { image_url: url } : { audio_url: url })
    } catch (e) {
      setError(`Gagal mengunggah: ${errorMessage(e)}`)
    }
    setUploading(null)
  }

  async function save() {
    if (!q!.category_slug) return setError('Pilih materi terlebih dahulu.')
    if (!isBuilder && !isTF && !q!.options[(q!.correct ?? 1) - 1]?.trim()) return setError('Pilihan yang ditandai benar masih kosong.')
    setBusy(true)
    setError(null)
    try {
      const options = q!.options.map((o) => o.trim()).filter(Boolean)
      await api.saveQuestion(id, {
        ...q!,
        options,
        accepted: isBuilder ? q!.accepted.map((a) => a.trim()).filter(Boolean) : [],
        correct: isBuilder ? null : q!.correct,
      })
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  // Pratinjau persis seperti yang dilihat santri (jawaban benar sudah dibuka)
  const opts = q.options.map((o) => o.trim()).filter(Boolean)
  const preview: ServedQuestion = {
    game_question_id: 'pratinjau',
    order_index: 1,
    total: 1,
    game_type: q.game_type,
    difficulty: q.difficulty,
    variety: q.variety,
    prompt: q.prompt || 'Pertanyaan akan tampil di sini',
    prompt_ar: q.prompt_ar || null,
    image_url: q.image_url || null,
    audio_url: q.audio_url || null,
    time_limit_sec: q.time_limit_sec ?? 20,
    remaining_ms: (q.time_limit_sec ?? 20) * 1000,
    options: opts.map((label, i) => ({ id: String(i + 1), label, is_arabic: ARABIC.test(label) })),
  }

  return (
    <Shell onClose={onClose} title={readOnly ? 'Lihat soal bawaan' : id ? 'Ubah soal' : 'Tambah soal'}>
      {readOnly && <p className="mb-4 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">Soal bawaan hanya bisa dilihat. Buat soal baru jika ingin versi sendiri.</p>}
      {q.played && !readOnly && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Soal ini sudah pernah dimainkan. Perubahan berlaku untuk permainan berikutnya; jumlah pilihan tidak bisa dikurangi.</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset disabled={readOnly} className="space-y-4">
          <div>
            <Label>Arena</Label>
            <div className="flex gap-2">
              {(['mufrodat', 'qowaid'] as const).map((a) => (
                <Choice key={a} active={arena === a} onClick={() => (setArena(a), set({ category_slug: '', game_type: a === 'qowaid' ? 'irab_challenge' : 'vocabulary_challenge' }))}>
                  {ARENA_BY_DB[a].name}
                </Choice>
              ))}
            </div>
          </div>
          <label className="block">
            <Label>Materi</Label>
            <select value={q.category_slug} onChange={(e) => set({ category_slug: e.target.value })} className={inputClass}>
              <option value="">— pilih materi —</option>
              {[...new Set(groups.map((g) => g.group_name))].map((gn) => (
                <optgroup key={gn} label={gn}>
                  {groups
                    .filter((g) => g.group_name === gn)
                    .map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} {c.name_ar ? `· ${c.name_ar}` : ''}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>Jenis permainan</Label>
              <select value={q.game_type} onChange={(e) => chooseType(e.target.value)} className={inputClass}>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {GAME_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <Label>Ragam bahasa</Label>
              <div className="flex gap-2">
                <Choice active={q.variety === 'fusha'} onClick={() => set({ variety: 'fusha' })}>Fusha</Choice>
                <Choice active={q.variety === 'amiyah_mesir'} onClick={() => set({ variety: 'amiyah_mesir' })}>Amiyah Mesir</Choice>
              </div>
            </div>
          </div>
          <div>
            <Label>Tingkat</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <Choice key={d.id} active={q.difficulty === d.id} onClick={() => set({ difficulty: d.id })}>
                  {d.label}
                </Choice>
              ))}
            </div>
          </div>
          <label className="block">
            <Label>Pertanyaan / instruksi</Label>
            <input value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} placeholder="Contoh: Apa arti kata berikut?" className={inputClass} />
          </label>
          <label className="block">
            <Label hint="(berharakat; tulis [[kata]] untuk menyorot kata yang ditanya)">Teks Arab</Label>
            <input dir="rtl" value={q.prompt_ar} onChange={(e) => set({ prompt_ar: e.target.value })} placeholder="جَاءَ [[الْمُدَرِّسُ]]" className={arabicInput} />
          </label>

          {/* Pilihan jawaban */}
          {isTF ? (
            <div>
              <Label>Jawaban benar</Label>
              <div className="flex gap-2">
                <Choice active={q.correct === 1} onClick={() => set({ correct: 1 })}>Benar</Choice>
                <Choice active={q.correct === 2} onClick={() => set({ correct: 2 })}>Salah</Choice>
              </div>
            </div>
          ) : (
            <div>
              <Label hint={isBuilder ? '(urutan bebas; santri menyusunnya)' : '(pilih bulatan pada jawaban yang benar)'}>{isBuilder ? 'Potongan kata' : 'Pilihan jawaban'}</Label>
              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {!isBuilder && (
                      <input type="radio" name="correct" checked={q.correct === i + 1} onChange={() => set({ correct: i + 1 })} aria-label={`Jawaban benar: pilihan ${i + 1}`} className="size-4 accent-mufrodat" />
                    )}
                    <input
                      dir={ARABIC.test(o) ? 'rtl' : 'auto'}
                      value={o}
                      onChange={(e) => set({ options: q.options.map((x, j) => (j === i ? e.target.value : x)) })}
                      placeholder={isBuilder ? `Kata ${i + 1}` : `Pilihan ${i + 1}`}
                      className={ARABIC.test(o) ? arabicInput : inputClass}
                    />
                    {q.options.length > 2 && (
                      <button type="button" onClick={() => set({ options: q.options.filter((_, j) => j !== i), correct: q.correct && q.correct > i + 1 ? q.correct - 1 : q.correct === i + 1 ? 1 : q.correct })} aria-label="Hapus pilihan" className="rounded-lg p-2 text-muted hover:bg-stone-100">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.options.length < 6 && (
                <button type="button" onClick={() => set({ options: [...q.options, ''] })} className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
                  <Plus size={15} /> Tambah {isBuilder ? 'kata' : 'pilihan'}
                </button>
              )}
            </div>
          )}

          {isBuilder && (
            <label className="block">
              <Label hint="(satu per baris; tulis semua susunan yang benar)">Susunan kalimat yang benar</Label>
              <textarea dir="rtl" rows={2} value={q.accepted.join('\n')} onChange={(e) => set({ accepted: e.target.value.split('\n') })} className={arabicInput} />
            </label>
          )}

          <label className="block">
            <Label hint="(wajib; kaidah singkat & benar)">Penjelasan</Label>
            <textarea rows={3} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} className={inputClass} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Gambar</Label>
              {q.image_url ? (
                <div className="flex items-center gap-2">
                  <img src={q.image_url} alt="" className="h-14 rounded-lg border border-line" />
                  <button type="button" onClick={() => set({ image_url: '' })} className="text-xs font-semibold text-red-600">Hapus</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-muted hover:bg-stone-50">
                  {uploading === 'image' ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Unggah gambar
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => upload('image', e.target.files?.[0])} />
                </label>
              )}
            </div>
            <div>
              <Label>Audio</Label>
              {q.audio_url ? (
                <div className="flex items-center gap-2">
                  <audio controls src={q.audio_url} className="h-9 w-40" />
                  <button type="button" onClick={() => set({ audio_url: '' })} className="text-xs font-semibold text-red-600">Hapus</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-muted hover:bg-stone-50">
                  {uploading === 'audio' ? <Loader2 size={16} className="animate-spin" /> : <Music size={16} />} Unggah audio
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => upload('audio', e.target.files?.[0])} />
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label hint="(kosong = otomatis)">Waktu menjawab (detik)</Label>
              <input type="number" min={5} max={300} value={q.time_limit_sec ?? ''} onChange={(e) => set({ time_limit_sec: e.target.value ? +e.target.value : null })} className={inputClass} />
            </label>
            <div className="pt-7">
              <Toggle checked={q.is_published} onChange={(v) => set({ is_published: v })} label="Terbitkan" hint="Soal tidak terbit tidak muncul di permainan." />
            </div>
          </div>
        </fieldset>

        {/* Pratinjau */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Pratinjau santri</p>
          <div className="rounded-2xl bg-bg p-3 ring-1 ring-line">
            <QuestionView
              question={preview}
              timeLeft={preview.remaining_ms}
              locked
              chosen={null}
              correctOptionId={isBuilder ? undefined : q.correct ? String(q.correct) : undefined}
              builderResult={null}
              onChoose={() => {}}
              onSubmitText={() => {}}
            />
            {q.explanation && (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm">
                <RichText text={q.explanation} />
              </p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold">
          {readOnly ? 'Tutup' : 'Batal'}
        </button>
        {!readOnly && (
          <button onClick={save} disabled={busy || !!uploading} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />} Simpan soal
          </button>
        )}
      </div>
    </Shell>
  )
}

export function Shell({ title, onClose, children, wide = true }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 px-3 py-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`mx-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-primary">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
