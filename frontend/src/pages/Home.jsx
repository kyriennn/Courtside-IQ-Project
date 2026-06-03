import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { GameCard } from '../components/GameCard';
import { apiFetch } from '../lib/api';

export function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/games')
      .then((data) => setGames(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const liveGames = games.filter((g) => g.isLive);
  const upcomingGames = games.filter((g) => !g.isLive);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">Courtside IQ</h1>
      <p className="text-gray-500 text-sm mb-8">Live win probability for NBA & NFL</p>

      {loading && <p className="text-gray-500 text-center py-12">Loading games...</p>}
      {error && <p className="text-red-400 text-center py-12">{error}</p>}

      {liveGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">
            Live now
          </h2>
          <div className="space-y-3">
            {liveGames.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </section>
      )}

      {upcomingGames.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcomingGames.map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </section>
      )}

      {!loading && games.length === 0 && (
        <p className="text-gray-600 text-center py-12">No games scheduled right now.</p>
      )}
    </div>
  );
}
