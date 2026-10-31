// Pembungkus fungsi server (RPC) Supabase. Frontend TIDAK PERNAH menerima kunci
// jawaban sebelum menjawab: semua penilaian ada di supabase/migrations/0002_quick_play.sql
import { supabase } from './supabase'
import type { Difficulty } from './arenas'
import type { Profile } from './useAuth'

export type DbArena = 'mufrodat' | 'qowaid' | 'snake_ladder'

export interface CatalogItem {
  category_slug: string
  category_name: string
  category_name_ar: string | null
  group_name: string
  group_name_ar: string | null
  beginner: number
  intermediate: number
  advanced: number
}

export interface QuestionOption {
  id: string
  label: string
  is_arabic: boolean
}

export interface ServedQuestion {
  game_question_id: string
  order_index: number
  total: number
  game_type: string
  difficulty: Difficulty
  variety: 'fusha' | 'amiyah_mesir'
  prompt: string
  prompt_ar: string | null
  image_url: string | null
  audio_url: string | null
  time_limit_sec: number
  remaining_ms: number
  options: QuestionOption[]
}

export interface AnswerResult {
  is_correct: boolean
  points: number
  correct_option_id: string | null
  correct_text: string | null
  explanation: string
}

export interface ReviewItem {
  order_index: number
  game_type: string
  prompt: string
  prompt_ar: string | null
  your_answer: string | null
  correct_answer: string | null
  is_correct: boolean
  points: number
  time_ms: number
  explanation: string
}

export interface SessionResult {
  status: 'finished' | 'abandoned'
  arena: DbArena
  settings: { category_name?: string; difficulty?: Difficulty | null; count?: number; game_type?: string | null }
  score: number
  correct_count: number
  answered_count: number
  xp_earned: number
  total_xp: number
  level: number
  review: ReviewItem[]
  // Tahap 7
  new_badges?: { code: string; name: string; icon: string; description: string }[]
  xp_halved?: boolean
  challenge_completed?: boolean
}

export interface RecentGame {
  session_id: string
  arena: DbArena
  category_name: string
  score: number
  correct_count: number
  answered_count: number
  xp_earned: number
  ended_at: string
}

export interface PlayerStats {
  xp: number
  level: number
  total_games: number
  total_answered: number
  total_correct: number
  current_streak: number
  longest_streak: number
}

// ---- Multiplayer (Tahap 5) ----
export interface RoomSettings {
  game: 'quiz' | 'snake'
  max_players: number
  host_plays: boolean
  time_limit: number | null
  difficulty: Difficulty | null
  // Quiz Battle
  arena?: 'mufrodat' | 'qowaid'
  category_slug?: string | null
  category_name?: string
  game_type?: string | null
  count?: number
  // Ular tangga
  mode?: 'casual' | 'mixed' | 'qowaid'
  size?: 50 | 100
  wrong_skips?: boolean
  snake_rescue?: boolean
}

export interface RoomPlayer {
  user_id: string
  nickname: string
  color: number
  turn_order: number | null
  is_player: boolean
  is_ready: boolean
  online: boolean
  board_pos: number
  skip: number
  score: number
  correct: number
  answered: number
  answered_current: boolean
}

export interface RoomState {
  room: { id: string; code: string; status: 'lobby' | 'playing' | 'finished' | 'cancelled'; arena: DbArena; settings: RoomSettings; host_id: string; version: number }
  me: string
  players: RoomPlayer[]
  state: {
    phase?: 'lobby' | 'question' | 'reveal' | 'turn' | 'finished'
    // Quiz Battle
    index?: number
    total?: number
    reveal_remaining_ms?: number
    // Ular tangga
    turn_user?: string
    turn_remaining_ms?: number
    dice?: number | null
    move?: { id: number; user: string; path: number[] } | null
    pending?: { user: string; reason: 'challenge' | 'snake' | 'special'; at: number; tile: string } | null
    winner?: string | null
    log?: string[]
  }
  question?: ServedQuestion
  reveal?: {
    correct_option_id?: string | null
    correct_text?: string | null
    explanation?: string
    answer?: { option_id: string | null; text: string | null; is_correct?: boolean; points?: number } | null
  }
}

export interface LeaderboardRow {
  rank: number
  user_id: string
  nickname: string
  total_score: number
  games: number
  is_me: boolean
}

// ---- Guru & Admin (Tahap 6) ----
export interface ClassRow {
  id: string
  name: string
  level: Difficulty
  join_code: string | null // hanya untuk pengelola kelas
  teacher_name: string
  members: number
  is_manager: boolean
  created_at: string
}

export interface ClassMember {
  user_id: string
  nickname: string
  full_name: string
  joined_at: string
  xp: number
  level: number
  games: number
  answered: number
  correct: number
  accuracy: number | null
  streak: number
  last_played_on: string | null
  week_score: number
}

export interface WeakTopic {
  slug: string
  name: string
  name_ar: string | null
  group_name: string
  arena: DbArena
  answered: number
  correct: number
  accuracy: number
  students: number
}

export interface ClassOverview {
  class: { id: string; name: string; level: Difficulty; join_code: string; teacher_name: string; created_at: string }
  members: ClassMember[]
  weak_topics: WeakTopic[]
}

export interface StudentProgress {
  profile: { nickname: string; full_name: string }
  stats: PlayerStats & { last_played_on: string | null }
  topics: { name: string; name_ar: string | null; group_name: string; arena: DbArena; answered: number; correct: number; accuracy: number }[]
  recent: { category_name: string; arena: DbArena; score: number; correct_count: number; answered_count: number; ended_at: string }[]
}

export interface BankQuestion {
  id: string
  category_slug: string
  category_name: string
  arena: DbArena
  game_type: string
  difficulty: Difficulty
  variety: 'fusha' | 'amiyah_mesir'
  prompt: string
  prompt_ar: string | null
  is_published: boolean
  is_global: boolean
  editable: boolean
  times_answered: number
  accuracy: number | null
  created_at: string
}

export interface QuestionData {
  id?: string
  category_slug: string
  game_type: string
  difficulty: Difficulty
  variety: 'fusha' | 'amiyah_mesir'
  prompt: string
  prompt_ar: string
  explanation: string
  image_url: string
  audio_url: string
  time_limit_sec: number | null
  is_published: boolean
  options: string[]
  correct: number | null // posisi 1-based (pilihan ganda)
  accepted: string[] // susunan benar (susun kalimat)
  // hanya dari get_question
  arena?: DbArena
  is_global?: boolean
  editable?: boolean
  played?: boolean
}

export interface PackageRow {
  id: string
  name: string
  description: string | null
  class_id: string | null
  class_name: string | null
  question_count: number
  question_ids: string[]
  created_at: string
}

export interface ChallengeRow {
  id: string
  title: string
  description: string | null
  kind: string
  arena: DbArena | null
  category_slug: string | null
  category_name: string | null
  difficulty: Difficulty | null
  package_id: string | null
  package_name: string | null
  target_count: number
  xp_reward: number
  starts_on: string
  ends_on: string
  class_id: string | null
  class_name: string | null
  completed: boolean
  completions: number
  audience: number
}

export interface CategoryNode {
  arena: DbArena
  group_slug: string
  group_name: string
  slug: string
  name: string
  name_ar: string | null
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  nickname: string
  role: Profile['role']
  institution_name: string | null
  created_at: string
  xp: number | null
  last_played_on: string | null
}

export interface AdminStats {
  scope: string
  users_by_role: Record<string, number> | null
  classes: number
  questions_global: number
  questions_institution: number
  games_7d: number
  answers_7d: number
  active_players_7d: number
  rooms_active: number
  top_categories: { name: string; arena: DbArena; answers: number; accuracy: number }[]
  institutions: { id: string; name: string; slug: string; users: number }[] | null
}

// ---- Gamifikasi (Tahap 7) ----
export interface Badge {
  code: string
  name: string
  description: string
  icon: string
  earned_at: string | null
}

export interface Mission {
  code: string
  period: 'daily' | 'weekly'
  title: string
  description: string
  progress: number
  target: number
  xp: number
  claimed: boolean
}

export interface HistoryRow {
  session_id: string
  arena: DbArena
  category_name: string | null
  mode: string
  score: number
  correct_count: number
  answered_count: number
  xp_earned: number
  ended_at: string | null
  total: number
}

export interface MyProgress {
  skills: { group_slug: string; name: string; name_ar: string | null; arena: DbArena; answered: number; correct: number; accuracy: number | null }[]
  topics: { name: string; name_ar: string | null; group_slug: string; answered: number; correct: number; accuracy: number }[]
  compare: {
    this: { answered: number; correct: number; days: number }
    last: { answered: number; correct: number; days: number }
    xp_this: number
    xp_last: number
  }
  activity: { date: string; answered: number; correct: number }[]
  vocab: {
    mastered: { word: string; answered: number; correct: number }[]
    difficult: { word: string; answered: number; correct: number; explanation: string }[]
    seen: number
  }
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

export const api = {
  catalog: (arena: DbArena, gameType: string | null = null) =>
    rpc<CatalogItem[]>('quick_play_catalog', { p_arena: arena, p_game_type: gameType }),

  // Jumlah soal per jenis permainan, mis. { irab_challenge: 27, tashrif_battle: 17 }
  gameTypes: async (arena: DbArena) => {
    const rows = await rpc<{ game_type: string; total: number }[]>('quick_play_game_types', { p_arena: arena })
    return Object.fromEntries(rows.map((r) => [r.game_type, r.total])) as Record<string, number>
  },

  startQuickPlay: (
    arena: DbArena,
    categorySlug: string | null,
    difficulty: Difficulty | null,
    count: number,
    gameType: string | null = null,
  ) =>
    rpc<string>('start_quick_play', {
      p_arena: arena,
      p_category_slug: categorySlug,
      p_difficulty: difficulty,
      p_count: count,
      p_game_type: gameType,
    }),

  // Tantangan kelas: server menentukan soal dari pengaturan tantangan
  startChallenge: (challengeId: string) => rpc<string>('start_quick_play', { p_arena: 'mufrodat', p_challenge: challengeId }),
  startPackage: (packageId: string, count: number) => rpc<string>('start_quick_play', { p_arena: 'mufrodat', p_package: packageId, p_count: count }),

  // null = semua soal sudah dimainkan
  nextQuestion: async (sessionId: string) => {
    const rows = await rpc<ServedQuestion[]>('next_question', { p_session_id: sessionId })
    return rows[0] ?? null
  },

  submitAnswer: async (gameQuestionId: string, optionId: string | null, text: string | null) => {
    const rows = await rpc<AnswerResult[]>('submit_answer', {
      p_game_question_id: gameQuestionId,
      p_option_id: optionId,
      p_text: text,
    })
    return rows[0]
  },

  finish: (sessionId: string) => rpc<null>('finish_quick_play', { p_session_id: sessionId }),

  result: (sessionId: string) => rpc<SessionResult>('get_session_result', { p_session_id: sessionId }),

  // ---- Ular Tangga (Tahap 4) ----
  startSnake: (mode: string, difficulty: Difficulty | null, players: number, timeLimit: number | null) =>
    rpc<string>('start_snake_game', { p_mode: mode, p_difficulty: difficulty, p_players: players, p_time_limit: timeLimit }),

  snakeQuestion: async (sessionId: string, tile: string, harder = false) => {
    const rows = await rpc<ServedQuestion[]>('snake_question', { p_session_id: sessionId, p_tile: tile, p_harder: harder })
    return rows[0]
  },

  finishSnake: (sessionId: string) => rpc<null>('finish_snake_game', { p_session_id: sessionId }),

  // ---- Multiplayer (Tahap 5) ----
  createRoom: (settings: Partial<RoomSettings>) => rpc<string>('create_room', { p_settings: settings }),
  joinRoom: (code: string) => rpc<string>('join_room', { p_code: code }),
  roomId: async (code: string) => {
    const { data, error } = await supabase.from('game_rooms').select('id').eq('code', code).single()
    if (error) throw error
    return data.id as string
  },
  roomState: (roomId: string) => rpc<RoomState>('room_state', { p_room: roomId }),
  leaveRoom: (roomId: string) => rpc<null>('leave_room', { p_room: roomId }),
  setReady: (roomId: string, ready: boolean) => rpc<null>('set_ready', { p_room: roomId, p_ready: ready }),
  updateRoomSettings: (roomId: string, settings: Partial<RoomSettings>) =>
    rpc<null>('update_room_settings', { p_room: roomId, p_settings: settings }),
  heartbeat: (roomId: string) => rpc<null>('room_heartbeat', { p_room: roomId }),
  startRoom: (roomId: string) => rpc<null>('start_room', { p_room: roomId }),
  roomAdvance: (roomId: string) => rpc<null>('room_advance', { p_room: roomId }),
  roomRoll: (roomId: string) => rpc<null>('room_roll', { p_room: roomId }),
  roomSnakeResolve: (roomId: string) => rpc<null>('room_snake_resolve', { p_room: roomId }),
  myActiveRooms: () => rpc<{ code: string; status: string; game: string; players: number }[]>('my_active_rooms'),
  leaderboard: (period: 'today' | 'week' | 'all') => rpc<LeaderboardRow[]>('leaderboard', { p_period: period }),

  // ---- Guru & Admin (Tahap 6) ----
  myClasses: () => rpc<ClassRow[]>('my_classes'),
  createClass: (name: string, level: Difficulty) => rpc<string>('create_class', { p_name: name, p_level: level }),
  updateClass: (id: string, name: string, level: Difficulty, newCode = false) =>
    rpc<null>('update_class', { p_class: id, p_name: name, p_level: level, p_new_code: newCode }),
  deleteClass: (id: string) => rpc<null>('delete_class', { p_class: id }),
  joinClass: (code: string) => rpc<{ id: string; name: string }>('join_class', { p_code: code }),
  leaveClass: (id: string) => rpc<null>('leave_class', { p_class: id }),
  removeMember: (classId: string, studentId: string) => rpc<null>('remove_class_member', { p_class: classId, p_student: studentId }),
  classOverview: (id: string) => rpc<ClassOverview>('class_overview', { p_class: id }),
  studentProgress: (studentId: string) => rpc<StudentProgress>('student_progress', { p_student: studentId }),
  classLeaderboard: (id: string, period: 'today' | 'week' | 'all') =>
    rpc<LeaderboardRow[]>('class_leaderboard', { p_class: id, p_period: period }),

  categoryTree: () => rpc<CategoryNode[]>('category_tree'),
  bankQuestions: (f: { arena?: DbArena | null; category?: string | null; gameType?: string | null; difficulty?: Difficulty | null; source?: 'all' | 'global' | 'mine'; search?: string | null }) =>
    rpc<BankQuestion[]>('bank_questions', {
      p_arena: f.arena ?? null,
      p_category: f.category ?? null,
      p_game_type: f.gameType ?? null,
      p_difficulty: f.difficulty ?? null,
      p_source: f.source ?? 'all',
      p_search: f.search?.trim() || null,
    }),
  getQuestion: (id: string) => rpc<QuestionData>('get_question', { p_id: id }),
  saveQuestion: (id: string | null, data: Partial<QuestionData>) => rpc<string>('save_question', { p_id: id, p_data: data }),
  importQuestions: (rows: Record<string, unknown>[]) => rpc<number>('import_questions', { p_rows: rows }),
  deleteQuestion: (id: string) => rpc<'deleted' | 'archived'>('delete_question', { p_id: id }),

  myPackages: () => rpc<PackageRow[]>('my_packages'),
  savePackage: (id: string | null, name: string, description: string, classId: string | null, questionIds: string[]) =>
    rpc<string>('save_package', { p_id: id, p_name: name, p_description: description, p_class: classId, p_question_ids: questionIds }),
  deletePackage: (id: string) => rpc<null>('delete_package', { p_id: id }),

  myChallenges: (all = false) => rpc<ChallengeRow[]>('my_challenges', { p_all: all }),
  saveChallenge: (id: string | null, data: Record<string, unknown>) => rpc<string>('save_challenge', { p_id: id, p: data }),
  deleteChallenge: (id: string) => rpc<null>('delete_challenge', { p_id: id }),

  adminUsers: (search: string | null) => rpc<AdminUser[]>('admin_users', { p_search: search?.trim() || null }),
  setUserRole: (userId: string, role: Profile['role']) => rpc<null>('set_user_role', { p_user: userId, p_role: role }),
  adminStats: () => rpc<AdminStats>('admin_stats'),
  createInstitution: (name: string, slug: string) => rpc<string>('create_institution', { p_name: name, p_slug: slug }),
  saveCategory: (parentSlug: string, slug: string, name: string, nameAr: string) =>
    rpc<string>('save_category', { p_parent_slug: parentSlug, p_slug: slug, p_name: name, p_name_ar: nameAr }),

  // ---- Gamifikasi (Tahap 7) ----
  myBadges: () => rpc<Badge[]>('my_badges'),
  myMissions: () => rpc<Mission[]>('my_missions'),
  claimMission: (code: string) => rpc<number>('claim_mission', { p_code: code }),
  myHistory: (limit: number, offset: number, arena: DbArena | null) =>
    rpc<HistoryRow[]>('my_history', { p_limit: limit, p_offset: offset, p_arena: arena }),
  myProgress: () => rpc<MyProgress>('my_progress'),

  recentGames: (limit = 5) => rpc<RecentGame[]>('my_recent_games', { p_limit: limit }),

  myStats: async (userId: string) => {
    const { data, error } = await supabase.from('player_stats').select('*').eq('user_id', userId).single()
    if (error) throw error
    return data as PlayerStats
  },
}
