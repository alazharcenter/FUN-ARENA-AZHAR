-- Alat bantu uji (skema t), di-include oleh setiap file *_test.sql dan dihapus di akhirnya.
create schema t;
grant usage on schema t to anon, authenticated;
create function t.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end $$;
create function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'GAGAL: %', msg; end if;
  raise notice 'lolos: %', msg;
end $$;
-- sql harus GAGAL (ditolak server); pesan galat ditampilkan untuk dibaca
create function t.denied(sql text, msg text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'lolos: % (ditolak: %)', msg, sqlerrm;
    return;
  end;
  raise exception 'GAGAL: % — perintah seharusnya ditolak: %', msg, sql;
end $$;
-- kunci jawaban, hanya untuk uji (security definer milik pemilik database)
create function t.key_of(gq uuid) returns uuid language sql security definer as $$
  select k.correct_option_id from answer_keys k join game_questions g on g.question_id = k.question_id where g.id = gq $$;
grant execute on all functions in schema t to anon, authenticated;
