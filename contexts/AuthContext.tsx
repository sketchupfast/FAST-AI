import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
  isAdmin: boolean;
  approveUser: (email: string) => void;
  getAllUsers: () => { email: string; isApproved: boolean }[];
  createUserByAdmin: (email: string) => void;
  deleteUser: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'creator@fast.ai';

// Helper to safely read, parse, and normalize string arrays from localStorage.
const getStoredArray = (key: string): string[] => {
    try {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) return [];
        
        const parsed = JSON.parse(storedValue);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            // Trim and convert to lowercase for robust matching
            return parsed.map(email => String(email).trim().toLowerCase());
        }
    } catch (error) {
        console.error(`Error parsing ${key} from localStorage`, error);
    }
    return [];
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore user session from localStorage on initial load
    const storedUser = localStorage.getItem('fast-ai-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser.email === 'string') {
            setUser({ email: String(parsedUser.email).trim().toLowerCase() });
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('fast-ai-user');
      }
    }

    // Initialize and sanitize user data stores to ensure integrity using immutable patterns
    let users = getStoredArray('fast-ai-users');
    let approvedUsers = getStoredArray('fast-ai-approved-users');
    
    let usersModified = false;
    if (!users.includes(ADMIN_EMAIL)) {
        users = [...users, ADMIN_EMAIL]; // Use immutable spread
        usersModified = true;
    }
    
    let approvedModified = false;
    if (!approvedUsers.includes(ADMIN_EMAIL)) {
        approvedUsers = [...approvedUsers, ADMIN_EMAIL]; // Use immutable spread
        approvedModified = true;
    }

    if (usersModified) {
        localStorage.setItem('fast-ai-users', JSON.stringify(users));
    }
    if (approvedModified) {
        localStorage.setItem('fast-ai-approved-users', JSON.stringify(approvedUsers));
    }
  }, []);

  const login = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    
    const users = getStoredArray('fast-ai-users');
    const approvedUsers = getStoredArray('fast-ai-approved-users');

    if (!users.includes(normalizedEmail)) {
      throw new Error('Account not found. Please contact the creator to create an account.');
    }

    if (!approvedUsers.includes(normalizedEmail)) {
      throw new Error('Your account is not approved. Please contact the creator.');
    }
    
    const newUser = { email: normalizedEmail };
    localStorage.setItem('fast-ai-user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fast-ai-user');
    setUser(null);
  }, []);

  const approveUser = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) return;

    // --- Update Approved Users List ---
    const currentApproved = getStoredArray('fast-ai-approved-users');
    if (!currentApproved.includes(normalizedEmail)) {
      const newApproved = [...currentApproved, normalizedEmail];
      localStorage.setItem('fast-ai-approved-users', JSON.stringify(newApproved));
    }

    // --- Update Main Users List for consistency ---
    const currentUsers = getStoredArray('fast-ai-users');
    if (!currentUsers.includes(normalizedEmail)) {
      const newUsers = [...currentUsers, normalizedEmail];
      localStorage.setItem('fast-ai-users', JSON.stringify(newUsers));
    }
  }, []);

  const createUserByAdmin = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }
    
    const users = getStoredArray('fast-ai-users');
    if (users.includes(normalizedEmail)) {
      throw new Error('User with this email already exists.');
    }

    const newUsers = [...users, normalizedEmail];
    localStorage.setItem('fast-ai-users', JSON.stringify(newUsers));

    approveUser(normalizedEmail);
  }, [approveUser]);

  const deleteUser = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail === ADMIN_EMAIL) {
        throw new Error('Cannot delete the creator account.');
    }

    const newUsers = getStoredArray('fast-ai-users').filter(u => u !== normalizedEmail);
    localStorage.setItem('fast-ai-users', JSON.stringify(newUsers));
    
    const newApprovedUsers = getStoredArray('fast-ai-approved-users').filter(u => u !== normalizedEmail);
    localStorage.setItem('fast-ai-approved-users', JSON.stringify(newApprovedUsers));
  }, []);

  const getAllUsers = useCallback((): { email: string; isApproved: boolean }[] => {
    const users = getStoredArray('fast-ai-users');
    const approvedUsers = getStoredArray('fast-ai-approved-users');
    
    return users.map(email => ({
      email,
      isApproved: approvedUsers.includes(email)
    })).sort((a, b) => {
        if (a.isApproved !== b.isApproved) {
            return a.isApproved ? 1 : -1;
        }
        return a.email.localeCompare(b.email);
    });
  }, []);

  const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);
  
  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    login,
    logout,
    isAdmin,
    approveUser,
    getAllUsers,
    createUserByAdmin,
    deleteUser,
  }), [user, login, logout, isAdmin, approveUser, getAllUsers, createUserByAdmin, deleteUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
