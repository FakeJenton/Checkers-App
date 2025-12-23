import { Difficulty, GameState, Move, Player } from './types';
import { applyMove, countPieces } from './gameEngine';
import { generateLegalMoves } from './moveGeneration';
import { getOpponent } from './gameState';

/**
 * Evaluate the board position from the perspective of the given player.
 * Higher scores are better for the player.
 *
 * Heuristic factors:
 * - Material: number of pieces (kings worth more)
 * - Positioning: pieces closer to promotion
 * - King advantage
 */
function evaluatePosition(state: GameState, player: Player): number {
  // If game is over, return extreme values
  if (state.winner === player) return 10000;
  if (state.winner === getOpponent(player)) return -10000;

  const counts = countPieces(state);
  const opponent = getOpponent(player);

  let score = 0;

  // Material advantage
  const playerPieces = player === 'red' ? counts.red : counts.black;
  const opponentPieces = opponent === 'red' ? counts.red : counts.black;
  const playerKings = player === 'red' ? counts.redKings : counts.blackKings;
  const opponentKings = opponent === 'red' ? counts.redKings : counts.blackKings;

  // Each normal piece is worth 100 points
  score += (playerPieces - opponentPieces) * 100;

  // Kings are worth 150 points (50 point bonus over normal pieces)
  score += (playerKings - opponentKings) * 50;

  // Positional advantage: pieces closer to promotion
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (!piece || piece.type === 'king') continue;

      if (piece.player === player) {
        // Reward pieces closer to the far row
        const distanceToPromotion = player === 'red' ? row : (7 - row);
        score += (7 - distanceToPromotion) * 5;
      } else {
        // Penalize opponent pieces closer to promotion
        const distanceToPromotion = opponent === 'red' ? row : (7 - row);
        score -= (7 - distanceToPromotion) * 5;
      }
    }
  }

  // Mobility: number of legal moves available
  const playerMoves = generateLegalMoves(state.board, player, state.mandatoryCaptures).length;
  const opponentMoves = generateLegalMoves(state.board, opponent, state.mandatoryCaptures).length;
  score += (playerMoves - opponentMoves) * 3;

  return score;
}

/**
 * Minimax algorithm with alpha-beta pruning.
 * Returns the best score for the given player.
 */
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPlayer: Player
): number {
  // Base case: depth 0 or game over
  if (depth === 0 || state.winner !== null) {
    return evaluatePosition(state, aiPlayer);
  }

  const currentPlayer = state.currentPlayer;
  const legalMoves = generateLegalMoves(state.board, currentPlayer, state.mandatoryCaptures);

  if (legalMoves.length === 0) {
    // No legal moves means the current player loses
    return evaluatePosition(state, aiPlayer);
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;

    for (const move of legalMoves) {
      const newState = applyMove(state, move);
      const evaluation = minimax(newState, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);

      if (beta <= alpha) break; // Alpha-beta pruning
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const move of legalMoves) {
      const newState = applyMove(state, move);
      const evaluation = minimax(newState, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);

      if (beta <= alpha) break; // Alpha-beta pruning
    }

    return minEval;
  }
}

/**
 * Score a move based on immediate tactical value.
 * Used to prioritize move ordering for better alpha-beta pruning.
 */
function scoreMoveImmediate(move: Move): number {
  let score = 0;

  // Captures are highly valuable
  score += move.captures.length * 100;

  // Multi-jump captures are even better
  if (move.captures.length > 1) {
    score += move.captures.length * 50;
  }

  // Promotions are valuable
  if (move.isPromotion) {
    score += 80;
  }

  return score;
}

/**
 * Get the best move for the AI player using minimax with alpha-beta pruning.
 */
export function getBestMove(state: GameState, difficulty: Difficulty): Move | null {
  const legalMoves = generateLegalMoves(state.board, state.currentPlayer, state.mandatoryCaptures);

  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  // Set search depth based on difficulty
  const depth = difficulty === 'casual' ? 3 : 6;

  // Sort moves by immediate tactical value for better pruning
  const sortedMoves = [...legalMoves].sort((a, b) => scoreMoveImmediate(b) - scoreMoveImmediate(a));

  let bestMove = sortedMoves[0];
  let bestScore = -Infinity;

  for (const move of sortedMoves) {
    const newState = applyMove(state, move);
    const score = minimax(newState, depth - 1, -Infinity, Infinity, false, state.currentPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Get a random legal move (for the simplest AI or testing).
 */
export function getRandomMove(state: GameState): Move | null {
  const legalMoves = generateLegalMoves(state.board, state.currentPlayer, state.mandatoryCaptures);

  if (legalMoves.length === 0) return null;

  // Prioritize captures if available
  const captureMoves = legalMoves.filter(move => move.captures.length > 0);
  if (captureMoves.length > 0) {
    return captureMoves[Math.floor(Math.random() * captureMoves.length)];
  }

  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}
