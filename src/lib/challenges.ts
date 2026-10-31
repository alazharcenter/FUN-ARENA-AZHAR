import type { ChallengeRow } from './api'
import { ARENA_BY_DB, DIFFICULTY_LABEL } from './arenas'

// Ringkasan sumber soal sebuah tantangan, mis. "Qowaid · Fa'il · Beginner" atau "Paket: ..."
export function challengeSource(c: ChallengeRow) {
  if (c.package_name) return `Paket: ${c.package_name}`
  return [c.arena ? ARENA_BY_DB[c.arena].name : null, c.category_name, c.difficulty ? DIFFICULTY_LABEL[c.difficulty] : null]
    .filter(Boolean)
    .join(' · ')
}

