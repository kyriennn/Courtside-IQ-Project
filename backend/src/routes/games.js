import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/games
// Returns all upcoming + live games, with the latest win probability snapshot
router.get('/', async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { isCompleted: false },
      orderBy: { commenceTime: 'asc' },
      include: {
        // Get only the most recent odds snapshot per game
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    res.json(games);
  } catch (err) {
    console.error('[GET /games]', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/:id/history
// Returns the full odds history for a game (used to draw the chart)
router.get('/:id/history', async (req, res) => {
  try {
    const snapshots = await prisma.oddsSnapshot.findMany({
      where: { gameId: req.params.id },
      orderBy: { timestamp: 'asc' },
    });

    res.json(snapshots);
  } catch (err) {
    console.error('[GET /games/:id/history]', err);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

export default router;
