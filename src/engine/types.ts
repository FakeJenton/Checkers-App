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

// Online multiplayer types
export type GameMode = 'local' | 'ai' | 'online';

export interface OnlinePlayerInfo {
  connected: boolean;
  id: string;
}

export interface OnlineGameInfo {
  roomCode: string;
  yourColor: Player | 'spectator';
  players: {
    red: boolean;
    black: boolean;
  };
}

// Server message types
export type ServerMessage =
  | { type: 'state'; gameState: GameState; yourColor: Player | 'spectator'; players: { red: boolean; black: boolean } }
  | { type: 'move'; move: Move; gameState: GameState }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; player: Player }
  | { type: 'error'; message: string }
  | { type: 'pong' };

// Client message types
export type ClientMessage =
  | { type: 'join'; preferredColor?: Player; playerId: string; userId?: number }
  | { type: 'move'; move: Move }
  | { type: 'restart' }
  | { type: 'ping' };
