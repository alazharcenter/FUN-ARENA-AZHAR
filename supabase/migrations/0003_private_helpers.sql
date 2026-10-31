-- =====================================================================
-- Pindahkan fungsi bantu RLS ke skema `private` agar tidak bisa dipanggil
-- lewat API (/rest/v1/rpc/...). Policy RLS tetap berfungsi karena merujuk
-- fungsi berdasarkan OID, bukan nama.
-- =====================================================================
create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.my_role()             set schema private;
alter function public.my_institution()      set schema private;
alter function public.is_staff()            set schema private;
alter function public.is_room_member(uuid)  set schema private;

-- Fungsi yang memanggil helper tanpa nama skema perlu mencari di `private` juga
alter function private.is_staff()                                                set search_path = public, private;
alter function public.quick_play_catalog(arena_type)                             set search_path = public, private;
alter function public.start_quick_play(arena_type, text, difficulty, integer)    set search_path = public, private;
alter function public.submit_answer(uuid, uuid, text)                            set search_path = public, private;
alter function public.finish_quick_play(uuid)                                    set search_path = public, private;

-- Catatan: question_packages, package_questions, parent_links sengaja belum punya
-- policy (tertutup total) sampai fitur paket soal & orang tua dibangun di Tahap 6.
