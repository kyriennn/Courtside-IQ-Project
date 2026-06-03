import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Middleware that verifies the Clerk JWT sent in the Authorization header.
// Attach this to any route that requires a logged-in user.
//
// Usage:
//   router.post('/picks', requireAuth, (req, res) => { ... })
//   req.userId is available after this middleware runs
//
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Clerk verifies the token and returns the session claims
    const { sub: userId } = await clerk.verifyToken(token);

    // Ensure the user exists in our DB (auto-create on first request)
    await ensureUserExists(userId);

    req.userId = userId; // Available to route handlers
    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Lazily create the User row in our DB the first time we see a Clerk user.
// This avoids needing a separate "register" endpoint.
async function ensureUserExists(userId) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
}
