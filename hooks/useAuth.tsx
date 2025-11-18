
import React, { createContext, useContext, useState, useMemo } from 'react';
import type { User } from '../types';
import { login as apiLogin, logout as apiLogout } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, pass: string) => {
    try {
      const loggedInUser = await apiLogin(username, pass);
      setUser(loggedInUser);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const value = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    login,
    logout,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
