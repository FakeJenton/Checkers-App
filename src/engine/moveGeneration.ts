import { Board, Move, Piece, Player, Position } from './types';
import { getOpponent, isValidPosition, isDarkSquare, positionsEqual, cloneBoard } from './gameState';

/**
 * Generate all possible capture moves for a piece at a given position.
 * Handles multi-jump sequences recursively.
 */
function generateCaptureMoves(
  board: Board,
  from: Position,
  piece: Piece,
  capturedSoFar: Position[] = [],
  visitedSquares: Position[] = []
): Move[] {
  const moves: Move[] = [];
  const opponent = getOpponent(piece.player);

  // Determine diagonal directions based on piece type
  const directions: { dr: number; dc: number }[] = [];

  if (piece.type === 'king') {
    // Kings can capture in all diagonal directions
    directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 });
  } else {
    // Normal pieces can only capture diagonally forward
    // Black at rows 0-2 moves DOWN (positive), Red at rows 5-7 moves UP (negative)
    const forward = piece.player === 'black' ? 1 : -1;
    directions.push({ dr: forward, dc: -1 }, { dr: forward, dc: 1 });
  }

  for (const { dr, dc } of directions) {
    const jumpOverRow = from.row + dr;
    const jumpOverCol = from.col + dc;
    const landRow = from.row + 2 * dr;
    const landCol = from.col + 2 * dc;

    // Check if the jump is valid
    if (!isValidPosition(landRow, landCol)) continue;
    if (!isDarkSquare(landRow, landCol)) continue;

    const jumpOverPiece = board[jumpOverRow][jumpOverCol];
    const landSquare = board[landRow][landCol];

    // Must jump over an opponent piece to an empty square
    if (!jumpOverPiece || jumpOverPiece.player !== opponent) continue;
    if (landSquare !== null) continue;

    // Don't jump over already captured pieces in this sequence
    const jumpOverPos = { row: jumpOverRow, col: jumpOverCol };
    if (capturedSoFar.some(pos => positionsEqual(pos, jumpOverPos))) continue;

    // Don't revisit squares we've already been to in this jump sequence
    const landPos = { row: landRow, col: landCol };
    if (visitedSquares.some(pos => positionsEqual(pos, landPos))) continue;

    // This is a valid capture
    const newCaptured = [...capturedSoFar, jumpOverPos];
    const newVisited = [...visitedSquares, from, landPos];

    // Temporarily apply the move to check for additional captures
    const tempBoard = cloneBoard(board);
    tempBoard[landRow][landCol] = piece;
    tempBoard[from.row][from.col] = null;

    // Remove captured piece
    tempBoard[jumpOverRow][jumpOverCol] = null;

    // Check if we can continue capturing from the landing position
    const furtherCaptures = generateCaptureMoves(
      tempBoard,
      landPos,
      piece,
      newCaptured,
      newVisited
    );

    if (furtherCaptures.length > 0) {
      // Add all multi-jump sequences
      moves.push(...furtherCaptures);
    } else {
      // This is the end of a capture sequence
      const originalFrom = visitedSquares.length > 0 ? visitedSquares[0] : from;

      // Check if this move would result in a promotion
      // Black at rows 0-2 promotes at row 7, Red at rows 5-7 promotes at row 0
      const isPromotion = piece.type === 'normal' &&
        ((piece.player === 'black' && landRow === 7) || (piece.player === 'red' && landRow === 0));

      moves.push({
        from: originalFrom,
        to: landPos,
        captures: newCaptured,
        isPromotion,
      });
    }
  }

  return moves;
}

/**
 * Generate all possible non-capture moves for a piece at a given position
 */
function generateNormalMoves(board: Board, from: Position, piece: Piece): Move[] {
  const moves: Move[] = [];

  // Determine diagonal directions based on piece type
  const directions: { dr: number; dc: number }[] = [];

  if (piece.type === 'king') {
    // Kings can move in all diagonal directions
    directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 });
  } else {
    // Normal pieces move diagonally forward only
    // Black at rows 0-2 moves DOWN (positive), Red at rows 5-7 moves UP (negative)
    const forward = piece.player === 'black' ? 1 : -1;
    directions.push({ dr: forward, dc: -1 }, { dr: forward, dc: 1 });
  }

  for (const { dr, dc } of directions) {
    const newRow = from.row + dr;
    const newCol = from.col + dc;

    if (!isValidPosition(newRow, newCol)) continue;
    if (!isDarkSquare(newRow, newCol)) continue;
    if (board[newRow][newCol] !== null) continue;

    // Check if this move would result in a promotion
    // Black at rows 0-2 promotes at row 7, Red at rows 5-7 promotes at row 0
    const isPromotion = piece.type === 'normal' &&
      ((piece.player === 'black' && newRow === 7) || (piece.player === 'red' && newRow === 0));

    moves.push({
      from,
      to: { row: newRow, col: newCol },
      captures: [],
      isPromotion,
    });
  }

  return moves;
}

/**
 * Generate all legal moves for the current player.
 * If mandatory captures is enabled and captures are available, only capture moves are returned.
 */
export function generateLegalMoves(board: Board, player: Player, mandatoryCaptures: boolean): Move[] {
  const allCaptures: Move[] = [];
  const allNormalMoves: Move[] = [];

  // Scan the board for all pieces belonging to the current player
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.player !== player) continue;

      const position = { row, col };
      const captures = generateCaptureMoves(board, position, piece);
      const normalMoves = generateNormalMoves(board, position, piece);

      allCaptures.push(...captures);
      allNormalMoves.push(...normalMoves);
    }
  }

  // If mandatory captures is enabled and captures exist, only return captures
  if (mandatoryCaptures && allCaptures.length > 0) {
    return allCaptures;
  }

  // Otherwise return all moves
  return [...allCaptures, ...allNormalMoves];
}

/**
 * Get all valid moves for a specific piece.
 * Used for highlighting valid moves in the UI.
 */
export function getMovesForPiece(
  board: Board,
  position: Position,
  player: Player,
  mandatoryCaptures: boolean
): Move[] {
  const piece = board[position.row][position.col];
  if (!piece || piece.player !== player) return [];

  const allLegalMoves = generateLegalMoves(board, player, mandatoryCaptures);

  // Filter to only moves from this position
  return allLegalMoves.filter(move => positionsEqual(move.from, position));
}

/**
 * Check if a specific move is legal in the current game state
 */
export function isMoveLegal(
  board: Board,
  move: Move,
  player: Player,
  mandatoryCaptures: boolean
): boolean {
  const legalMoves = generateLegalMoves(board, player, mandatoryCaptures);

  return legalMoves.some(legalMove =>
    positionsEqual(legalMove.from, move.from) &&
    positionsEqual(legalMove.to, move.to) &&
    legalMove.captures.length === move.captures.length
  );
}
