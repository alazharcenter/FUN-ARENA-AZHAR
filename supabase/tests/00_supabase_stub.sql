-- Tiruan minimal lingkungan Supabase (peran anon/authenticated, skema auth, auth.uid()) untuk uji di PostgreSQL biasa.
-- Storage tidak ditiru, jadi migrasi 0009 & 0012 dilewati oleh scripts/test-db.sh.
do $$ begin  -- peran berlaku untuk seluruh server, jadi dibuat sekali saja
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
create publication supabase_realtime;
