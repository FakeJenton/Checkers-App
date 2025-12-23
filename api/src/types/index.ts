export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  is_active: boolean;
}

export interface PlayerStats {
  user_id: string;
  total_games: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  wins_as_red: number;
  wins_as_black: number;
  losses_as_red: number;
  losses_as_black: number;
  current_win_streak: number;
  longest_win_streak: number;
  elo_rating: number;
  peak_elo_rating: number;
  total_pieces_captured: number;
  total_kings_crowned: number;
  total_moves_made: number;
  average_game_duration_seconds: number | null;
  first_game_at: Date | null;
  last_game_at: Date | null;
}

export interface Game {
  id: string;
  room_code: string;
  red_player_id: string | null;
  black_player_id: string | null;
  winner_id: string | null;
  game_mode: 'online' | 'ai' | 'local';
  status: 'active' | 'completed' | 'abandoned';
  total_moves: number;
  duration_seconds: number | null;
  started_at: Date;
  completed_at: Date | null;
}

export interface GameMove {
  id: string;
  game_id: string;
  move_number: number;
  player_color: 'red' | 'black';
  from_row: number;
  from_col: number;
  to_row: number;
  to_col: number;
  captured_pieces: Array<{ row: number; col: number }>;
  is_promotion: boolean;
  timestamp: Date;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo_rating: number;
  total_games: number;
  total_wins: number;
  total_losses: number;
  win_percentage: number;
  current_win_streak: number;
  rank: number;
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
}
