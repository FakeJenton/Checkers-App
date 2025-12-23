import express, { Response } from 'express';
import pool from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/stats/me
 * Get current user's statistics
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM player_stats WHERE user_id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/:userId
 * Get specific user's statistics
 */
router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, u.username, u.display_name, u.avatar_url
       FROM player_stats ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.user_id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats/history/me
 * Get current user's rating history
 */
router.get('/history/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const result = await pool.query(
      `SELECT elo_rating, total_games, total_wins, win_streak, recorded_at
       FROM player_stats_history
       WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '${days} days'
       ORDER BY recorded_at ASC`,
      [req.user!.userId]
    );

    res.json({ history: result.rows });
  } catch (error) {
    console.error('Get stats history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
