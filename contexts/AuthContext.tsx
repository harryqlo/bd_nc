import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, UserRole } from '../types';
import { useConfig } from './ConfigContext';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, role: UserRole) => void;
  login: (user: User, token: string) => void;
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
    try {
      const storedUser = localStorage.getItem('authUser');
      const storedToken = localStorage.getItem('authToken');
      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        const parsedToken: { token: string; expiresAt: number } = JSON.parse(storedToken);
        if (parsedToken.token && typeof parsedToken.expiresAt === 'number' && Date.now() < parsedToken.expiresAt) {
          setUser(parsedUser);
          setToken(parsedToken.token);
          scheduleExpiry(parsedToken.expiresAt);
        } else {
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      logger.error('Failed to parse auth session from localStorage', error);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
    setLoading(false);
  }, [config.sessionTimeoutMinutes]);

  function login(username: string, role: UserRole): void;
  function login(user: User, token: string): void;
  function login(userOrUsername: User | string, tokenOrRole: string | UserRole): void {
    if (typeof userOrUsername === 'string') {
      const username = userOrUsername;
      const role = tokenOrRole as UserRole;
      const userData: User = { id: Date.now().toString(), username, role };
      const newToken = Math.random().toString(36).substring(2);
      const expiresAt = Date.now() + config.sessionTimeoutMinutes * 60 * 1000;
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('authUser', JSON.stringify(userData));
      localStorage.setItem('authToken', JSON.stringify({ token: newToken, expiresAt }));
      scheduleExpiry(expiresAt);
    } else {
      const userData = userOrUsername as User;
      const authToken = tokenOrRole as string;
      const expiresAt = Date.now() + config.sessionTimeoutMinutes * 60 * 1000;
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('authUser', JSON.stringify(userData));
      localStorage.setItem('authToken', JSON.stringify({ token: authToken, expiresAt }));
      scheduleExpiry(expiresAt);
    }
  }

  const logout = () => {
    setUser(null);
    setToken(null);
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
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-neutral-light"><p>Cargando sesión...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, renewToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
