import { useAuth } from '../contexts/AuthContext';
import styles from './Home.module.css';

interface HomeProps {
  onPlayLocal: () => void;
  onPlayAI: () => void;
  onPlayOnline: () => void;
  onShowRules: () => void;
  onShowSettings: () => void;
  onShowStats: () => void;
  onShowLeaderboard: () => void;
  onLogin: () => void;
}

export function Home({ onPlayLocal, onPlayAI, onPlayOnline, onShowRules, onShowSettings, onShowStats, onShowLeaderboard, onLogin }: HomeProps) {
  const { user, logout } = useAuth();

  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className={styles.title}>King Me</h1>
        <p className={styles.subtitle}>Earn the crown.</p>
      </div>

      {/* User Info */}
      {user ? (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user.display_name[0].toUpperCase()}
          </div>
          <div className={styles.userName}>{user.display_name}</div>
          <button className={styles.logoutButton} onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className={styles.loginPrompt}>
          <p>Track your stats and climb the leaderboard!</p>
          <button className={styles.loginButton} onClick={onLogin}>Login / Register</button>
        </div>
      )}

      <div className={styles.menu}>
        <button className={`${styles.menuButton} ${styles.primary}`} onClick={onPlayLocal}>
          Play Local
        </button>
        <button className={styles.menuButton} onClick={onPlayAI}>
          Play vs AI
        </button>
        <button className={`${styles.menuButton} ${styles.online}`} onClick={onPlayOnline}>
          Play Online
        </button>

        {/* Stats and Leaderboard */}
        <div className={styles.statsRow}>
          <button className={styles.statsButton} onClick={onShowStats}>
            📊 My Stats
          </button>
          <button className={styles.statsButton} onClick={onShowLeaderboard}>
            🏆 Leaderboard
          </button>
        </div>

        <button className={styles.menuButton} onClick={onShowRules}>
          Rules / Tutorial
        </button>
        <button className={styles.menuButton} onClick={onShowSettings}>
          Settings
        </button>
      </div>

      <div className={styles.footer}>
        Kings are made, not given.
      </div>
    </div>
  );
}
