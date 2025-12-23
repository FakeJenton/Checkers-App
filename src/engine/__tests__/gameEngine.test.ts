import { describe, it, expect } from 'vitest';
import { Board, Move } from '../types';
import { createInitialGameState } from '../gameState';
import { applyMove, checkWinner, countPieces, undoMove, isGameOver } from '../gameEngine';

describe('Game Engine', () => {
  describe('applyMove', () => {
    it('should move a piece to the destination', () => {
      const state = createInitialGameState();
      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };

      const newState = applyMove(state, move);

      expect(newState.board[4][1]).toEqual({ player: 'red', type: 'normal' });
      expect(newState.board[5][0]).toBeNull();
    });

    it('should remove captured pieces', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };
      board[4][3] = { player: 'black', type: 'normal' };

      const state = {
        ...createInitialGameState(),
        board,
      };

      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 3, col: 4 },
        captures: [{ row: 4, col: 3 }],
        isPromotion: false,
      };

      const newState = applyMove(state, move);

      expect(newState.board[4][3]).toBeNull();
      expect(newState.capturedPieces.black).toBe(1);
    });

    it('should promote pieces when reaching the far row', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[1][2] = { player: 'red', type: 'normal' };

      const state = {
        ...createInitialGameState(),
        board,
      };

      const move: Move = {
        from: { row: 1, col: 2 },
        to: { row: 0, col: 1 },
        captures: [],
        isPromotion: true,
      };

      const newState = applyMove(state, move);

      expect(newState.board[0][1]).toEqual({ player: 'red', type: 'king' });
    });

    it('should switch the current player', () => {
      const state = createInitialGameState();
      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };

      const newState = applyMove(state, move);

      expect(newState.currentPlayer).toBe('black');
    });

    it('should update move history', () => {
      const state = createInitialGameState();
      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };

      const newState = applyMove(state, move);

      expect(newState.moveHistory).toHaveLength(1);
      expect(newState.moveHistory[0]).toEqual(move);
    });
  });

  describe('checkWinner', () => {
    it('should return null when both players have moves', () => {
      const state = createInitialGameState();
      expect(checkWinner(state)).toBeNull();
    });

    it('should return the winner when opponent has no legal moves', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      // Black piece trapped in corner
      board[0][7] = { player: 'black', type: 'normal' };
      // Red kings blocking all escape routes
      board[1][6] = { player: 'red', type: 'king' };
      board[2][5] = { player: 'red', type: 'king' };

      const state = {
        ...createInitialGameState(),
        board,
        currentPlayer: 'black' as const,
      };

      expect(checkWinner(state)).toBe('red');
    });

    it('should return the winner when opponent has no pieces', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][1] = { player: 'red', type: 'king' };

      const state = {
        ...createInitialGameState(),
        board,
        currentPlayer: 'black' as const,
      };

      expect(checkWinner(state)).toBe('red');
    });
  });

  describe('countPieces', () => {
    it('should count all pieces correctly', () => {
      const state = createInitialGameState();
      const counts = countPieces(state);

      expect(counts.red).toBe(12);
      expect(counts.black).toBe(12);
      expect(counts.redKings).toBe(0);
      expect(counts.blackKings).toBe(0);
    });

    it('should count kings separately', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[0][1] = { player: 'red', type: 'king' };
      board[0][3] = { player: 'red', type: 'normal' };
      board[7][6] = { player: 'black', type: 'king' };

      const state = {
        ...createInitialGameState(),
        board,
      };

      const counts = countPieces(state);

      expect(counts.red).toBe(2);
      expect(counts.redKings).toBe(1);
      expect(counts.black).toBe(1);
      expect(counts.blackKings).toBe(1);
    });
  });

  describe('undoMove', () => {
    it('should return null when there are no moves to undo', () => {
      const state = createInitialGameState();
      expect(undoMove(state)).toBeNull();
    });

    it('should restore the previous state', () => {
      let state = createInitialGameState();

      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };

      state = applyMove(state, move);
      const undoneState = undoMove(state);

      expect(undoneState).not.toBeNull();
      expect(undoneState?.board[5][0]).toEqual({ player: 'red', type: 'normal' });
      expect(undoneState?.board[4][1]).toBeNull();
      expect(undoneState?.currentPlayer).toBe('red');
    });
  });

  describe('isGameOver', () => {
    it('should return false when there is no winner', () => {
      const state = createInitialGameState();
      expect(isGameOver(state)).toBe(false);
    });

    it('should return true when there is a winner', () => {
      const state = {
        ...createInitialGameState(),
        winner: 'red' as const,
      };
      expect(isGameOver(state)).toBe(true);
    });
  });
});
