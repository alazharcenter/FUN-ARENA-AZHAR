// Preferensi "kurangi animasi" disimpan per perangkat (localStorage) dan dipasang sebagai kelas pada <html>
const KEY = 'fa-reduce-motion'

export function getReduceMotion(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setReduceMotion(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* mode privat: tetap berlaku untuk sesi ini */
  }
  document.documentElement.classList.toggle('reduce-motion', on)
}

export function applyReduceMotion() {
  document.documentElement.classList.toggle('reduce-motion', getReduceMotion())
}
