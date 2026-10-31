import { useEffect, useState } from 'react'
import { api, type CatalogItem, type CategoryNode } from './api'
import { ARENAS, type ArenaId, type Difficulty } from './arenas'
import { errorMessage } from './supabase'

// Jumlah soal pada kategori sesuai tingkat terpilih (null = semua tingkat)
export function countFor(item: CatalogItem, difficulty: Difficulty | null) {
  return difficulty ? item[difficulty] : item.beginner + item.intermediate + item.advanced
}

// Daftar kategori + jumlah soal dari database (opsional: hanya satu jenis permainan)
export function useCatalog(arena: ArenaId, gameType: string | null = null) {
  const key = `${arena}|${gameType ?? ''}`
  const [state, setState] = useState<{ key: string; catalog: CatalogItem[] | null; error: string | null }>({
    key,
    catalog: null,
    error: null,
  })

  useEffect(() => {
    let alive = true
    api
      .catalog(ARENAS[arena].db, gameType)
      .then((catalog) => alive && setState({ key, catalog, error: null }))
      .catch((e) => alive && setState({ key, catalog: null, error: errorMessage(e) }))
    return () => {
      alive = false
    }
  }, [arena, gameType, key])

  // Saat pilihan berganti, jangan tampilkan katalog sebelumnya
  if (state.key !== key) return { catalog: null, error: null }
  return { catalog: state.catalog, error: state.error }
}

// Jumlah soal per jenis permainan untuk satu arena (null = masih memuat)
export function useGameTypeCounts(arena: ArenaId) {
  const [state, setState] = useState<{ arena: ArenaId; counts: Record<string, number> | null }>({ arena, counts: null })
  useEffect(() => {
    let alive = true
    api
      .gameTypes(ARENAS[arena].db)
      .then((counts) => alive && setState({ arena, counts }))
      .catch(() => alive && setState({ arena, counts: {} }))
    return () => {
      alive = false
    }
  }, [arena])
  return state.arena === arena ? state.counts : null
}

// Struktur kategori (arena → kelompok → materi) untuk formulir guru
let treeCache: Promise<CategoryNode[]> | null = null
export function useCategoryTree() {
  const [tree, setTree] = useState<CategoryNode[] | null>(null)
  useEffect(() => {
    treeCache ??= api.categoryTree().catch((e) => {
      treeCache = null
      throw e
    })
    let alive = true
    treeCache.then((t) => alive && setTree(t)).catch(() => alive && setTree([]))
    return () => {
      alive = false
    }
  }, [])
  return tree
}
