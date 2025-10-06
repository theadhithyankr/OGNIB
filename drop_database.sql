-- Drop Database Script
-- Run this in your Supabase SQL editor to remove all Bingo tables and functions

-- Drop all triggers first
DROP TRIGGER IF EXISTS update_games_updated_at ON games;

-- Drop all tables (CASCADE will handle foreign key dependencies)
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS moves CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS games CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_bingo_board();
DROP FUNCTION IF EXISTS generate_game_code();

-- Note: We're not dropping the uuid-ossp extension as it might be used by other tables
-- If you want to drop it too, uncomment the line below:
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Confirmation message
SELECT 'All Bingo database tables and functions have been dropped successfully!' as status;