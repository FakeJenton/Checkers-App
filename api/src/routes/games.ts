import express, { Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/games
 * Create a new game record
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      room_code: z.string(),
      game_mode: z.enum(['online', 'ai', 'local']),
      red_player_id: z.string().uuid().optional(),
      black_player_id: z.string().uuid().optional(),
    });

    const { room_code, game_mode, red_player_id, black_player_id } = schema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO games (room_code, game_mode, red_player_id, black_player_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [room_code, game_mode, red_player_id || null, black_player_id || null]
    );

    res.status(201).json({ game: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/games/:gameId/complete
 * Mark game as completed
 */
router.patch('/:gameId/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      winner_id: z.string().uuid().nullable(),
      total_moves: z.number().int().min(0),
      duration_seconds: z.number().int().min(0),
    });

    const { winner_id, total_moves, duration_seconds } = schema.parse(req.body);

    const result = await pool.query(
      `UPDATE games
       SET status = 'completed',
           winner_id = $1,
           total_moves = $2,
           duration_seconds = $3,
           completed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [winner_id, total_moves, duration_seconds, req.params.gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({ game: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Complete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/games/my-history
 * Get current user's game history
 */
router.get('/my-history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT
         g.*,
         red_user.username as red_player_username,
         red_user.display_name as red_player_display_name,
         black_user.username as black_player_username,
         black_user.display_name as black_player_display_name,
         winner_user.username as winner_username
       FROM games g
       LEFT JOIN users red_user ON g.red_player_id = red_user.id
       LEFT JOIN users black_user ON g.black_player_id = black_user.id
       LEFT JOIN users winner_user ON g.winner_id = winner_user.id
       WHERE (g.red_player_id = $1 OR g.black_player_id = $1)
         AND g.status = 'completed'
       ORDER BY g.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.userId, limit, offset]
    );

    res.json({
      games: result.rows,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/games/:gameId/moves
 * Record a move in a game
 */
router.post('/:gameId/moves', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      move_number: z.number().int().min(1),
      player_color: z.enum(['red', 'black']),
      from_row: z.number().int().min(0).max(7),
      from_col: z.number().int().min(0).max(7),
      to_row: z.number().int().min(0).max(7),
      to_col: z.number().int().min(0).max(7),
      captured_pieces: z.array(z.object({
        row: z.number().int().min(0).max(7),
        col: z.number().int().min(0).max(7),
      })),
      is_promotion: z.boolean(),
    });

    const move = schema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO game_moves
       (game_id, move_number, player_color, from_row, from_col, to_row, to_col, captured_pieces, is_promotion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.params.gameId,
        move.move_number,
        move.player_color,
        move.from_row,
        move.from_col,
        move.to_row,
        move.to_col,
        JSON.stringify(move.captured_pieces),
        move.is_promotion,
      ]
    );

    res.status(201).json({ move: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Record move error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
