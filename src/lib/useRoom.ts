import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { api, type RoomState } from './api'
import { errorMessage, supabase } from './supabase'

const POLL_MS = 4000 // cadangan jika realtime terputus
const HEARTBEAT_MS = 10000 // tanda "masih online" (server menganggap terputus setelah 25 dtk)

// Status room multiplayer. Server adalah sumber kebenaran:
// setiap perubahan menaikkan room.version → Supabase Realtime memberi sinyal → ambil room_state().
export function useRoom(code: string) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [data, setData] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false) // realtime tersambung
  const fetchedAt = useRef(0) // performance.now() saat status terakhir diterima
  const inflight = useRef(false)
  const again = useRef(false)

  const refresh = useCallback(async () => {
    if (!roomId) return
    if (inflight.current) {
      again.current = true // gabungkan permintaan yang datang bersamaan
      return
    }
    inflight.current = true
    try {
      const s = await api.roomState(roomId)
      fetchedAt.current = performance.now()
      setData(s)
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      inflight.current = false
      if (again.current) {
        again.current = false
        refresh()
      }
    }
  }, [roomId])

  // Gabung (atau gabung kembali) lalu cari id room
  useEffect(() => {
    let alive = true
    api
      .joinRoom(code)
      .then((c) => api.roomId(c))
      .then((id) => alive && setRoomId(id))
      .catch((e) => alive && setError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [code])

  // Realtime + polling cadangan + heartbeat
  useEffect(() => {
    if (!roomId) return
    refresh()
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, () => refresh())
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))
    const poll = setInterval(refresh, POLL_MS)
    const beat = setInterval(() => api.heartbeat(roomId).catch(() => {}), HEARTBEAT_MS)
    const onVisible = () => document.visibilityState === 'visible' && (api.heartbeat(roomId).catch(() => {}), refresh())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
      clearInterval(beat)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [roomId, refresh])

  // Jalankan aksi server lalu segarkan; pesan error dikembalikan agar bisa ditampilkan
  const act = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn()
        await refresh()
        return null
      } catch (e) {
        await refresh()
        return errorMessage(e)
      }
    },
    [refresh],
  )

  return { roomId, data, error, live, refresh, act, fetchedAt }
}

// Hitung mundur dari sisa waktu versi server (ms) sejak status diterima.
// null = belum mulai menghitung untuk `key` ini (mis. tepat setelah fase berganti),
// agar nilai lama (0) tidak dikira "waktu habis".
export function useCountdown(remainingMs: number | undefined, fetchedAt: RefObject<number>, key: unknown) {
  const [s, setS] = useState<{ key: unknown; left: number } | null>(null)
  useEffect(() => {
    if (remainingMs === undefined) return
    const end = fetchedAt.current + remainingMs
    const tick = () => setS({ key, left: Math.max(0, end - performance.now()) })
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [remainingMs, fetchedAt, key])
  if (remainingMs === undefined || !s || s.key !== key) return null
  return s.left
}

// Minta server maju saat waktu habis. Boleh diulang (setiap 2,5 dtk) karena server
// hanya maju jika syaratnya benar-benar terpenuhi; jam perangkat bisa sedikit berbeda.
export function useAdvanceRetry() {
  const last = useRef<{ key: string; at: number }>({ key: '', at: 0 })
  return useCallback((key: string, fn: () => void) => {
    const now = performance.now()
    if (last.current.key === key && now - last.current.at < 2500) return
    last.current = { key, at: now }
    fn()
  }, [])
}
