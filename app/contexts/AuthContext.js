import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthStorage } from '../utils/authStorage';
import { forceCloseSocket } from '../lib/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      setAuthLoading(true);
      const [storedToken, storedUser] = await Promise.all([
        AuthStorage.getToken(),
        AuthStorage.getUser(),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      } else {
        setToken(null);
        setUser(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (newToken, newUser) => {
    await AuthStorage.saveAuthData(newToken, newUser);
    // Ensure any pre-existing socket using a stale/anonymous token is closed
    try { forceCloseSocket(); } catch {}
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await AuthStorage.clearAuthData();
    // Immediately close socket to revoke access and avoid ghost listeners
    try { forceCloseSocket(); } catch {}
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    authLoading,
    isAuthenticated: !!token,
    roleId: user?.role_id,
    login,
    logout,
    restoreSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
