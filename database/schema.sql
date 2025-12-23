-- King Me Checkers Database Schema
-- Designed for TimescaleDB (PostgreSQL + time-series extension)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- GAMES TABLE (Hypertable for time-series)
-- ============================================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  red_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
  black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  game_mode VARCHAR(20) NOT NULL, -- 'online', 'ai', 'local'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  total_moves INTEGER DEFAULT 0,
  duration_seconds INTEGER, -- Total game duration
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_game_mode CHECK (game_mode IN ('online', 'ai', 'local')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'abandoned'))
);

-- Convert to TimescaleDB hypertable (partitioned by time)
SELECT create_hypertable('games', 'started_at');

CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_red_player ON games(red_player_id, started_at DESC);
CREATE INDEX idx_games_black_player ON games(black_player_id, started_at DESC);
CREATE INDEX idx_games_winner ON games(winner_id, started_at DESC);
CREATE INDEX idx_games_status ON games(status, started_at DESC);

-- ============================================================================
-- GAME_MOVES TABLE (Hypertable for move history)
-- ============================================================================
CREATE TABLE game_moves (
  id UUID DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  player_color VARCHAR(10) NOT NULL, -- 'red' or 'black'
  from_row INTEGER NOT NULL,
  from_col INTEGER NOT NULL,
  to_row INTEGER NOT NULL,
  to_col INTEGER NOT NULL,
  captured_pieces JSONB DEFAULT '[]', -- Array of captured piece positions
  is_promotion BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id, timestamp),
  CONSTRAINT valid_player_color CHECK (player_color IN ('red', 'black')),
  CONSTRAINT valid_board_position CHECK (
    from_row BETWEEN 0 AND 7 AND
    from_col BETWEEN 0 AND 7 AND
    to_row BETWEEN 0 AND 7 AND
    to_col BETWEEN 0 AND 7
  )
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('game_moves', 'timestamp');

CREATE INDEX idx_game_moves_game_id ON game_moves(game_id, move_number);
CREATE INDEX idx_game_moves_player ON game_moves(player_color, timestamp DESC);

-- ============================================================================
-- PLAYER_STATS TABLE
-- ============================================================================
CREATE TABLE player_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Overall statistics
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,

  -- Win statistics by color
  wins_as_red INTEGER DEFAULT 0,
  wins_as_black INTEGER DEFAULT 0,
  losses_as_red INTEGER DEFAULT 0,
  losses_as_black INTEGER DEFAULT 0,

  -- Performance metrics
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  current_loss_streak INTEGER DEFAULT 0,

  -- ELO rating
  elo_rating INTEGER DEFAULT 1200,
  peak_elo_rating INTEGER DEFAULT 1200,

  -- Game metrics
  total_pieces_captured INTEGER DEFAULT 0,
  total_kings_crowned INTEGER DEFAULT 0,
  total_moves_made INTEGER DEFAULT 0,
  average_game_duration_seconds INTEGER,

  -- Timestamps
  first_game_at TIMESTAMPTZ,
  last_game_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_stats_elo ON player_stats(elo_rating DESC);
CREATE INDEX idx_player_stats_wins ON player_stats(total_wins DESC);
CREATE INDEX idx_player_stats_streak ON player_stats(current_win_streak DESC);

-- ============================================================================
-- PLAYER_STATS_HISTORY TABLE (Hypertable for tracking over time)
-- ============================================================================
CREATE TABLE player_stats_history (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elo_rating INTEGER NOT NULL,
  total_games INTEGER NOT NULL,
  total_wins INTEGER NOT NULL,
  win_streak INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id, recorded_at)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('player_stats_history', 'recorded_at');

CREATE INDEX idx_stats_history_user ON player_stats_history(user_id, recorded_at DESC);

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  CONSTRAINT valid_friendship_status CHECK (status IN ('pending', 'accepted', 'blocked')),
  CONSTRAINT different_users CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);

-- ============================================================================
-- LEADERBOARD VIEWS
-- ============================================================================

-- All-time leaderboard
CREATE VIEW leaderboard_alltime AS
SELECT
  u.id,
  u.username,
  u.display_name,
  u.avatar_url,
  ps.elo_rating,
  ps.total_games,
  ps.total_wins,
  ps.total_losses,
  CASE
    WHEN ps.total_games > 0
    THEN ROUND((ps.total_wins::NUMERIC / ps.total_games::NUMERIC) * 100, 2)
    ELSE 0
  END as win_percentage,
  ps.current_win_streak,
  ps.longest_win_streak,
  RANK() OVER (ORDER BY ps.elo_rating DESC) as rank
FROM users u
JOIN player_stats ps ON u.id = ps.user_id
WHERE u.is_active = TRUE AND ps.total_games >= 5 -- Minimum 5 games to qualify
ORDER BY ps.elo_rating DESC;

-- Weekly leaderboard (games from last 7 days)
CREATE VIEW leaderboard_weekly AS
SELECT
  u.id,
  u.username,
  u.display_name,
  u.avatar_url,
  COUNT(DISTINCT g.id) as games_played,
  COUNT(DISTINCT CASE WHEN g.winner_id = u.id THEN g.id END) as wins,
  RANK() OVER (ORDER BY COUNT(DISTINCT CASE WHEN g.winner_id = u.id THEN g.id END) DESC) as rank
FROM users u
JOIN games g ON (u.id = g.red_player_id OR u.id = g.black_player_id)
WHERE g.started_at >= NOW() - INTERVAL '7 days'
  AND g.status = 'completed'
  AND u.is_active = TRUE
GROUP BY u.id, u.username, u.display_name, u.avatar_url
HAVING COUNT(DISTINCT g.id) >= 3 -- Minimum 3 games in the week
ORDER BY wins DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update player stats after a game
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
DECLARE
  red_player_stats player_stats%ROWTYPE;
  black_player_stats player_stats%ROWTYPE;
BEGIN
  -- Only process completed games
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Update red player stats
  IF NEW.red_player_id IS NOT NULL THEN
    UPDATE player_stats
    SET
      total_games = total_games + 1,
      total_wins = total_wins + CASE WHEN NEW.winner_id = NEW.red_player_id THEN 1 ELSE 0 END,
      total_losses = total_losses + CASE WHEN NEW.winner_id = NEW.black_player_id THEN 1 ELSE 0 END,
      wins_as_red = wins_as_red + CASE WHEN NEW.winner_id = NEW.red_player_id THEN 1 ELSE 0 END,
      losses_as_red = losses_as_red + CASE WHEN NEW.winner_id = NEW.black_player_id THEN 1 ELSE 0 END,
      current_win_streak = CASE
        WHEN NEW.winner_id = NEW.red_player_id THEN current_win_streak + 1
        ELSE 0
      END,
      longest_win_streak = GREATEST(
        longest_win_streak,
        CASE WHEN NEW.winner_id = NEW.red_player_id THEN current_win_streak + 1 ELSE current_win_streak END
      ),
      last_game_at = NEW.completed_at,
      updated_at = NOW()
    WHERE user_id = NEW.red_player_id;
  END IF;

  -- Update black player stats
  IF NEW.black_player_id IS NOT NULL THEN
    UPDATE player_stats
    SET
      total_games = total_games + 1,
      total_wins = total_wins + CASE WHEN NEW.winner_id = NEW.black_player_id THEN 1 ELSE 0 END,
      total_losses = total_losses + CASE WHEN NEW.winner_id = NEW.red_player_id THEN 1 ELSE 0 END,
      wins_as_black = wins_as_black + CASE WHEN NEW.winner_id = NEW.black_player_id THEN 1 ELSE 0 END,
      losses_as_black = losses_as_black + CASE WHEN NEW.winner_id = NEW.red_player_id THEN 1 ELSE 0 END,
      current_win_streak = CASE
        WHEN NEW.winner_id = NEW.black_player_id THEN current_win_streak + 1
        ELSE 0
      END,
      longest_win_streak = GREATEST(
        longest_win_streak,
        CASE WHEN NEW.winner_id = NEW.black_player_id THEN current_win_streak + 1 ELSE current_win_streak END
      ),
      last_game_at = NEW.completed_at,
      updated_at = NOW()
    WHERE user_id = NEW.black_player_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats automatically
CREATE TRIGGER trigger_update_player_stats
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_player_stats();

-- Function to initialize player stats for new users
CREATE OR REPLACE FUNCTION initialize_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO player_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create stats record for new users
CREATE TRIGGER trigger_initialize_player_stats
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION initialize_player_stats();

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Create test users
INSERT INTO users (username, email, password_hash, display_name) VALUES
  ('player1', 'player1@example.com', '$2a$10$dummy', 'Player One'),
  ('player2', 'player2@example.com', '$2a$10$dummy', 'Player Two'),
  ('player3', 'player3@example.com', '$2a$10$dummy', 'Player Three')
ON CONFLICT DO NOTHING;
