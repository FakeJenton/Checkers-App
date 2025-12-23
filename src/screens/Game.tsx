import { useState, useEffect } from 'react';
import { GameState, Move, Difficulty, GameSettings } from '../engine/types';
import { createInitialGameState } from '../engine/gameState';
import { applyMove, undoMove } from '../engine/gameEngine';
import { generateLegalMoves } from '../engine/moveGeneration';
import { getBestMove } from '../engine/ai';
import { Board } from '../components/Board';
import styles from './Game.module.css';

interface GameProps {
  mode: 'local' | 'ai';
  difficulty?: Difficulty;
  settings: GameSettings;
  onQuit: () => void;
  onWin: (winner: 'red' | 'black') => void;
}

export function Game({ mode, difficulty = 'casual', settings, onQuit, onWin }: GameProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(settings.mandatoryCaptures)
  );
  const [isAIThinking, setIsAIThinking] = useState(false);

  useEffect(() => {
    if (gameState.winner) {
      onWin(gameState.winner);
    }
  }, [gameState.winner, onWin]);

  useEffect(() => {
    if (mode === 'ai' && gameState.currentPlayer === 'black' && !gameState.winner) {
      setIsAIThinking(true);

      const timer = setTimeout(() => {
        const aiMove = getBestMove(gameState, difficulty);
        if (aiMove) {
          handleMove(aiMove);
        }
        setIsAIThinking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, mode, difficulty]);

  const handleMove = (move: Move) => {
    const newState = applyMove(gameState, move);
    setGameState(newState);

    if (settings.soundEnabled) {
      playMoveSound(move);
    }
  };

  const handleUndo = () => {
    const previousState = undoMove(gameState);
    if (previousState) {
      if (mode === 'ai' && previousState.currentPlayer === 'black') {
        const beforeAI = undoMove(previousState);
        setGameState(beforeAI || previousState);
      } else {
        setGameState(previousState);
      }
    }
  };

  const handleRestart = () => {
    setGameState(createInitialGameState(settings.mandatoryCaptures));
  };

  const playMoveSound = (move: Move) => {
    // Placeholder for sound effects
    console.log('Sound:', move.captures.length > 0 ? 'capture' : 'move');
  };

  const legalMoves = generateLegalMoves(gameState.board, gameState.currentPlayer, settings.mandatoryCaptures);
  const hasCaptureMove = legalMoves.some(move => move.captures.length > 0);

  return (
    <div className={styles.game}>
      <div className={styles.status}>
        <div className={`${styles.currentPlayer} ${styles[gameState.currentPlayer]}`}>
          {gameState.currentPlayer === 'red' ? "Red's Turn" : "Black's Turn"}
        </div>
        {hasCaptureMove && settings.mandatoryCaptures && (
          <div className={`${styles.info} ${styles.capture}`}>
            Capture required!
          </div>
        )}
        {mode === 'ai' && gameState.currentPlayer === 'black' && (
          <div className={styles.info}>
            AI thinking...
          </div>
        )}
      </div>

      <div className={styles.boardContainer}>
        <Board
          gameState={gameState}
          onMove={handleMove}
          showHints={settings.showHints}
          disabled={isAIThinking || gameState.winner !== null}
        />
        {isAIThinking && (
          <div className={styles.thinking}>
            AI thinking...
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {mode === 'local' && (
          <button
            className={styles.controlButton}
            onClick={handleUndo}
            disabled={gameState.moveHistory.length === 0}
          >
            Undo
          </button>
        )}
        {mode === 'ai' && (
          <button
            className={styles.controlButton}
            onClick={handleUndo}
            disabled={gameState.moveHistory.length === 0 || isAIThinking}
          >
            Undo
          </button>
        )}
        <button className={styles.controlButton} onClick={handleRestart}>
          Restart
        </button>
        <button className={`${styles.controlButton} ${styles.danger}`} onClick={onQuit}>
          Quit
        </button>
      </div>
    </div>
  );
}
