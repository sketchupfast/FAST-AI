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
// This ensures data is always consistent, trimmed, and lowercase.
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
    // Return an empty array on error, or if the data is not found or has an invalid format.
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
            // Ensure the user session email is also normalized
            setUser({ email: String(parsedUser.email).trim().toLowerCase() });
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

    // This also serves as a data migration step to ensure all stored emails are trimmed and lowercase.
    // It rewrites the stored data only if modifications were necessary.
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
    
    // If we reach here, user exists and is approved.
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
    
    // First, handle the approved list, which is the primary goal.
    const approvedUsers = getStoredArray('fast-ai-