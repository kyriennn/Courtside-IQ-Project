import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { WinProbChart } from '../components/WinProbChart';
import { apiFetch } from '../lib/api';

export function Game() {
  const { id } = useParams();
  const { getToken, isSignedIn } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickStatus, setPickStatus] = useState(null); // 'home' | 'away' | null
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch this game (games endpoint returns array; find the one we want)
    apiFetch('/api/games')
      .then((games) => {
        const found = games.find((g) => g.id === id);
        setGame(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function submitPick(pickedTeam) {
    if (!isSignedIn) return alert('Sign in to submit a pick');
    setSubmitting(true);
    try {
      await apiFetch(
        '/api/picks',
        { method: 'POST', body: JSON.stringify({ gameId: id, pickedTeam }) },
        getToken
      );
      setPickStatus(pickedTeam);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-gray-500 text-center py-12">Loading...</div>;
  if (!game) return <div className="text-gray-500 text-center py-12">Game not found.</div>;

  const isLocked = new Date() >= new Date(game.commenceTime);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="text-gray-500 hover:text-white text-sm mb-6 block">
        ← Back to games
      </Link>

      {/* Game header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">
          {game.sport === 'basketball_nba' ? '🏀 NBA' : '🏈 NFL'} ·{' '}
          {new Date(game.commenceTime).toLocaleString()}
        </p>
        <h1 className="text-2xl font-bold text-white mt-1">
          {game.homeTeam} vs {game.awayTeam}
        </h1>
      </div>

      {/* Live chart */}
      <div className="mb-8">
        <WinProbChart game={game} />
      </div>

      {/* Pick'em section */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-white font-semibold mb-1">Make your pick</h2>
        <p className="text-gray-500 text-sm mb-4">
          {isLocked ? 'Picks are locked — game has started.' : 'Locks when the game starts.'}
        </p>

        {pickStatus && (
          <p className="text-green-400 text-sm mb-4">
            ✓ You picked <strong>{pickStatus === 'home' ? game.homeTeam : game.awayTeam}</strong>
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => submitPick('home')}
            disabled={isLocked || submitting || pickStatus === 'home'}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium text-sm transition-colors"
          >
            {game.homeTeam}
          </button>
          <button
            onClick={() => submitPick('away')}
            disabled={isLocked || submitting || pickStatus === 'away'}
            className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium text-sm transition-colors"
          >
            {game.awayTeam}
          </button>
        </div>
      </div>
    </div>
  );
}
