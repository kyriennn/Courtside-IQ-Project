# Courtside IQ 🏀🏈
> Live win probability tracker for NBA & NFL games

## Stack
| Layer | Tech |
|---|---|
| Frontend | React + Vite + TailwindCSS + Recharts |
| Backend | Node.js + Express + Socket.io |
| Database | PostgreSQL + Prisma |
| Auth | Clerk |
| Sports Data | The Odds API + Ball Don't Lie |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

## Project Structure
```
courtside-iq/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── src/
│       ├── index.js            # Express + Socket.io entry point
│       ├── routes/
│       │   ├── games.js        # GET /api/games
│       │   └── picks.js        # POST /api/picks
│       ├── middleware/
│       │   └── auth.js         # Clerk JWT verification
│       ├── lib/
│       │   └── oddsApi.js      # The Odds API client + win prob formula
│       └── jobs/
│           └── pollOdds.js     # Cron job: poll odds every 30s
└── frontend/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── pages/
        │   ├── Home.jsx        # Game list
        │   └── Game.jsx        # Live win prob chart
        ├── components/
        │   ├── GameCard.jsx
        │   └── WinProbChart.jsx
        ├── hooks/
        │   └── useSocket.js    # Socket.io hook
        └── lib/
            └── api.js          # Fetch wrapper
```

## Setup

### 1. Clone and install
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Environment variables

**backend/.env**
```
DATABASE_URL="postgresql://..."
ODDS_API_KEY="your_key_from_the-odds-api.com"
CLERK_SECRET_KEY="sk_test_..."
PORT=3000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. Database setup
```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Run locally
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```
