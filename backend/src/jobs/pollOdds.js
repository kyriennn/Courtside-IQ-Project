import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { fetchGamesWithOdds } from '../lib/oddsApi.js';
import { io } from '../index.js';

const prisma = new PrismaClient();

const SPORTS = ['basketball_nba', 'americanfootball_nfl'];

// Called on each tick — fetches latest odds, stores a snapshot, broadcasts
async function pollAndBroadcast() {
  console.log(`[pollOdds] Running at ${new Date().toISOString()}`);

  for (const sport of SPORTS) {
    try {
      const games = await fetchGamesWithOdds(sport);

      for (const game of games) {
        // Skip if no odds available
        if (game.homeWinProb === null) continue;

        // Upsert the game record (create if new, update if exists)
        await prisma.game.upsert({
          where: { id: game.id },
          update: {
            isLive: isGameLive(game.commenceTime),
            updatedAt: new Date(),
          },
          create: {
            id: game.id,
            sport: game.sport,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            commenceTime: new Date(game.commenceTime),
            isLive: isGameLive(game.commenceTime),
          },
        });

        // Save a new odds snapshot to the DB
        const snapshot = await prisma.oddsSnapshot.create({
          data: {
            gameId: game.id,
            homeOdds: game.homeOdds,
            awayOdds: game.awayOdds,
            homeWinProb: game.homeWinProb,
            awayWinProb: game.awayWinProb,
          },
        });

        // Broadcast the update to all clients watching this game.
        // io.to(gameId) sends only to sockets that joined that room.
        io.to(game.id).emit('odds_update', {
          gameId: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeWinProb: game.homeWinProb,
          awayWinProb: game.awayWinProb,
          timestamp: snapshot.timestamp,
        });
      }
    } catch (err) {
      console.error(`[pollOdds] Error for sport ${sport}:`, err.message);
    }
  }
}

// A game is "live" if it started in the last 3 hours
function isGameLive(commenceTime) {
  const start = new Date(commenceTime);
  const now = new Date();
  const hoursElapsed = (now - start) / 1000 / 60 / 60;
  return hoursElapsed >= 0 && hoursElapsed < 3;
}

// Start the cron job — runs every 30 seconds
export function startPollJob() {
  console.log('[pollOdds] Starting cron job (every 30s)');

  // Run immediately on startup
  pollAndBroadcast();

  // Then run every 30 seconds
  // Note: node-cron minimum is every minute. For 30s we use two schedules.
  cron.schedule('* * * * *', pollAndBroadcast);         // on the minute
  cron.schedule('*/1 * * * *', () => {                  // 30s offset
    setTimeout(pollAndBroadcast, 30_000);
  });
}
