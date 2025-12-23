import { describe, it, expect } from 'vitest';
import {
  createInitialBoard,
  createInitialGameState,
  isValidPosition,
  isDarkSquare,
  positionsEqual,
  getOpponent,
} from '../gameState';

describe('Game State', () => {
  describe('createInitialBoard', () => {
    it('should create an 8x8 board', () => {
      const board = createInitialBoard();
      expect(board).toHaveLength(8);
      expect(board[0]).toHaveLength(8);
    });

    it('should place black pieces in rows 0-2', () => {
      const board = createInitialBoard();
      let blackCount = 0;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row + col) % 2 === 1) {
            expect(board[row][col]).toEqual({ player: 'black', type: 'normal' });
            blackCount++;
          }
        }
      }

      expect(blackCount).toBe(12);
    });

    it('should place red pieces in rows 5-7', () => {
      const board = createInitialBoard();
      let redCount = 0;

      for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row + col) % 2 === 1) {
            expect(board[row][col]).toEqual({ player: 'red', type: 'normal' });
            redCount++;
          }
        }
      }

      expect(redCount).toBe(12);
    });

    it('should leave middle rows empty', () => {
      const board = createInitialBoard();

      for (let row = 3; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          expect(board[row][col]).toBeNull();
        }
      }
    });
  });

  describe('createInitialGameState', () => {
    it('should start with red as current player', () => {
      const state = createInitialGameState();
      expect(state.currentPlayer).toBe('red');
    });

    it('should have no winner initially', () => {
      const state = createInitialGameState();
      expect(state.winner).toBeNull();
    });

    it('should have empty move history', () => {
      const state = createInitialGameState();
      expect(state.moveHistory).toEqual([]);
    });

    it('should have mandatory captures enabled by default', () => {
      const state = createInitialGameState();
      expect(state.mandatoryCaptures).toBe(true);
    });
  });

  describe('Helper functions', () => {
    it('isValidPosition should correctly identify valid positions', () => {
      expect(isValidPosition(0, 0)).toBe(true);
      expect(isValidPosition(7, 7)).toBe(true);
      expect(isValidPosition(4, 4)).toBe(true);
      expect(isValidPosition(-1, 0)).toBe(false);
      expect(isValidPosition(0, 8)).toBe(false);
      expect(isValidPosition(8, 0)).toBe(false);
    });

    it('isDarkSquare should correctly identify dark squares', () => {
      expect(isDarkSquare(0, 1)).toBe(true);
      expect(isDarkSquare(0, 3)).toBe(true);
      expect(isDarkSquare(1, 0)).toBe(true);
      expect(isDarkSquare(0, 0)).toBe(false);
      expect(isDarkSquare(1, 1)).toBe(false);
    });

    it('positionsEqual should correctly compare positions', () => {
      expect(positionsEqual({ row: 0, col: 0 }, { row: 0, col: 0 })).toBe(true);
      expect(positionsEqual({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
      expect(positionsEqual({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
    });

    it('getOpponent should return the opposite player', () => {
      expect(getOpponent('red')).toBe('black');
      expect(getOpponent('black')).toBe('red');
    });
  });
});
