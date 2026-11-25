// Menghasilkan supabase/seed/seed.sql dari supabase/seed/data*.mjs
// Jalankan: npm run seed:build
// Aman dijalankan berulang: kategori di-upsert, soal yang sudah ada (seed_key sama) dilewati.
// Opsi: --only=qowaid --out=file.sql  → hanya soal dari satu modul (untuk menambah soal baru)
//       --part=1/2                      → bagi soal menjadi beberapa file (jika terlalu besar)
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { CATEGORIES, QUESTIONS as MUFRODAT } from '../supabase/seed/data.mjs'
import { QUESTIONS as QOWAID } from '../supabase/seed/data-qowaid.mjs'
import { QUESTIONS as MUFRODAT2 } from '../supabase/seed/data-mufrodat-2.mjs'
import { QUESTIONS as QOWAID2 } from '../supabase/seed/data-qowaid-2.mjs'

const MODULES = { mufrodat: MUFRODAT, qowaid: QOWAID, mufrodat2: MUFRODAT2, qowaid2: QOWAID2 }
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const QUESTIONS = args.only ? MODULES[args.only] : Object.values(MODULES).flat()
if (!QUESTIONS) throw new Error(`Modul tidak dikenal: ${args.only}`)
const SLUGS = new Set(CATEGORIES.flatMap((g) => g.children.map(([slug]) => slug)))

const TIME = { beginner: 20, intermediate: 25, advanced: 30 }

function check(q, i) {
  const where = `Soal #${i + 1} (${q.cat})`
  if (!SLUGS.has(q.cat)) throw new Error(`${where}: kategori tidak dikenal`)
  if (!q.explanation) throw new Error(`${where}: explanation wajib diisi`)
  if (q.type === 'sentence_builder') {
    if (!q.tiles?.length || !q.accepted?.length) throw new Error(`${where}: tiles & accepted wajib`)
    for (const a of q.accepted) {
      if (a.split(/\s+/).sort().join(' ') !== [...q.tiles].sort().join(' '))
        throw new Error(`${where}: accepted "${a}" tidak cocok dengan tiles`)
    }
  } else {
    if (!q.options || q.options.length < 2) throw new Error(`${where}: minimal 2 pilihan`)
    if (new Set(q.options).size !== q.options.length) throw new Error(`${where}: pilihan ganda duplikat`)
  }
}

const categories = CATEGORIES.map((g, gi) => ({
  arena: g.arena, slug: g.slug, name: g.name, name_ar: g.name_ar, sort: gi,
  children: g.children.map(([slug, name, name_ar], ci) => ({ slug, name, name_ar, sort: ci })),
}))

// Harus sama dengan rumus di migrasi 0004: md5(slug | jenis | prompt | prompt_ar)
const seedKey = (q) => createHash('md5').update(`${q.cat}|${q.type}|${q.prompt}|${q.ar ?? ''}`, 'utf8').digest('hex')
const seen = new Set()

let questions = QUESTIONS.map((q, i) => {
  check(q, i)
  const key = seedKey(q)
  if (seen.has(key)) throw new Error(`Soal #${i + 1} (${q.cat}) duplikat: ${q.prompt} ${q.ar ?? ''}`)
  seen.add(key)
  const builder = q.type === 'sentence_builder'
  return {
    key,
    cat: q.cat, type: q.type, level: q.level, variety: q.variety ?? 'fusha',
    prompt: q.prompt, ar: q.ar ?? null, explanation: q.explanation,
    time: builder ? 45 : TIME[q.level],
    options: builder ? q.tiles : q.options,
    correct: builder ? null : (q.answer ?? 0) + 1, // posisi jawaban benar (1-based)
    accepted: builder ? q.accepted : [],
  }
})

if (args.part) {
  const [n, total] = args.part.split('/').map(Number)
  const size = Math.ceil(questions.length / total)
  questions = questions.slice((n - 1) * size, n * size)
}

const json = (v) => {
  const s = JSON.stringify(v)
  if (s.includes('$j$')) throw new Error('Data mengandung $j$')
  return `$j$${s}$j$::jsonb`
}

const sql = `-- DIHASILKAN OTOMATIS oleh scripts/build-seed.mjs — jangan diedit manual.
-- Sumber: supabase/seed/data.mjs
-- Aman diulang: kategori di-upsert, soal dengan seed_key yang sudah ada dilewati.
do $seed$
declare
  g jsonb; c jsonb; q jsonb;
  v_parent uuid; v_q uuid; v_correct uuid;
  i integer; v_added integer := 0;
begin
  for g in select * from jsonb_array_elements(${json(categories)}) loop
    insert into categories (arena, slug, name, name_ar, sort_order)
    values ((g->>'arena')::arena_type, g->>'slug', g->>'name', g->>'name_ar', (g->>'sort')::int)
    on conflict (slug) do update set name = excluded.name, name_ar = excluded.name_ar, sort_order = excluded.sort_order
    returning id into v_parent;
    for c in select * from jsonb_array_elements(g->'children') loop
      insert into categories (arena, parent_id, slug, name, name_ar, sort_order)
      values ((g->>'arena')::arena_type, v_parent, c->>'slug', c->>'name', c->>'name_ar', (c->>'sort')::int)
      on conflict (slug) do update set parent_id = excluded.parent_id, name = excluded.name,
        name_ar = excluded.name_ar, sort_order = excluded.sort_order;
    end loop;
  end loop;

  for q in select * from jsonb_array_elements(${json(questions)}) loop
    if not exists (select 1 from categories where slug = q->>'cat') then
      raise exception 'Kategori % tidak ada', q->>'cat';
    end if;
    v_q := null;
    insert into questions (seed_key, category_id, game_type, difficulty, variety, prompt, prompt_ar, explanation, time_limit_sec, is_published)
    select q->>'key', id, (q->>'type')::game_type, (q->>'level')::difficulty, (q->>'variety')::arabic_variety,
           q->>'prompt', q->>'ar', q->>'explanation', (q->>'time')::int, true
    from categories where slug = q->>'cat'
    on conflict (seed_key) do nothing
    returning id into v_q;
    continue when v_q is null;   -- sudah ada
    v_added := v_added + 1;

    for i in 0 .. jsonb_array_length(q->'options') - 1 loop
      insert into answer_options (question_id, label, is_arabic, position)
      values (v_q, q->'options'->>i, (q->'options'->>i) ~ '[\\u0600-\\u06FF]', i + 1);
    end loop;

    -- correct null = soal susun kalimat (dinilai lewat accepted_texts)
    v_correct := null;
    select id into v_correct from answer_options
    where question_id = v_q and position = (q->>'correct')::int;

    insert into answer_keys (question_id, correct_option_id, accepted_texts)
    values (v_q, v_correct, array(select jsonb_array_elements_text(q->'accepted')));
  end loop;
  raise notice 'Soal baru ditambahkan: %', v_added;
end
$seed$;
`
const out = args.out ?? new URL('../supabase/seed/seed.sql', import.meta.url)
writeFileSync(out, sql)
console.log(`seed.sql dibuat: ${categories.reduce((n, g) => n + 1 + g.children.length, 0)} kategori, ${questions.length} soal, ${sql.length} karakter`)
