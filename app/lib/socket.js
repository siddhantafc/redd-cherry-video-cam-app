import { io } from 'socket.io-client';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../utils/authStorage';

let socket = null;
let refCount = 0;
let initPromise = null;

// Derive correct origin + path for Socket.IO when API_BASE_URL contains an /api suffix.
// Many REST setups reverse-proxy the Node server at /api while websockets still need the
// correct path (/api/socket.io). Passing a URL with a path segment directly to io() can
// sometimes produce unexpected handshake URLs on certain React Native environments.
const deriveSocketEndpoint = () => {
  let raw = (API_BASE_URL || '').trim();
  if (!raw) throw new Error('API_BASE_URL not set');
  // Remove trailing slash for consistency
  raw = raw.replace(/\/$/, '');

  // If the base ends with /api (case-insensitive), strip it for origin and use /api/socket.io as path
  const apiMatch = raw.match(/^(.*)\/api$/i);
  if (apiMatch) {
    return { origin: apiMatch[1], path: '/api/socket.io' };
  }
  // Otherwise treat entire raw as origin, default path
  return { origin: raw, path: '/socket.io' };
};

const createAndConnect = async () => {
  const token = await AuthStorage.getToken();
  if (!token) throw new Error('No authentication token available for socket');

  const { origin, path } = deriveSocketEndpoint();

  // Create client without auto-connect to set auth first
  const s = io(origin, {
    path,
    autoConnect: false,
    // Allow polling fallback in case websocket upgrade fails (common on restrictive networks / proxies)
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: false,
  });

  s.auth = { token };

  console.log('[socket] attempting connection', { origin, path, hasToken: !!token });
  s.connect();

  // Diagnostics
  s.on('connect', () => {
    console.log('[socket] connected', { id: s.id });
  });
  s.on('disconnect', (reason) => {
    console.log('[socket] disconnected', { reason });
  });
  s.on('connect_error', (err) => {
    console.warn('[socket] connect_error', { message: err?.message || String(err) });
  });
  s.on('error', (err) => {
    console.warn('[socket] generic error', err);
  });

  return s;
};

export const acquireSocket = async () => {
  refCount += 1;
  if (socket) return socket;
  if (!initPromise) {
    initPromise = createAndConnect()
      .then((s) => {
        socket = s;
        return socket;
      })
      .finally(() => {
        initPromise = null; // allow re-init if needed later
      });
  }
  return initPromise;
};

export const releaseSocket = () => {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    // If a socket exists now, tear it down immediately
    if (socket) {
      try {
        socket.removeAllListeners?.();
        socket.disconnect?.();
      } catch {}
      socket = null;
      return;
    }

    // If initialization is still in flight, schedule a teardown
    // once the socket is created — but only if refCount remains 0
    if (initPromise) {
      initPromise
        .then((s) => {
          if (refCount === 0 && s) {
            try {
              s.removeAllListeners?.();
              s.disconnect?.();
            } catch {}
            if (socket === s) socket = null;
          }
        })
        .catch(() => {})
        .finally(() => {
          // no-op; createAndConnect will clear initPromise
        });
    }
  }
};

export const getCurrentSocket = () => socket;

// Forcefully close and reset the socket regardless of refCount.
// Useful for logout flows where you want immediate teardown.
export const forceCloseSocket = () => {
  // Reset ref counter so future acquire will re-init
  refCount = 0;

  if (socket) {
    try {
      socket.removeAllListeners?.();
      socket.disconnect?.();
    } catch {}
    socket = null;
  }

  if (initPromise) {
    initPromise
      .then((s) => {
        try {
          s.removeAllListeners?.();
          s.disconnect?.();
        } catch {}
        if (socket === s) socket = null;
      })
      .catch(() => {})
      .finally(() => {
        // no-op
      });
  }
};
