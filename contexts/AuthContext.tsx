
import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, UserRole } from '../types';
import { useConfig } from './ConfigContext';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  token: string | null;
 codex/implementar-renovacion-de-token
  login: (username: string, role: UserRole) => void;
  login: (user: User, token: string) => void;
main
  logout: () => void;
  renewToken: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const expiryTimeoutRef = useRef<number>();

  const scheduleExpiry = (expiresAt: number) => {
    if (expiryTimeoutRef.current) {
      window.clearTimeout(expiryTimeoutRef.current);
    }
    const timeout = expiresAt - Date.now();
    if (timeout > 0) {
      expiryTimeoutRef.current = window.setTimeout(() => {
        logger.log('Session expired');
        logout();
      }, timeout);
    }
  };

  useEffect(() => {
    // Simulate checking for an existing session
    try {
      const storedUser = localStorage.getItem('authUser');
      const storedToken = localStorage.getItem('authToken');
      if (storedUser && storedToken) {
codex/implementar-renovacion-de-token
        const parsedUser = JSON.parse(storedUser);
        const parsedToken = JSON.parse(storedToken);
        if (
          parsedToken.token &&
          typeof parsedToken.expiresAt === 'number' &&
          Date.now() < parsedToken.expiresAt
        ) {
          setUser(parsedUser);
          setToken(parsedToken.token);
          scheduleExpiry(parsedToken.expiresAt);
        } else {
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
        }

        setUser(JSON.parse(storedUser));
        setToken(storedToken);
main
      }
    } catch (error) {
      logger.error('Failed to parse auth session from localStorage', error);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
    setLoading(false);
  }, []);

 codex/implementar-renovacion-de-token
  const login = (username: string, role: UserRole) => {
    const userData: User = { id: Date.now().toString(), username, role };
    const newToken = Math.random().toString(36).substring(2);
    const expiresAt = Date.now() + config.sessionTimeoutMinutes * 60 * 1000;
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    localStorage.setItem('authToken', JSON.stringify({ token: newToken, expiresAt }));
    scheduleExpiry(expiresAt);
  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    localStorage.setItem('authToken', authToken);
 main
  };

  const logout = () => {
    setUser(null);
    setToken(null);
 codex/implementar-renovacion-de-token
    if (expiryTimeoutRef.current) {
      window.clearTimeout(expiryTimeoutRef.current);
    }
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  };

  const renewToken = () => {
    if (!token) return;
    const expiresAt = Date.now() + config.sessionTimeoutMinutes * 60 * 1000;
    localStorage.setItem('authToken', JSON.stringify({ token, expiresAt }));
    scheduleExpiry(expiresAt);
    logger.log('Session renewed');

    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
main
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-neutral-light"><p>Cargando sesión...</p></div>;
  }

  return (
codex/implementar-renovacion-de-token
    <AuthContext.Provider value={{ user, token, login, logout, renewToken, loading }}>
=======
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
 main
      {children}
    </AuthContext.Provider>
  );
};
