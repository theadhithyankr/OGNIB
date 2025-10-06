import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()

// Types for our database schema
export interface Game {
  id: string
  host_id: string
  code: string
  status: 'waiting' | 'started' | 'finished'
  current_number?: number
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  name: string
  game_id: string
  board: number[][]
  is_host: boolean
  has_won: boolean
  created_at: string
}

export interface Move {
  id: string
  game_id: string
  number: number
  drawn_at: string
}

export interface Claim {
  id: string
  game_id: string
  player_id: string
  pattern: 'row' | 'column' | 'diagonal'
  verified: boolean
  created_at: string
}