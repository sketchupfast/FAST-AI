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

// Helper to safely read, parse, and normalize string arrays from localStorage.
// This ensures data is always consistent and lowercase.
const getStoredArray = (key: string): string[] => {
    try {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) return [];
        
        const parsed = JSON.parse(storedValue);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            return parsed.map(email => String(email).toLowerCase()); // Always return lowercase
        }
    } catch (error) {
        console.error(`Error parsing ${key} from localStorage`, error);
    }
    // Return an empty array on error, or if the data is not found or has an invalid format.
    return [];
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [signupPending, setSignupPending] = useState(false);

  useEffect(() => {
    // Restore user session from localStorage on initial load
    const storedUser = localStorage.getItem('fast-ai-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser.email === 'string') {
            // Ensure the user session email is also normalized
            setUser({ email: String(parsedUser.email).toLowerCase() });
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('fast-ai-user');
      }
    }

    // Initialize and sanitize user data stores to ensure integrity
    const users = getStoredArray('fast-ai-users');
    const approvedUsers = getStoredArray('fast-ai-approved-users');
    
    let usersModified = false;
    if (!users.includes(ADMIN_EMAIL)) {
        users.push(ADMIN_EMAIL);
        usersModified = true;
    }
    
    let approvedModified = false;
    if (!approvedUsers.includes(ADMIN_EMAIL)) {
        approvedUsers.push(ADMIN_EMAIL);
        approvedModified = true;
    }

    // This also serves as a data migration step to ensure all stored emails are lowercase.
    // It rewrites the stored data only if modifications were necessary.
    if (usersModified) {
        localStorage.setItem('fast-ai-users', JSON.stringify(users));
    }
    if (approvedModified) {
        localStorage.setItem('fast-ai-approved-users', JSON.stringify(approvedUsers));
    }
  }, []);

  const login = useCallback((email: string) => {
    const normalizedEmail = String(email).toLowerCase();
    const users = getStoredArray('fast-ai-users');
    const approvedUsers = getStoredArray('fast-ai-approved-users');

    if (!users.includes(normalizedEmail)) {
      throw new Error('User not found. Please sign up first.');
    }

    if (!approvedUsers.includes(normalizedEmail)) {
      throw new Error('Your account is still pending approval.');
    }
    
    const newUser = { email: normalizedEmail };
    localStorage.setItem('fast-ai-user', JSON.stringify(newUser));
    setUser(newUser);
    setSignupPending(false);
  }, []);
  
  const signup = useCallback((email: string) => {
    const normalizedEmail = String(email).toLowerCase();
    const users = getStoredArray('fast-ai-users');
    if (users.includes(normalizedEmail)) {
        throw new Error('An account with this email already exists.');
    }
    users.push(normalizedEmail);
    localStorage.setItem('fast-ai-users', JSON.stringify(users));
    setSignupPending(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fast-ai-user');
    setUser(null);
  }, []);

  const approveUser = useCallback((email: string) => {
    const normalizedEmail = String(email).toLowerCase();
    const approvedUsers = getStoredArray('fast-ai-approved-users');
    if (!approvedUsers.includes(normalizedEmail)) {
        approvedUsers.push(normalizedEmail);
        localStorage.setItem('fast-ai-approved-users', JSON.stringify(approvedUsers));
    }
  }, []);

  const getAllUsers = useCallback(() => {
    const users = getStoredArray('fast-ai-users');
    const approvedUsers = getStoredArray('fast-ai-approved-users');
    return users
      .filter((email) => email !== ADMIN_EMAIL) // Don't show admin in the list
      .map((email) => ({
          email,
          // This comparison is now guaranteed to be case-insensitive and reliable
          isApproved: approvedUsers.includes(email),
      }));
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
