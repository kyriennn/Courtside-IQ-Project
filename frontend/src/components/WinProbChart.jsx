import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { useSocket } from '../hooks/useSocket';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

// Displays the animated win probability chart for a single game.
// - Loads historical snapshots on mount
// - Appends new data points in real-time via WebSocket
//
export function WinProbChart({ game }) {
  const [history, setHistory] = useState([]);
  const latestOdds = useSocket(game.id); // Real-time updates

  // Load historical snapshots when the component mounts
  useEffect(() => {
    apiFetch(`/api/games/${game.id}/history`)
      .then((snapshots) => {
        setHistory(snapshots.map(formatSnapshot));
      })
      .catch(console.error);
  }, [game.id]);

  // Append new data point whenever the server pushes an update
  useEffect(() => {
    if (!latestOdds) return;
    setHistory((prev) => [...prev, formatSnapshot(latestOdds)]);
  }, [latestOdds]);

  // Show current prob from latest data point or snapshot
  const latest = history[history.length - 1];
  const homeProb = latest ? Math.round(latest.homeWinProb * 100) : null;
  const awayProb = latest ? Math.round(latest.awayWinProb * 100) : null;

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      {/* Header: team names and current probabilities */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-left">
          <p className="text-gray-400 text-sm">Home</p>
          <p className="text-white font-bold text-lg">{game.homeTeam}</p>
          {homeProb !== null && (
            <p className="text-blue-400 text-2xl font-mono">{homeProb}%</p>
          )}
        </div>
        <div className="text-gray-500 text-sm font-medium">WIN PROB</div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">Away</p>
          <p className="text-white font-bold text-lg">{game.awayTeam}</p>
          {awayProb !== null && (
            <p className="text-orange-400 text-2xl font-mono">{awayProb}%</p>
          )}
        </div>
      </div>

      {/* Chart */}
      {history.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          Waiting for live odds data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={45}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Math.round(value * 100)}%`,
                name === 'homeWinProb' ? game.homeTeam : game.awayTeam,
              ]}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            {/* 50/50 line */}
            <ReferenceLine y={0.5} stroke="#374151" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="homeWinProb"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#homeGrad)"
              dot={false}
              isAnimationActive={false} // Disable animation for real-time smoothness
            />
            <Area
              type="monotone"
              dataKey="awayWinProb"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#awayGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Convert a raw snapshot to chart-friendly format
function formatSnapshot(snapshot) {
  return {
    time: new Date(snapshot.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    homeWinProb: snapshot.homeWinProb,
    awayWinProb: snapshot.awayWinProb,
  };
}
