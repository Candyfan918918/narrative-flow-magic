export type SupportMode = 'heard' | 'advice'

export interface ReactionCounts {
  heard: number
  same: number
  strong: number
  time: number
  brave: number
}

export interface RoomComment {
  alias: string
  emoji: string
  hours: string
  text: string
}

export interface Room {
  id: string
  alias: string
  emoji: string
  title: string
  category?: string
  tone?: string
  drama?: number
  support: SupportMode
  relates: number
  sitting: number
  hours: string
  reactions: ReactionCounts
  body: string
  reflection: string
  hall: string
  rested?: boolean
  comments?: RoomComment[]
  is_seed?: boolean
}

export interface HofEntry {
  id?: string
  rank?: number
  alias?: string
  emoji?: string
  title?: string
  resonance?: number
  band?: string
  relates?: number
  hours?: string
}

export interface SeedData {
  rooms: Room[]
  hof?: Record<string, HofEntry[]>
  generatedFrom?: string
  count?: number
}

export interface Reaction {
  k: keyof ReactionCounts
  emoji: string
  label: string
  color: string
}

export interface Alias {
  name?: string
  emoji?: string
}
