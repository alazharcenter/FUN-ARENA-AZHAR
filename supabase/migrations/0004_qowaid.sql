-- =====================================================================
-- FUN ARENA AZHAR CENTER — Tahap 3: Qowaid Arena
--   * questions.seed_key  → seed soal bisa dijalankan berulang (soal baru saja yang masuk)
--   * Quick Play bisa difilter per jenis permainan (I'rab Challenge, Tashrif Battle, ...)
--   * quick_play_game_types → jumlah soal per jenis untuk kartu permainan di halaman arena
-- =====================================================================

-- Kunci stabil untuk soal dari file seed: md5(slug kategori | jenis | prompt | prompt_ar)
alter table questions add column seed_key text unique;

update questions q
set seed_key = md5(c.slug || '|' || q.game_type::text || '|' || q.prompt || '|' || coalesce(q.prompt_ar, ''))
from categories c
where c.id = q.category_id and q.institution_id is null;

-- ---------------------------------------------------------------------
-- Katalog & mulai permainan kini menerima filter jenis permainan (opsional)
drop function quick_play_catalog(arena_type);
create function quick_play_catalog(p_arena arena_type, p_game_type game_type default null)
returns table (
  category_slug text, category_name text, category_name_ar text,
  group_name text, group_name_ar text,
  beginner integer, intermediate integer, advanced integer
)
language sql stable security definer set search_path = public, private as
$$
  select c.slug, c.name, c.name_ar, g.name, g.name_ar,
         count(q.id) filter (where q.difficulty = 'beginner')::integer,
         count(q.id) filter (where q.difficulty = 'intermediate')::integer,
         count(q.id) filter (where q.difficulty = 'advanced')::integer
  from categories c
  join categories g on g.id = c.parent_id
  left join questions q
         on q.category_id = c.id and q.is_published
        and (q.institution_id is null or q.institution_id = my_institution())
        and (p_game_type is null or q.game_type = p_game_type)
  where c.arena = p_arena
  group by c.id, g.id
  order by g.sort_order, c.sort_order
$$;

create function quick_play_game_types(p_arena arena_type)
returns table (game_type game_type, total integer)
language sql stable security definer set search_path = public, private as
$$
  select q.game_type, count(*)::integer
  from questions q join categories c on c.id = q.category_id
  where q.is_published and c.arena = p_arena
    and (q.institution_id is null or q.institution_id = my_institution())
  group by q.game_type
$$;

drop function start_quick_play(arena_type, text, difficulty, integer);
create function start_quick_play(
  p_arena arena_type,
  p_category_slug text default null,
  p_difficulty difficulty default null,
  p_count integer default 10,
  p_game_type game_type default null
) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare
  v_session  uuid;
  v_cat_name text;
  v_n        integer;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;
  p_count := least(greatest(coalesce(p_count, 10), 1), 20);

  if p_category_slug is not null then
    select name into v_cat_name from categories where slug = p_category_slug and arena = p_arena;
    if v_cat_name is null then raise exception 'Kategori tidak ditemukan'; end if;
  end if;

  -- Hanya satu sesi Quick Play aktif per santri
  update game_sessions set status = 'abandoned', ended_at = now()
  where user_id = auth.uid() and room_id is null and status = 'active';

  insert into game_sessions (user_id, arena, settings)
  values (auth.uid(), p_arena, jsonb_build_object(
    'category_slug', p_category_slug,
    'category_name', coalesce(v_cat_name, 'Semua materi'),
    'difficulty', p_difficulty,
    'game_type', p_game_type,
    'count', p_count))
  returning id into v_session;

  insert into game_questions (session_id, question_id, order_index)
  select v_session, pick.id, row_number() over (order by random())
  from (
    select q.id
    from questions q join categories c on c.id = q.category_id
    where q.is_published and c.arena = p_arena
      and (q.institution_id is null or q.institution_id = my_institution())
      and (p_category_slug is null or c.slug = p_category_slug)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (p_game_type is null or q.game_type = p_game_type)
    order by random()
    limit p_count
  ) pick;

  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Belum ada soal untuk pilihan ini'; end if;
  return v_session;
end;
$$;

revoke execute on function
  quick_play_catalog(arena_type, game_type),
  quick_play_game_types(arena_type),
  start_quick_play(arena_type, text, difficulty, integer, game_type)
from public, anon;

grant execute on function
  quick_play_catalog(arena_type, game_type),
  quick_play_game_types(arena_type),
  start_quick_play(arena_type, text, difficulty, integer, game_type)
to authenticated;
