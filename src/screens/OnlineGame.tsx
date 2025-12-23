import { useState, useEffect, useCallback } from 'react';
import { GameState, Move, Player, GameSettings } from '../engine/types';
import { OnlineGameService, ConnectionStatus } from '../services/onlineGame';
import { createInitialGameState } from '../engine/gameState';
import { Board } from '../components/Board';
import styles from './OnlineGame.module.css';

interface OnlineGameProps {
  roomCode: string;
  preferredColor?: Player;
  settings: GameSettings;
  onQuit: () => void;
  onWin: (winner: Player) => void;
}

export function OnlineGame({ roomCode, preferredColor, settings, onQuit, onWin }: OnlineGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(settings.mandatoryCaptures));
  const [yourColor, setYourColor] = useState<Player | 'spectator'>('spectator');
  const [players, setPlayers] = useState({ red: false, black: false });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [onlineService] = useState(() => new OnlineGameService({
    onStateUpdate: (newGameState, color, connectedPlayers) => {
      setGameState(newGameState);
      setYourColor(color);
      setPlayers(connectedPlayers);

      if (newGameState.winner) {
        onWin(newGameState.winner);
      }
    },
    onPlayerJoined: (player) => {
      console.log(`${player} joined`);
    },
    onPlayerLeft: (player) => {
      console.log(`${player} left`);
    },
    onError: (message) => {
      console.error('Online game error:', message);
    },
    onConnectionStatusChange: (status) => {
      setConnectionStatus(status);
    },
  }));

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Join the room
    onlineService.joinRoom(roomCode, preferredColor);

    // Cleanup on unmount
    return () => {
      onlineService.disconnect();
    };
  }, [roomCode, preferredColor, onlineService]);

  const handleMove = useCallback((move: Move) => {
    if (yourColor === 'spectator') return;
    if (gameState.currentPlayer !== yourColor) return;

    onlineService.sendMove(move);
  }, [yourColor, gameState.currentPlayer, onlineService]);

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleQuit = () => {
    onlineService.disconnect();
    onQuit();
  };

  const isYourTurn = yourColor !== 'spectator' && gameState.currentPlayer === yourColor;
  const waitingForOpponent = yourColor !== 'spectator' && ((yourColor === 'red' && !players.black) || (yourColor === 'black' && !players.red));
  const lastMove = gameState.moveHistory.length > 0
    ? gameState.moveHistory[gameState.moveHistory.length - 1]
    : undefined;

  return (
    <div className={styles.onlineGame}>
      {/* Room Info Header */}
      <div className={styles.header}>
        <div className={styles.roomInfo}>
          <div className={styles.roomCode}>
            <span className={styles.label}>Room:</span>
            <span className={styles.code}>{roomCode}</span>
            <button
              className={styles.copyButton}
              onClick={handleCopyRoomCode}
              title="Copy room code"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <div className={`${styles.connectionStatus} ${styles[connectionStatus]}`}>
            <span className={styles.statusDot}></span>
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
            {connectionStatus === 'error' && 'Error'}
          </div>
        </div>

        <div className={styles.playersInfo}>
          <div className={`${styles.playerSlot} ${styles.red} ${yourColor === 'red' ? styles.you : ''}`}>
            <div className={styles.playerPiece}></div>
            <span className={styles.playerName}>
              {yourColor === 'red' ? 'You' : players.red ? 'Opponent' : 'Waiting...'}
            </span>
            {players.red && <span className={styles.playerStatus}>●</span>}
          </div>
          <div className={`${styles.playerSlot} ${styles.black} ${yourColor === 'black' ? styles.you : ''}`}>
            <div className={styles.playerPiece}></div>
            <span className={styles.playerName}>
              {yourColor === 'black' ? 'You' : players.black ? 'Opponent' : 'Waiting...'}
            </span>
            {players.black && <span className={styles.playerStatus}>●</span>}
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className={styles.status}>
        {waitingForOpponent ? (
          <div className={styles.waiting}>Waiting for opponent to join...</div>
        ) : yourColor === 'spectator' ? (
          <div className={styles.spectating}>You are spectating</div>
        ) : (
          <div className={`${styles.currentPlayer} ${styles[gameState.currentPlayer]}`}>
            {isYourTurn ? "Your Turn" : "Opponent's Turn"}
          </div>
        )}
      </div>

      {/* Board */}
      <div className={styles.boardContainer}>
        <Board
          gameState={gameState}
          onMove={handleMove}
          showHints={settings.showHints && isYourTurn}
          disabled={!isYourTurn || waitingForOpponent || gameState.winner !== null}
          lastMove={lastMove}
        />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={`${styles.controlButton} ${styles.danger}`} onClick={handleQuit}>
          Leave Game
        </button>
      </div>
    </div>
  );
}
