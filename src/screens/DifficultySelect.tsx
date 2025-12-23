import { Difficulty } from '../engine/types';
import { Button } from '../components/Button';
import styles from './DifficultySelect.module.css';

interface DifficultySelectProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onBack: () => void;
}

export function DifficultySelect({ onSelectDifficulty, onBack }: DifficultySelectProps) {
  return (
    <div className={styles.difficultySelect}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Difficulty</h1>
        <p className={styles.subtitle}>Test your skills against the AI</p>
      </div>

      <div className={styles.options}>
        <div className={styles.option} onClick={() => onSelectDifficulty('casual')}>
          <div className={styles.optionTitle}>Casual</div>
          <div className={styles.optionDescription}>
            A relaxed match. The AI makes reasonable moves but won't crush you.
          </div>
        </div>

        <div className={styles.option} onClick={() => onSelectDifficulty('crown-match')}>
          <div className={styles.optionTitle}>Crown Match</div>
          <div className={styles.optionDescription}>
            A serious challenge. The AI plays strategically and plans ahead.
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onBack} variant="ghost">
          Back
        </Button>
      </div>
    </div>
  );
}
