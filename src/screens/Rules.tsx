import { Button } from '../components/Button';
import styles from './Rules.module.css';

interface RulesProps {
  onBack: () => void;
}

export function Rules({ onBack }: RulesProps) {
  return (
    <div className={styles.rules}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Rules</h1>
          <p className={styles.subtitle}>Kings are made, not given.</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Objective</h2>
            <p className={styles.text}>
              Capture all of your opponent's pieces or block them so they cannot move.
              Promote your pieces to <span className={styles.highlight}>kings</span> by reaching the far end of the board.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Basic Movement</h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                Normal pieces move diagonally forward one square to an empty dark square
              </li>
              <li className={styles.listItem}>
                Kings (crowned pieces) can move diagonally in any direction
              </li>
              <li className={styles.listItem}>
                Red pieces start at the bottom and move upward toward row 0
              </li>
              <li className={styles.listItem}>
                Black pieces start at the top and move downward toward row 7
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Captures</h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                Jump diagonally over an opponent's piece to an empty square beyond it
              </li>
              <li className={styles.listItem}>
                The jumped piece is removed from the board
              </li>
              <li className={styles.listItem}>
                <span className={styles.highlight}>Multi-jump:</span> If you can capture again with the same piece, you must continue jumping
              </li>
              <li className={styles.listItem}>
                <span className={styles.highlight}>Mandatory captures:</span> If a capture is available, you must take it. Non-capture moves are illegal.
              </li>
              <li className={styles.listItem}>
                Both normal pieces and kings can capture backward
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>King Promotion</h2>
            <p className={styles.text}>
              When a normal piece reaches the opposite end of the board, it is immediately <span className={styles.highlight}>crowned</span> and becomes a king.
            </p>
            <p className={styles.text}>
              Promotion occurs after completing your move (including multi-jump sequences).
            </p>
            <p className={styles.text} style={{ fontStyle: 'italic', color: 'var(--king-gold)' }}>
              "Crowned."
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Winning</h2>
            <p className={styles.text}>
              You win when your opponent has no legal moves, either because:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>They have no pieces left, or</li>
              <li className={styles.listItem}>All their pieces are blocked and cannot move</li>
            </ul>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={onBack} variant="primary">
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
