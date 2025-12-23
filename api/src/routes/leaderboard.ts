import express, { Request, Response } from 'express';
import pool from '../db/pool';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/leaderboard/alltime
 * Get all-time leaderboard
 */
router.get('/alltime', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT * FROM leaderboard_alltime
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get current user's rank if authenticated
    let userRank = null;
    if (req.user) {
      const rankResult = await pool.query(
        `SELECT rank FROM leaderboard_alltime WHERE id = $1`,
        [req.user.userId]
      );
      userRank = rankResult.rows[0]?.rank || null;
    }

    res.json({
      leaderboard: result.rows,
      userRank,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get all-time leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/leaderboard/weekly
 * Get weekly leaderboard
 */
router.get('/weekly', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT * FROM leaderboard_weekly
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get current user's rank if authenticated
    let userRank = null;
    if (req.user) {
      const rankResult = await pool.query(
        `SELECT rank FROM leaderboard_weekly WHERE id = $1`,
        [req.user.userId]
      );
      userRank = rankResult.rows[0]?.rank || null;
    }

    res.json({
      leaderboard: result.rows,
      userRank,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
