import { Board, GameState, Player } from './types';

/**
 * Initialize a standard 8x8 checkers board.
 * Black pieces start at rows 0-2 (top)
 * Red pieces start at rows 5-7 (bottom)
 * Only dark squares (row + col is odd) contain pieces
 */
export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Place black pieces (rows 0-2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: 'black', type: 'normal' };
      }
    }
  }

  // Place red pieces (rows 5-7)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: 'red', type: 'normal' };
      }
    }
  }

  return board;
}

/**
 * Create a new game state with initial setup
 */
export function createInitialGameState(mandatoryCaptures = true): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'red',
    moveHistory: [],
    capturedPieces: { red: 0, black: 0 },
    winner: null,
    mandatoryCaptures,
  };
}

/**
 * Create a deep copy of the board
 */
export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

/**
 * Create a deep copy of game state
 */
export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    board: cloneBoard(state.board),
    moveHistory: [...state.moveHistory],
    capturedPieces: { ...state.capturedPieces },
  };
}

/**
 * Get the opponent of the given player
 */
export function getOpponent(player: Player): Player {
  return player === 'red' ? 'black' : 'red';
}

/**
 * Check if a position is within board bounds
 */
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Check if a position is on a dark square (playable)
 */
export function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: { row: number; col: number }, pos2: { row: number; col: number }): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}
