/**
 * Core type definitions for the King Me checkers game engine.
 *
 * Board coordinates:
 * - Row 0 is the top of the board (Black's starting side)
 * - Row 7 is the bottom (Red's starting side)
 * - Only dark squares are playable (where row + col is odd)
 */

export type Player = 'red' | 'black';

export type PieceType = 'normal' | 'king';

export interface Piece {
  player: Player;
  type: PieceType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isPromotion: boolean;
}

export type Board = (Piece | null)[][];

export interface GameState {
  board: Board;
  currentPlayer: Player;
  moveHistory: Move[];
  capturedPieces: { red: number; black: number };
  winner: Player | null;
  mandatoryCaptures: boolean;
}

export interface GameSettings {
  mandatoryCaptures: boolean;
  showHints: boolean;
  soundEnabled: boolean;
  theme: 'charcoal' | 'high-contrast';
}

export type Difficulty = 'casual' | 'crown-match';
