import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, LeaderboardEntry } from '../services/api';
import styles from './Leaderboard.module.css';

interface LeaderboardProps {
  onBack: () => void;
}

type LeaderboardType = 'alltime' | 'weekly';

export function Leaderboard({ onBack }: LeaderboardProps) {
  const { user } = useAuth();
  const [type, setType] = useState<LeaderboardType>('alltime');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      setError('');

      try {
        const data = type === 'alltime'
          ? await api.getAllTimeLeaderboard(100, 0)
          : await api.getWeeklyLeaderboard(100, 0);

        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [type]);

  return (
    <div className={styles.leaderboard}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>← Back</button>
        <h1>Leaderboard</h1>
      </div>

      {/* Type Selector */}
      <div className={styles.typeSelector}>
        <button
          className={`${styles.typeButton} ${type === 'alltime' ? styles.active : ''}`}
          onClick={() => setType('alltime')}
        >
          All-Time
        </button>
        <button
          className={`${styles.typeButton} ${type === 'weekly' ? styles.active : ''}`}
          onClick={() => setType('weekly')}
        >
          This Week
        </button>
      </div>

      {/* User Rank Badge */}
      {user && userRank && (
        <div className={styles.userRankBadge}>
          Your Rank: #{userRank}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>Loading leaderboard...</div>
      )}

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className={styles.empty}>
          <p>No players on the leaderboard yet.</p>
          <p>Be the first to play and claim the #1 spot!</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className={styles.list}>
          {/* Top 3 Podium */}
          {leaderboard.slice(0, 3).length === 3 && (
            <div className={styles.podium}>
              {/* 2nd Place */}
              <div className={`${styles.podiumPlace} ${styles.second}`}>
                <div className={styles.medal}>🥈</div>
                <div className={styles.podiumAvatar}>
                  {leaderboard[1].display_name?.[0] || leaderboard[1].username[0].toUpperCase()}
                </div>
                <div className={styles.podiumName}>{leaderboard[1].display_name || leaderboard[1].username}</div>
                <div className={styles.podiumElo}>{leaderboard[1].elo_rating}</div>
              </div>

              {/* 1st Place */}
              <div className={`${styles.podiumPlace} ${styles.first}`}>
                <div className={styles.crown}>👑</div>
                <div className={styles.medal}>🥇</div>
                <div className={styles.podiumAvatar}>
                  {leaderboard[0].display_name?.[0] || leaderboard[0].username[0].toUpperCase()}
                </div>
                <div className={styles.podiumName}>{leaderboard[0].display_name || leaderboard[0].username}</div>
                <div className={styles.podiumElo}>{leaderboard[0].elo_rating}</div>
              </div>

              {/* 3rd Place */}
              <div className={`${styles.podiumPlace} ${styles.third}`}>
                <div className={styles.medal}>🥉</div>
                <div className={styles.podiumAvatar}>
                  {leaderboard[2].display_name?.[0] || leaderboard[2].username[0].toUpperCase()}
                </div>
                <div className={styles.podiumName}>{leaderboard[2].display_name || leaderboard[2].username}</div>
                <div className={styles.podiumElo}>{leaderboard[2].elo_rating}</div>
              </div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          <div className={styles.entries}>
            {leaderboard.slice(3).map((entry) => (
              <div
                key={entry.id}
                className={`${styles.entry} ${entry.username === user?.username ? styles.currentUser : ''}`}
              >
                <div className={styles.rank}>#{entry.rank}</div>
                <div className={styles.playerInfo}>
                  <div className={styles.avatar}>
                    {entry.display_name?.[0] || entry.username[0].toUpperCase()}
                  </div>
                  <div className={styles.details}>
                    <div className={styles.name}>{entry.display_name || entry.username}</div>
                    <div className={styles.stats}>
                      {entry.total_games} games · {entry.win_percentage}% win rate
                    </div>
                  </div>
                </div>
                <div className={styles.elo}>{entry.elo_rating}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
