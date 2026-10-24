import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  // Initialize and verify authentication state on startup
  useEffect(() => {
    mountedRef.current = true;
    let isCancelled = false;

    // Fast-fail safety timer: Ensures the UI never hangs indefinitely in a loading state
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current && !isCancelled) {
        setLoading(false);
      }
    }, 2500);

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');

      try {
        if (storedToken) {
          // Attempt verification via getMe(); if expired, Axios interceptor automatically attempts silent refresh
          try {
            const response = await authService.getMe();
            if (mountedRef.current && !isCancelled && response.data?.user) {
              setUser(response.data.user);
              const activeToken = localStorage.getItem('token') || response.data?.token || storedToken;
              setToken(activeToken);
              setLoading(false);
              clearTimeout(safetyTimeout);
              return;
            }
          } catch {
            // getMe failed and silent refresh via interceptor also failed
          }
        } else {
          // If no access token in localStorage, attempt restoration via HttpOnly refresh cookie
          try {
            const refreshRes = await authService.refreshToken();
            if (mountedRef.current && !isCancelled && refreshRes.data?.token) {
              const newToken = refreshRes.data.token;
              localStorage.setItem('token', newToken);
              setToken(newToken);
              setUser(refreshRes.data.user);
              setLoading(false);
              clearTimeout(safetyTimeout);
              return;
            }
          } catch {
            // No valid refresh token
          }
        }

        // Neither token was valid; purge unauthenticated state
        if (mountedRef.current && !isCancelled) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session initialization encountered an error:', err.message);
        if (mountedRef.current && !isCancelled) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mountedRef.current && !isCancelled) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password) => {
    const response = await authService.register({ name, email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout notification failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
