#!/usr/bin/env bash
# Uji database: membuat database PostgreSQL baru, menjalankan semua migrasi + seed, lalu semua file uji.
# Butuh PostgreSQL 15+ lokal. Contoh:
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=... npm run test:db
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${TEST_DB:-fun_arena_test}"
export PGHOST="${PGHOST:-localhost}" PGUSER="${PGUSER:-postgres}"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$DB")

echo "▸ Membuat database uji $DB"
dropdb --if-exists "$DB"
createdb "$DB"
"${PSQL[@]}" -f supabase/tests/00_supabase_stub.sql

for f in supabase/migrations/*.sql; do
  # Storage (gambar soal & avatar) hanya ada di Supabase
  if grep -q "storage\." "$f"; then echo "  - lewati $(basename "$f") (khusus Supabase Storage)"; continue; fi
  echo "  + $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "  + seed.sql"
"${PSQL[@]}" -f supabase/seed/seed.sql > /dev/null

for t in supabase/tests/[1-9]*_test.sql; do
  echo "▸ $(basename "$t")"
  "${PSQL[@]}" -f "$t" 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  /    /' -e 's/^NOTICE:  /    /'
done
[ -n "${KEEP_DB:-}" ] || dropdb "$DB"
echo "✓ Semua uji database lolos"
