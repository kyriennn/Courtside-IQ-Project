import { Link } from 'react-router-dom';

// Displays a single game in the game list.
// Shows teams, time, sport badge, and latest win probability if available.
export function GameCard({ game }) {
  const snapshot = game.snapshots?.[0]; // Most recent odds snapshot
  const homeProb = snapshot ? Math.round(snapshot.homeWinProb * 100) : null;
  const awayProb = snapshot ? Math.round(snapshot.awayWinProb * 100) : null;

  const gameTime = new Date(game.commenceTime).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link to={`/game/${game.id}`} className="block">
      <div className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-5 border border-gray-800">
        {/* Sport badge + live indicator */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-400">
            {game.sport === 'basketball_nba' ? '🏀 NBA' : '🏈 NFL'}
          </span>
          {game.isLive && (
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-900 text-red-400 animate-pulse">
              LIVE
            </span>
          )}
        </div>

        {/* Teams + win probs */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-semibold">{game.homeTeam}</p>
            <p className="text-gray-500 text-xs mt-0.5">Home</p>
          </div>

          {homeProb !== null ? (
            <div className="text-center">
              <div className="flex gap-3 items-center">
                <span className="text-blue-400 font-mono text-lg font-bold">{homeProb}%</span>
                <span className="text-gray-600 text-xs">vs</span>
                <span className="text-orange-400 font-mono text-lg font-bold">{awayProb}%</span>
              </div>
              <p className="text-gray-600 text-xs mt-0.5">win probability</p>
            </div>
          ) : (
            <span className="text-gray-600 text-sm">vs</span>
          )}

          <div className="text-right">
            <p className="text-white font-semibold">{game.awayTeam}</p>
            <p className="text-gray-500 text-xs mt-0.5">Away</p>
          </div>
        </div>

        {/* Time */}
        <p className="text-gray-600 text-xs mt-3 text-center">{gameTime}</p>
      </div>
    </Link>
  );
}
