import { useState } from 'react';
import { Player } from '../engine/types';
import { OnlineGameService } from '../services/onlineGame';
import { Button } from '../components/Button';
import styles from './CreateRoom.module.css';

interface CreateRoomProps {
  onRoomCreated: (roomCode: string, color: Player) => void;
  onBack: () => void;
}

export function CreateRoom({ onRoomCreated, onBack }: CreateRoomProps) {
  const [selectedColor, setSelectedColor] = useState<Player>('red');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    setIsCreating(true);
    const roomCode = OnlineGameService.generateRoomCode();
    onRoomCreated(roomCode, selectedColor);
  };

  return (
    <div className={styles.createRoom}>
      <div className={styles.container}>
        <h1 className={styles.title}>Create Game Room</h1>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Choose Your Color</h2>
            <div className={styles.colorSelector}>
              <button
                className={`${styles.colorButton} ${styles.red} ${selectedColor === 'red' ? styles.selected : ''}`}
                onClick={() => setSelectedColor('red')}
              >
                <div className={styles.colorPiece}></div>
                <span>Red</span>
                <span className={styles.colorNote}>Moves first</span>
              </button>
              <button
                className={`${styles.colorButton} ${styles.black} ${selectedColor === 'black' ? styles.selected : ''}`}
                onClick={() => setSelectedColor('black')}
              >
                <div className={styles.colorPiece}></div>
                <span>Black</span>
                <span className={styles.colorNote}>Moves second</span>
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
            <Button onClick={onBack} variant="secondary">
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
