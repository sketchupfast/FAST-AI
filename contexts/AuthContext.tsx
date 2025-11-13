
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for a logged-in user on initial load
    const storedUser = localStorage.getItem('fast-ai-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('fast-ai-user');
      }
    }
  }, []);

  const login = (email: string) => {
    // In a real app, you'd verify credentials against a backend
    // For this simulation, we'll just set the user
    const newUser = { email };
    localStorage.setItem('fast-ai-user', JSON.stringify(newUser));
    setUser(newUser);
  };
  
  const signup = (email: string) => {
    // In this simulation, signup and login do the same thing.
    // A real app would create a new user record in the backend.
    const newUser = { email };
    localStorage.setItem('fast-ai-user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('fast-ai-user');
    setUser(null);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
