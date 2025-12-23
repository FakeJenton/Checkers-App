// API client for backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
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
  first_game_at: string | null;
  last_game_at: string | null;
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

export interface GameHistory {
  id: string;
  room_code: string;
  red_player_username: string | null;
  red_player_display_name: string | null;
  black_player_username: string | null;
  black_player_display_name: string | null;
  winner_username: string | null;
  total_moves: number;
  duration_seconds: number | null;
  started_at: string;
  completed_at: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(username: string, email: string, password: string, displayName?: string) {
    const response = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, display_name: displayName }),
    });
    this.setToken(response.token);
    return response;
  }

  async login(username: string, password: string) {
    const response = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async getProfile() {
    return this.request<{ user: User }>('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Stats endpoints
  async getMyStats() {
    return this.request<{ stats: PlayerStats }>('/api/stats/me');
  }

  async getUserStats(userId: string) {
    return this.request<{ stats: PlayerStats & { username: string; display_name: string; avatar_url: string | null } }>(`/api/stats/${userId}`);
  }

  async getStatsHistory(days: number = 30) {
    return this.request<{ history: Array<{ elo_rating: number; total_games: number; total_wins: number; win_streak: number; recorded_at: string }> }>(`/api/stats/history/me?days=${days}`);
  }

  // Leaderboard endpoints
  async getAllTimeLeaderboard(limit: number = 100, offset: number = 0) {
    return this.request<{ leaderboard: LeaderboardEntry[]; userRank: number | null; limit: number; offset: number }>(`/api/leaderboard/alltime?limit=${limit}&offset=${offset}`);
  }

  async getWeeklyLeaderboard(limit: number = 100, offset: number = 0) {
    return this.request<{ leaderboard: LeaderboardEntry[]; userRank: number | null; limit: number; offset: number }>(`/api/leaderboard/weekly?limit=${limit}&offset=${offset}`);
  }

  // Game endpoints
  async createGame(roomCode: string, gameMode: 'online' | 'ai' | 'local', redPlayerId?: string, blackPlayerId?: string) {
    return this.request<{ game: { id: string } }>('/api/games', {
      method: 'POST',
      body: JSON.stringify({ room_code: roomCode, game_mode: gameMode, red_player_id: redPlayerId, black_player_id: blackPlayerId }),
    });
  }

  async completeGame(gameId: string, winnerId: string | null, totalMoves: number, durationSeconds: number) {
    return this.request(`/api/games/${gameId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ winner_id: winnerId, total_moves: totalMoves, duration_seconds: durationSeconds }),
    });
  }

  async getMyGameHistory(limit: number = 20, offset: number = 0) {
    return this.request<{ games: GameHistory[]; limit: number; offset: number }>(`/api/games/my-history?limit=${limit}&offset=${offset}`);
  }

  async recordMove(gameId: string, moveNumber: number, playerColor: 'red' | 'black', fromRow: number, fromCol: number, toRow: number, toCol: number, capturedPieces: Array<{ row: number; col: number }>, isPromotion: boolean) {
    return this.request(`/api/games/${gameId}/moves`, {
      method: 'POST',
      body: JSON.stringify({
        move_number: moveNumber,
        player_color: playerColor,
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol,
        captured_pieces: capturedPieces,
        is_promotion: isPromotion,
      }),
    });
  }
}

export const api = new ApiClient();
