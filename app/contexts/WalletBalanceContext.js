import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../utils/authStorage';
import { acquireSocket, releaseSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

const WalletBalanceContext = createContext();

export const useWalletBalance = () => {
  const context = useContext(WalletBalanceContext);
  if (!context) {
    throw new Error('useWalletBalance must be used within a WalletBalanceProvider');
  }
  return context;
};

export const WalletBalanceProvider = ({ children }) => {
  const [balanceSeconds, setBalanceSeconds] = useState(0);
  const [isUserRole, setIsUserRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const { isAuthenticated } = useAuth();

  // Convert seconds to rupees
  const secondsToRupees = useCallback((s) => {
    const secs = Number(s) || 0;
    // 0.4 ₹ / sec (from recharge logic)
    return secs * 0.4;
  }, []);

  const formatRupees = useCallback((rs) => `₹${Number(rs).toFixed(1)}`, []);

  // Fetch initial balance from API
  const fetchBalance = useCallback(async () => {
    try {
      setError(null);
      const storedUser = await AuthStorage.getUser();
      const role = storedUser?.role_id || storedUser?.role || storedUser?.userRole; // fallback keys if backend changes
      if (!storedUser) {
        console.warn('[WalletBalance] No stored user found yet when fetching balance');
      } else if (!storedUser.role_id) {
        console.warn('[WalletBalance] storedUser missing role_id field. user keys:', Object.keys(storedUser));
      }
      
      if (!mountedRef.current) return;
      setIsUserRole(role === '2');

      // For non-user roles, set balance to 0 and return
      if (role !== '2') {
        setBalanceSeconds(0);
        setIsLoading(false);
        return;
      }

      // Use cached value initially if available
      if (storedUser?.wallet_balance_seconds != null && mountedRef.current) {
        setBalanceSeconds(storedUser.wallet_balance_seconds);
      }

      // Fetch latest from API
      const token = await AuthStorage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/profile/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data?.profile && mountedRef.current) {
        const newBalance = data.profile.wallet_balance_seconds ?? 0;
        setBalanceSeconds(newBalance);
        
        // Update cached user data
        try {
          const updatedUser = { ...storedUser, wallet_balance_seconds: newBalance };
          await AuthStorage.setUser(updatedUser);
        } catch (e) {
          // Ignore cache update errors
        }
      }
    } catch (e) {
      console.warn('Error fetching wallet balance:', e);
      setError(e.message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Setup socket connection for real-time updates
  const initializeSocket = useCallback(async () => {
    if (initializedRef.current) return;
    
    try {
      const socket = await acquireSocket();
      if (!mountedRef.current) return;
      
      socketRef.current = socket;

      // Listen for wallet balance updates
      const handleBalanceUpdate = (data) => {
        console.log('Wallet balance updated:', data);
        if (data.userId && mountedRef.current) {
          setBalanceSeconds(data.newBalance);
          
          // Update cached user data
          AuthStorage.getUser().then(storedUser => {
            if (storedUser) {
              const updatedUser = { ...storedUser, wallet_balance_seconds: data.newBalance };
              AuthStorage.setUser(updatedUser).catch(() => {});
            }
          }).catch(() => {});
        }
      };

      socket.on('wallet:balance:updated', handleBalanceUpdate);
      initializedRef.current = true;

      // Store cleanup function
      socketRef.current.cleanup = () => {
        socket.off('wallet:balance:updated', handleBalanceUpdate);
      };

    } catch (e) {
      console.error('Error initializing wallet balance socket:', e);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;

    // On mount, attempt init/fetch (may no-op if not authenticated yet)
    Promise.all([
      initializeSocket(),
      fetchBalance()
    ]);

    return () => {
      mountedRef.current = false;

      // Only cleanup socket if this is the last unmount
      if (socketRef.current?.cleanup) {
        socketRef.current.cleanup();
      }
      releaseSocket();
      initializedRef.current = false;
    };
  }, [initializeSocket, fetchBalance]);

  // When authentication state changes to authenticated, (re-)initialize socket and refresh balance
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        await initializeSocket();
      } catch {}
      try {
        await fetchBalance();
      } catch {}
    })();
  }, [isAuthenticated, initializeSocket, fetchBalance]);

  // Manual refresh function
  const refreshBalance = useCallback(async () => {
    setIsLoading(true);
    await fetchBalance();
  }, [fetchBalance]);

  const value = {
    balanceSeconds,
    balanceRupees: secondsToRupees(balanceSeconds),
    formattedBalance: formatRupees(secondsToRupees(balanceSeconds)),
    isUserRole,
    isLoading,
    error,
    refreshBalance,
    secondsToRupees,
    formatRupees,
  };

  return (
    <WalletBalanceContext.Provider value={value}>
      {children}
    </WalletBalanceContext.Provider>
  );
};

export default WalletBalanceProvider;
