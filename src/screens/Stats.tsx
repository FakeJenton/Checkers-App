import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, PlayerStats, GameHistory } from '../services/api';
import styles from './Stats.module.css';

interface StatsProps {
  onBack: () => void;
}

export function Stats({ onBack }: StatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [statsRes, historyRes] = await Promise.all([
          api.getMyStats(),
          api.getMyGameHistory(10, 0),
        ]);
        setStats(statsRes.stats);
        setGameHistory(historyRes.games);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (!user) {
    return (
      <div className={styles.stats}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>← Back</button>
          <h1>Player Stats</h1>
        </div>
        <div className={styles.notLoggedIn}>
          <p>Please log in to view your statistics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.stats}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>← Back</button>
          <h1>Player Stats</h1>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.stats}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>← Back</button>
          <h1>Player Stats</h1>
        </div>
        <div className={styles.error}>{error || 'Failed to load stats'}</div>
      </div>
    );
  }

  const winRate = stats.total_games > 0
    ? ((stats.total_wins / stats.total_games) * 100).toFixed(1)
    : '0.0';

  return (
    <div className={styles.stats}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>← Back</button>
        <h1>Player Stats</h1>
      </div>

      <div className={styles.profile}>
        <div className={styles.avatar}>
          {user.display_name[0].toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <h2>{user.display_name}</h2>
          <p>@{user.username}</p>
        </div>
      </div>

      {/* ELO Rating */}
      <div className={styles.eloCard}>
        <div className={styles.eloRating}>{stats.elo_rating}</div>
        <div className={styles.eloLabel}>ELO Rating</div>
        <div className={styles.peakElo}>Peak: {stats.peak_elo_rating}</div>
      </div>

      {/* Main Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total_games}</div>
          <div className={styles.statLabel}>Games Played</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total_wins}</div>
          <div className={styles.statLabel}>Wins</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total_losses}</div>
          <div className={styles.statLabel}>Losses</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{winRate}%</div>
          <div className={styles.statLabel}>Win Rate</div>
        </div>
      </div>

      {/* Streaks */}
      <div className={styles.section}>
        <h3>Streaks</h3>
        <div className={styles.streaksGrid}>
          <div className={styles.streakCard}>
            <div className={styles.streakValue}>{stats.current_win_streak}</div>
            <div className={styles.streakLabel}>Current Streak</div>
          </div>
          <div className={styles.streakCard}>
            <div className={styles.streakValue}>{stats.longest_win_streak}</div>
            <div className={styles.streakLabel}>Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Performance by Color */}
      <div className={styles.section}>
        <h3>Performance by Color</h3>
        <div className={styles.colorStats}>
          <div className={styles.colorCard}>
            <div className={styles.colorHeader}>
              <div className={`${styles.colorIndicator} ${styles.red}`}></div>
              <span>Playing as Red</span>
            </div>
            <div className={styles.colorData}>
              <span>{stats.wins_as_red}W</span>
              <span>{stats.losses_as_red}L</span>
            </div>
          </div>

          <div className={styles.colorCard}>
            <div className={styles.colorHeader}>
              <div className={`${styles.colorIndicator} ${styles.black}`}></div>
              <span>Playing as Black</span>
            </div>
            <div className={styles.colorData}>
              <span>{stats.wins_as_black}W</span>
              <span>{stats.losses_as_black}L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Metrics */}
      <div className={styles.section}>
        <h3>Game Metrics</h3>
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Pieces Captured</span>
            <span className={styles.metricValue}>{stats.total_pieces_captured}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Kings Crowned</span>
            <span className={styles.metricValue}>{stats.total_kings_crowned}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Total Moves</span>
            <span className={styles.metricValue}>{stats.total_moves_made}</span>
          </div>
          {stats.average_game_duration_seconds && (
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Avg. Game Duration</span>
              <span className={styles.metricValue}>
                {Math.floor(stats.average_game_duration_seconds / 60)}m {stats.average_game_duration_seconds % 60}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Games */}
      {gameHistory.length > 0 && (
        <div className={styles.section}>
          <h3>Recent Games</h3>
          <div className={styles.gamesList}>
            {gameHistory.map((game) => {
              const isRed = game.red_player_username === user.username;
              const isWinner = game.winner_username === user.username;
              const opponent = isRed
                ? game.black_player_display_name || game.black_player_username
                : game.red_player_display_name || game.red_player_username;

              return (
                <div key={game.id} className={styles.gameCard}>
                  <div className={styles.gameResult}>
                    <span className={`${styles.resultBadge} ${isWinner ? styles.win : styles.loss}`}>
                      {isWinner ? 'WIN' : 'LOSS'}
                    </span>
                  </div>
                  <div className={styles.gameDetails}>
                    <div className={styles.opponent}>vs {opponent || 'Unknown'}</div>
                    <div className={styles.gameMeta}>
                      {game.total_moves} moves · {Math.floor((game.duration_seconds || 0) / 60)}m
                    </div>
                  </div>
                  <div className={styles.gameDate}>
                    {new Date(game.completed_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
