import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import gamesRouter from './routes/games.js';
import picksRouter from './routes/picks.js';
import { startPollJob } from './jobs/pollOdds.js';

const app = express();
const httpServer = createServer(app); // Socket.io needs the raw http server

// ── Socket.io setup ────────────────────────────────────────────────────────
// We attach Socket.io to the same HTTP server as Express.
// The frontend connects here to receive real-time odds updates.
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Client joins a room for a specific game to receive its updates
  socket.on('join_game', (gameId) => {
    socket.join(gameId);
    console.log(`Socket ${socket.id} joined game room: ${gameId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/games', gamesRouter);
app.use('/api/picks', picksRouter);

// Health check — useful for Railway deployment
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startPollJob(); // Start background cron job
});
