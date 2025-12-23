import styles from './Home.module.css';

interface HomeProps {
  onPlayLocal: () => void;
  onPlayAI: () => void;
  onPlayOnline: () => void;
  onShowRules: () => void;
  onShowSettings: () => void;
}

export function Home({ onPlayLocal, onPlayAI, onPlayOnline, onShowRules, onShowSettings }: HomeProps) {
  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className={styles.title}>King Me</h1>
        <p className={styles.subtitle}>Earn the crown.</p>
      </div>

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
