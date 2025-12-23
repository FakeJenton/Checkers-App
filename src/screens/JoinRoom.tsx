import { useState } from 'react';
import { Button } from '../components/Button';
import styles from './JoinRoom.module.css';

interface JoinRoomProps {
  onJoinRoom: (roomCode: string) => void;
  onBack: () => void;
}

export function JoinRoom({ onJoinRoom, onBack }: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setRoomCode(value);
    setError('');
  };

  const handleJoin = () => {
    const cleanCode = roomCode.replace(/\s/g, '');

    if (cleanCode.length < 6) {
      setError('Please enter a valid room code');
      return;
    }

    onJoinRoom(cleanCode);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanedText = text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setRoomCode(cleanedText);
      setError('');
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const canJoin = roomCode.replace(/[-\s]/g, '').length >= 6;

  return (
    <div className={styles.joinRoom}>
      <div className={styles.container}>
        <h1 className={styles.title}>Join Game Room</h1>

        <div className={styles.content}>
          <div className={styles.section}>
            <p className={styles.instructions}>
              Enter the room code shared by your opponent
            </p>

            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.input}
                placeholder="ABC-123"
                value={roomCode}
                onChange={handleInputChange}
                maxLength={7}
                autoFocus
              />
              <button
                className={styles.pasteButton}
                onClick={handlePaste}
                title="Paste from clipboard"
              >
                📋
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.actions}>
            <Button onClick={handleJoin} disabled={!canJoin}>
              Join Room
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
