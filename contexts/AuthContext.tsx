import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
  signupPending: boolean;
  setSignupPending: React.Dispatch<React.SetStateAction<boolean>>;
  isAdmin: boolean;
  approveUser: (email: string) => void;
  getAllUsers: () => { email: string; isApproved: boolean }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'creator@fast.ai';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [signupPending, setSignupPending] = useState(false);

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

    // Initialize user lists if they don't exist, and ensure the admin/creator is always present and approved.
    if (!localStorage.getItem('fast-ai-users')) {
      localStorage.setItem('fast-ai-users', JSON.stringify([ADMIN_EMAIL]));
    }
    if (!localStorage.getItem('fast-ai-approved-users')) {
      localStorage.setItem('fast-ai-approved-users', JSON.stringify([ADMIN_EMAIL]));
    }

  }, []);

  const login = useCallback((email: string) => {
    const users = JSON.parse(localStorage.getItem('fast-ai-users') || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem('fast-ai-approved-users') || '[]');

    // In a real app, password would be checked here.
    if (!users.includes(email)) {
      throw new Error('User not found. Please sign up first.');
    }

    if (!approvedUsers.includes(email)) {
      throw new Error('Your account is still pending approval.');
    }
    
    const newUser = { email };
    localStorage.setItem('fast-ai-user', JSON.stringify(newUser));
    setUser(newUser);
    setSignupPending(false);
  }, []);
  
  const signup = useCallback((email: string) => {
    const users = JSON.parse(localStorage.getItem('fast-ai-users') || '[]');
    if (users.includes(email)) {
        throw new Error('An account with this email already exists.');
    }
    users.push(email);
    localStorage.setItem('fast-ai-users', JSON.stringify(users));
    setSignupPending(true); // Signal to UI to show pending message
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fast-ai-user');
    setUser(null);
  }, []);

  const approveUser = useCallback((email: string) => {
    const approvedUsers = JSON.parse(localStorage.getItem('fast-ai-approved-users') || '[]');
    if (!approvedUsers.includes(email)) {
        approvedUsers.push(email);
        localStorage.setItem('fast-ai-approved-users', JSON.stringify(approvedUsers));
    }
  }, []);

  const getAllUsers = useCallback(() => {
    const users = JSON.parse(localStorage.getItem('fast-ai-users') || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem('fast-ai-approved-users') || '[]');
    return users
      .map((email: string) => ({
          email,
          isApproved: approvedUsers.includes(email),
      }))
      .filter((u: {email: string}) => u.email !== ADMIN_EMAIL); // Don't show admin in the list
  }, []);

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isAdmin: user?.email === ADMIN_EMAIL,
    login,
    signup,
    logout,
    signupPending,
    setSignupPending,
    approveUser,
    getAllUsers,
  }), [user, signupPending, login, signup, logout, approveUser, getAllUsers]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
