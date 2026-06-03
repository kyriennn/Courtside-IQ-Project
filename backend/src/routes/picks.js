import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/picks
// Submit a pick for a game. Requires auth. Locked after game starts.
router.post('/', requireAuth, async (req, res) => {
  const { gameId, pickedTeam } = req.body;

  if (!gameId || !['home', 'away'].includes(pickedTeam)) {
    return res.status(400).json({ error: 'gameId and pickedTeam (home|away) are required' });
  }

  try {
    // Make sure the game exists and hasn't started yet
    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (new Date() >= new Date(game.commenceTime)) {
      return res.status(400).json({ error: 'Picks are locked — game has already started' });
    }

    // Upsert: one pick per user per game (updates if they change their mind)
    const pick = await prisma.pick.upsert({
      where: { userId_gameId: { userId: req.userId, gameId } },
      update: { pickedTeam },
      create: { userId: req.userId, gameId, pickedTeam },
    });

    res.json(pick);
  } catch (err) {
    console.error('[POST /picks]', err);
    res.status(500).json({ error: 'Failed to save pick' });
  }
});

// GET /api/picks/mine
// Returns the logged-in user's picks with results
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const picks = await prisma.pick.findMany({
      where: { userId: req.userId },
      include: { game: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(picks);
  } catch (err) {
    console.error('[GET /picks/mine]', err);
    res.status(500).json({ error: 'Failed to fetch picks' });
  }
});

export default router;
