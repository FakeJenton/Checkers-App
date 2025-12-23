import { GameState, Move, Player } from './types';
import { cloneGameState, getOpponent, createInitialGameState } from './gameState';
import { generateLegalMoves } from './moveGeneration';

/**
 * Apply a move to the game state and return a new state.
 * This is a pure function - it does not mutate the input state.
 *
 * Handles:
 * - Moving the piece
 * - Capturing opponent pieces
 * - King promotion
 * - Switching turns
 * - Updating move history
 */
export function applyMove(state: GameState, move: Move): GameState {
  const newState = cloneGameState(state);
  const { board } = newState;

  // Get the piece being moved
  const piece = board[move.from.row][move.from.col];
  if (!piece) {
    throw new Error('No piece at source position');
  }

  // Move the piece
  board[move.to.row][move.to.col] = piece;
  board[move.from.row][move.from.col] = null;

  // Remove captured pieces
  for (const capturedPos of move.captures) {
    const capturedPiece = board[capturedPos.row][capturedPos.col];
    if (capturedPiece) {
      newState.capturedPieces[capturedPiece.player]++;
      board[capturedPos.row][capturedPos.col] = null;
    }
  }

  // Handle king promotion
  // Promotion happens when a normal piece reaches the far row
  if (move.isPromotion && piece.type === 'normal') {
    board[move.to.row][move.to.col] = { ...piece, type: 'king' };
  }

  // Update move history
  newState.moveHistory.push(move);

  // Switch turns
  newState.currentPlayer = getOpponent(state.currentPlayer);

  // Check for winner
  newState.winner = checkWinner(newState);

  return newState;
}

/**
 * Check if the game has a winner.
 * A player wins if the opponent has no legal moves (either no pieces or all pieces are blocked).
 */
export function checkWinner(state: GameState): Player | null {
  const { board, currentPlayer, mandatoryCaptures } = state;

  // Check if current player has any legal moves
  const legalMoves = generateLegalMoves(board, currentPlayer, mandatoryCaptures);

  if (legalMoves.length === 0) {
    // Current player has no moves, so they lose
    return getOpponent(currentPlayer);
  }

  return null;
}

/**
 * Count pieces for each player on the board.
 * Useful for game statistics and simple AI heuristics.
 */
export function countPieces(state: GameState): { red: number; black: number; redKings: number; blackKings: number } {
  const counts = { red: 0, black: 0, redKings: 0, blackKings: 0 };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (!piece) continue;

      if (piece.player === 'red') {
        counts.red++;
        if (piece.type === 'king') counts.redKings++;
      } else {
        counts.black++;
        if (piece.type === 'king') counts.blackKings++;
      }
    }
  }

  return counts;
}

/**
 * Undo the last move and return to the previous state.
 * Returns null if there are no moves to undo.
 */
export function undoMove(state: GameState): GameState | null {
  if (state.moveHistory.length === 0) return null;

  // To properly undo, we need to rebuild the state from scratch
  // This is expensive but correct and safe
  let rebuiltState = createInitialGameState(state.mandatoryCaptures);

  // Replay all moves except the last one
  const movesToReplay = state.moveHistory.slice(0, -1);
  for (const move of movesToReplay) {
    rebuiltState = applyMove(rebuiltState, move);
  }

  return rebuiltState;
}

/**
 * Check if the game is over (there is a winner)
 */
export function isGameOver(state: GameState): boolean {
  return state.winner !== null;
}

/**
 * Get a simple text description of a move for logging/debugging
 */
export function describMove(move: Move): string {
  const fromStr = `(${move.from.row},${move.from.col})`;
  const toStr = `(${move.to.row},${move.to.col})`;

  if (move.captures.length > 0) {
    return `Capture from ${fromStr} to ${toStr} (${move.captures.length} pieces)`;
  }

  return `Move from ${fromStr} to ${toStr}`;
}
