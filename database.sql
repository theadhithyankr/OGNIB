-- Multiplayer Bingo Database Schema
-- Run this in your Supabase SQL editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'started', 'finished')),
  numbers_called JSONB DEFAULT '[]',
  current_number INTEGER CHECK (current_number >= 1 AND current_number <= 75),
  current_letter VARCHAR(1) CHECK (current_letter IN ('B', 'I', 'N', 'G', 'O')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id VARCHAR(255) NOT NULL PRIMARY KEY, -- User-provided ID (can be any string)
  name VARCHAR(50) NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  board JSONB NOT NULL, -- 5x5 array of numbers
  is_host BOOLEAN DEFAULT FALSE,
  has_won BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moves table (tracks drawn numbers)
CREATE TABLE moves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number >= 1 AND number <= 75),
  drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table (tracks bingo claims)
CREATE TABLE claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
  pattern VARCHAR(20) NOT NULL CHECK (pattern IN ('row', 'column', 'diagonal')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_moves_game_id ON moves(game_id);
CREATE INDEX idx_claims_game_id ON claims(game_id);

-- Enable Row Level Security (RLS) - DISABLED for demo purposes
-- ALTER TABLE games ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies - DISABLED for demo purposes
-- For production, you should enable these and modify them according to your needs

-- Games policies
-- CREATE POLICY "Anyone can read games" ON games FOR SELECT USING (true);
-- CREATE POLICY "Anyone can create games" ON games FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Host can update their games" ON games FOR UPDATE USING (host_id = auth.uid());

-- Players policies
-- CREATE POLICY "Anyone can read players" ON players FOR SELECT USING (true);
-- CREATE POLICY "Anyone can create players" ON players FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Players can update themselves" ON players FOR UPDATE USING (id = auth.uid());

-- Moves policies
-- CREATE POLICY "Anyone can read moves" ON moves FOR SELECT USING (true);
-- CREATE POLICY "Game hosts can create moves" ON moves FOR INSERT WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM games 
--     WHERE id = game_id AND host_id = auth.uid()
--   )
-- );

-- Claims policies
-- CREATE POLICY "Anyone can read claims" ON claims FOR SELECT USING (true);
-- CREATE POLICY "Players can create claims for themselves" ON claims FOR INSERT WITH CHECK (player_id = auth.uid());

-- Functions

-- Function to generate a unique game code
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  code VARCHAR(6);
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character code using letters and numbers
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_check FROM games WHERE games.code = code;
    
    -- If it doesn't exist, return it
    IF exists_check = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a bingo board
CREATE OR REPLACE FUNCTION generate_bingo_board()
RETURNS JSONB AS $$
DECLARE
  board JSONB := '[]'::JSONB;
  col_numbers INTEGER[];
  selected INTEGER[];
  i INTEGER;
  j INTEGER;
  random_num INTEGER;
BEGIN
  -- Generate board for each column (B-I-N-G-O)
  FOR i IN 0..4 LOOP
    -- Define number range for each column
    CASE i
      WHEN 0 THEN col_numbers := ARRAY(SELECT generate_series(1, 15));   -- B column
      WHEN 1 THEN col_numbers := ARRAY(SELECT generate_series(16, 30));  -- I column
      WHEN 2 THEN col_numbers := ARRAY(SELECT generate_series(31, 45));  -- N column
      WHEN 3 THEN col_numbers := ARRAY(SELECT generate_series(46, 60));  -- G column
      WHEN 4 THEN col_numbers := ARRAY(SELECT generate_series(61, 75));  -- O column
    END CASE;
    
    -- Select 5 random numbers from the column range
    selected := '{}';
    FOR j IN 1..5 LOOP
      LOOP
        random_num := col_numbers[1 + FLOOR(RANDOM() * array_length(col_numbers, 1))];
        IF NOT (random_num = ANY(selected)) THEN
          selected := array_append(selected, random_num);
          EXIT;
        END IF;
      END LOOP;
    END LOOP;
    
    -- Add column to board
    board := board || jsonb_build_array(selected);
  END LOOP;
  
  -- Make center cell (2,2) free by setting it to 0
  board := jsonb_set(board, '{2,2}', '0');
  
  RETURN board;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();