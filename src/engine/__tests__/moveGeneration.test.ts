import { describe, it, expect } from 'vitest';
import { Board } from '../types';
import { generateLegalMoves, getMovesForPiece } from '../moveGeneration';

describe('Move Generation', () => {
  describe('Normal piece movement', () => {
    it('should generate forward diagonal moves for red pieces', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      expect(moves).toHaveLength(2);
      expect(moves.some(m => m.to.row === 4 && m.to.col === 1)).toBe(true);
      expect(moves.some(m => m.to.row === 4 && m.to.col === 3)).toBe(true);
    });

    it('should generate forward diagonal moves for black pieces', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[2][3] = { player: 'black', type: 'normal' };

      const moves = generateLegalMoves(board, 'black', false);

      expect(moves).toHaveLength(2);
      expect(moves.some(m => m.to.row === 3 && m.to.col === 2)).toBe(true);
      expect(moves.some(m => m.to.row === 3 && m.to.col === 4)).toBe(true);
    });

    it('should not move to occupied squares', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[7][0] = { player: 'red', type: 'normal' };
      board[6][1] = { player: 'red', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      // Piece at corner (7,0) is blocked by piece at (6,1)
      // Piece at (6,1) can move to (5,0) or (5,2)
      expect(moves).toHaveLength(2);
      expect(moves.every(m => m.from.row === 6 && m.from.col === 1)).toBe(true);
    });

    it('should not move off the board', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[6][7] = { player: 'red', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      // Can only move to (5,6), not off the board to the right
      expect(moves).toHaveLength(1);
      expect(moves[0].to.row).toBe(5);
      expect(moves[0].to.col).toBe(6);
    });
  });

  describe('King movement', () => {
    it('should generate diagonal moves in all four directions for kings', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[4][3] = { player: 'red', type: 'king' };

      const moves = generateLegalMoves(board, 'red', false);

      expect(moves).toHaveLength(4);
      expect(moves.some(m => m.to.row === 3 && m.to.col === 2)).toBe(true); // up-left
      expect(moves.some(m => m.to.row === 3 && m.to.col === 4)).toBe(true); // up-right
      expect(moves.some(m => m.to.row === 5 && m.to.col === 2)).toBe(true); // down-left
      expect(moves.some(m => m.to.row === 5 && m.to.col === 4)).toBe(true); // down-right
    });
  });

  describe('Capture moves', () => {
    it('should generate capture moves', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };
      board[4][3] = { player: 'black', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      const captureMoves = moves.filter(m => m.captures.length > 0);
      expect(captureMoves).toHaveLength(1);
      expect(captureMoves[0].to.row).toBe(3);
      expect(captureMoves[0].to.col).toBe(4);
      expect(captureMoves[0].captures).toHaveLength(1);
      expect(captureMoves[0].captures[0]).toEqual({ row: 4, col: 3 });
    });

    it('should allow normal pieces to capture backward', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[3][2] = { player: 'red', type: 'normal' };
      board[4][3] = { player: 'black', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      const captureMoves = moves.filter(m => m.captures.length > 0);
      expect(captureMoves.length).toBeGreaterThan(0);
      expect(captureMoves.some(m => m.to.row === 5 && m.to.col === 4)).toBe(true);
    });

    it('should generate multi-jump capture sequences', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };
      board[4][3] = { player: 'black', type: 'normal' };
      board[2][5] = { player: 'black', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      const multiJump = moves.find(m => m.captures.length === 2);
      expect(multiJump).toBeDefined();
      expect(multiJump?.to.row).toBe(1);
      expect(multiJump?.to.col).toBe(6);
    });
  });

  describe('Forced captures', () => {
    it('should only return capture moves when mandatory captures is enabled', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };
      board[4][3] = { player: 'black', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', true);

      expect(moves.every(m => m.captures.length > 0)).toBe(true);
    });

    it('should return all moves when no captures are available', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', true);

      expect(moves).toHaveLength(2);
      expect(moves.every(m => m.captures.length === 0)).toBe(true);
    });
  });

  describe('Promotion detection', () => {
    it('should mark moves to the far row as promotions', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[1][2] = { player: 'red', type: 'normal' };

      const moves = generateLegalMoves(board, 'red', false);

      const promotionMove = moves.find(m => m.to.row === 0);
      expect(promotionMove?.isPromotion).toBe(true);
    });

    it('should not mark king moves as promotions', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[1][2] = { player: 'red', type: 'king' };

      const moves = generateLegalMoves(board, 'red', false);

      expect(moves.every(m => !m.isPromotion)).toBe(true);
    });
  });

  describe('getMovesForPiece', () => {
    it('should return moves only for the specified piece', () => {
      const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
      board[5][2] = { player: 'red', type: 'normal' };
      board[5][4] = { player: 'red', type: 'normal' };

      const moves = getMovesForPiece(board, { row: 5, col: 2 }, 'red', false);

      expect(moves.every(m => m.from.row === 5 && m.from.col === 2)).toBe(true);
    });
  });
});
