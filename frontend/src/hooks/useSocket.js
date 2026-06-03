import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Hook: connect to the Socket.io server and join a game room.
// Returns the latest odds update pushed from the server.
//
// Usage:
//   const latestOdds = useSocket(gameId);
//
export function useSocket(gameId) {
  const socketRef = useRef(null);
  const [latestOdds, setLatestOdds] = useState(null);

  useEffect(() => {
    if (!gameId) return;

    // Create Socket.io connection
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] Connected:', socket.id);
      // Join the room for this specific game
      socket.emit('join_game', gameId);
    });

    // Server broadcasts this event every time new odds come in
    socket.on('odds_update', (data) => {
      console.log('[socket] odds_update:', data);
      setLatestOdds(data);
    });

    socket.on('disconnect', () => {
      console.log('[socket] Disconnected');
    });

    // Cleanup: disconnect when component unmounts or gameId changes
    return () => {
      socket.disconnect();
    };
  }, [gameId]);

  return latestOdds;
}
