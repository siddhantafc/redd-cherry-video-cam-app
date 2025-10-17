import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { acquireSocket, releaseSocket } from '../lib/socket';

export const useRealtimeStatus = (onStatusUpdate) => {
  const socketRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const bgTimeoutRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const socket = await acquireSocket();
        if (!mounted) return;
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to socket server');
          // Mark online on connect
          try { socket.emit('status:change', { status: 'online' }); } catch {}
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from socket server');
        });

        const handler = (data) => {
          console.log('User status changed:', data);
          if (onStatusUpdate) {
            onStatusUpdate({ userId: data.userId, status: data.status });
          }
        };
        socket.on('user:status:changed', handler);

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        // Save per-socket cleanup
        cleanupRef.current = () => {
          socket.off('user:status:changed', handler);
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('error');
        };
      } catch (e) {
        console.error('Error initializing socket:', e);
      }
    };
    init();

    return () => {
      mounted = false;
      // Mark offline on unmount best-effort
      try { socketRef.current?.emit?.('status:change', { status: 'offline' }); } catch {}
      // Remove listeners and potentially disconnect shared socket
      cleanupRef.current?.();
      releaseSocket();
      if (bgTimeoutRef.current) { clearTimeout(bgTimeoutRef.current); bgTimeoutRef.current = null; }
    };
  }, [onStatusUpdate]);

  // Handle app foreground/background transitions
  useEffect(() => {
    const onChange = (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (!socketRef.current) return;

      if (nextState === 'active') {
        // Cancel pending offline and mark online
        if (bgTimeoutRef.current) { clearTimeout(bgTimeoutRef.current); bgTimeoutRef.current = null; }
        try { socketRef.current.emit('status:change', { status: 'online' }); } catch {}
      } else if (nextState === 'background' || nextState === 'inactive') {
        // Debounce offline to avoid flapping on quick app switches
        if (bgTimeoutRef.current) clearTimeout(bgTimeoutRef.current);
        bgTimeoutRef.current = setTimeout(() => {
          try { socketRef.current?.emit('status:change', { status: 'offline' }); } catch {}
        }, 10000);
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => { try { sub.remove(); } catch {} };
  }, []);

  const updateStatus = (status) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('status:change', { status });
    }
  };

  return {
    socket: socketRef.current,
    updateStatus,
  };
};

export default useRealtimeStatus;
