import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server:', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket connection disconnected');
      }
    };
  }, []);

  return socketRef.current;
};

export default useSocket;
