-- Tetapkan search_path untuk fungsi bantu Tahap 5 (saran Supabase security advisor)
alter function private.is_online(timestamptz)                  set search_path = public, private;
alter function private.bump(uuid)                              set search_path = public, private;
alter function private.snake_board(integer)                    set search_path = public, private;
alter function private.snake_mode_tiles(text)                  set search_path = public, private;
alter function private.snake_path(integer, integer, integer)   set search_path = public, private;
alter function private.add_log(jsonb, text)                    set search_path = public, private;
