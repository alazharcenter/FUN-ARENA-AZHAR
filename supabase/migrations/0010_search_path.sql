-- Tetapkan search_path untuk fungsi bantu Tahap 6 (saran Supabase security advisor)
alter function private.arena_game_types(arena_type) set search_path = public, private;
