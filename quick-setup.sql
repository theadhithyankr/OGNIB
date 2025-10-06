-- Minimal Bingo Database Setup
-- Run this in Supabase SQL Editor if you want just the essential tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id TEXT NOT NULL,
  code VARCHAR(6) UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'started', 'finished')),
  current_number INTEGER CHECK (current_number >= 1 AND current_number <= 75),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  board JSONB NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  has_won BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moves table
CREATE TABLE IF NOT EXISTS moves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number >= 1 AND number <= 75),
  drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  pattern VARCHAR(20) NOT NULL CHECK (pattern IN ('row', 'column', 'diagonal')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id);
CREATE INDEX IF NOT EXISTS idx_claims_game_id ON claims(game_id);