import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../api/client';
import type { LoginRequest, LoginResponse } from '../types';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
  }));

  const isAuthenticated = !!auth.token;

  const login = useCallback(async (credentials: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    setAuth({
      token: data.token,
      username: data.username,
      role: data.role,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setAuth({ token: null, username: null, role: null });
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuth({ token: null, username: null, role: null });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
