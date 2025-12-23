import { useState, useEffect } from 'react';
import { GameState, Move, Position } from '../engine/types';
import { getMovesForPiece } from '../engine/moveGeneration';
import { positionsEqual } from '../engine/gameState';
import styles from './Board.module.css';

interface BoardProps {
  gameState: GameState;
  onMove: (move: Move) => void;
  showHints: boolean;
  disabled?: boolean;
  lastMove?: Move;
  perspective?: 'red' | 'black'; // Which player's perspective to render from
}

const CrownIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 24L6 12L11 16L16 8L21 16L26 12L28 24H4Z" fill="#D4AF37" stroke="#B8941F" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="6" cy="12" r="2" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
    <circle cx="16" cy="8" r="2" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
    <circle cx="26" cy="12" r="2" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
    <rect x="4" y="24" width="24" height="3" fill="#D4AF37" stroke="#B8941F" strokeWidth="1"/>
  </svg>
);

export function Board({ gameState, onMove, showHints, disabled = false, lastMove, perspective = 'red' }: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [justPromoted, setJustPromoted] = useState<Position | null>(null);

  // Reset selection when game state changes
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [gameState.currentPlayer, disabled]);

  // Track promotions for animation
  useEffect(() => {
    if (gameState.moveHistory.length > 0) {
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
      if (lastMove.isPromotion) {
        setJustPromoted(lastMove.to);
        setTimeout(() => setJustPromoted(null), 600);
      }
    }
  }, [gameState.moveHistory]);

  const handleSquareClick = (row: number, col: number) => {
    console.log('🎲 Square clicked:', row, col);
    console.log('  disabled:', disabled);

    if (disabled) {
      console.log('❌ Board is disabled, ignoring click');
      return;
    }

    const position = { row, col };
    const piece = gameState.board[row][col];

    // If clicking on a valid move destination
    const targetMove = validMoves.find(move => positionsEqual(move.to, position));
    if (targetMove && selectedSquare) {
      console.log('✅ Valid move found, calling onMove');
      console.log('  targetMove:', targetMove);
      onMove(targetMove);
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If clicking on own piece
    if (piece && piece.player === gameState.currentPlayer) {
      console.log('📍 Selected piece at', position);
      setSelectedSquare(position);
      const moves = getMovesForPiece(
        gameState.board,
        position,
        gameState.currentPlayer,
        gameState.mandatoryCaptures
      );
      console.log('  valid moves:', moves.length);
      console.log('  moves:', moves);
      setValidMoves(moves);
    } else {
      console.log('  Deselecting (clicked empty or opponent piece)');
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const isSquareValid = (row: number, col: number): boolean => {
    return validMoves.some(move => positionsEqual(move.to, { row, col }));
  };

  const isSquareSelected = (row: number, col: number): boolean => {
    return selectedSquare !== null && positionsEqual(selectedSquare, { row, col });
  };

  const renderSquare = (row: number, col: number) => {
    const piece = gameState.board[row][col];
    const isLight = (row + col) % 2 === 0;
    const isValid = showHints && isSquareValid(row, col);
    const isSelected = isSquareSelected(row, col);
    const isJustPromoted = justPromoted && positionsEqual(justPromoted, { row, col });
    const isLastMoveFrom = lastMove && positionsEqual(lastMove.from, { row, col });
    const isLastMoveTo = lastMove && positionsEqual(lastMove.to, { row, col });

    const squareClasses = [
      styles.square,
      isLight ? styles.light : styles.dark,
      isValid && styles.valid,
      isSelected && styles.selected,
      isLastMoveFrom && styles.lastMoveFrom,
      isLastMoveTo && styles.lastMoveTo,
    ].filter(Boolean).join(' ');

    const pieceClasses = [
      styles.piece,
      piece?.player === 'red' ? styles.red : styles.black,
      isSelected && styles.selected,
    ].filter(Boolean).join(' ');

    return (
      <div
        key={`${row}-${col}`}
        className={squareClasses}
        onClick={() => handleSquareClick(row, col)}
      >
        {piece && (
          <div className={pieceClasses}>
            {piece.type === 'king' && (
              <div className={isJustPromoted ? styles.crown : ''}>
                <CrownIcon />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const squares = [];

  // Flip board if viewing from black's perspective (black pieces at bottom)
  const shouldFlip = perspective === 'black';

  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      // Convert display coordinates to board coordinates
      const row = shouldFlip ? 7 - displayRow : displayRow;
      const col = shouldFlip ? 7 - displayCol : displayCol;
      squares.push(renderSquare(row, col));
    }
  }

  return <div className={styles.board}>{squares}</div>;
}
