import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';

// --- Data Structures ---
interface User {
  email: string;
}

interface UserObject {
  email: string;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
  isAdmin: boolean;
  approveUser: (email: string) => void;
  getAllUsers: () => UserObject[];
  createUserByAdmin: (email: string) => void;
  deleteUser: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'creator@fast.ai';
const USER_DB_KEY = 'fast-ai-user-database';

// --- Helper Functions ---

/**
 * Safely reads, parses, and validates the user database from localStorage.
 * @returns An array of UserObject.
 */
const getStoredUsers = (): UserObject[] => {
    try {
        const storedValue = localStorage.getItem(USER_DB_KEY);
        if (!storedValue) return [];
        
        const parsed = JSON.parse(storedValue);
        if (Array.isArray(parsed)) {
            // Filter out any invalid entries and normalize emails
            return parsed
                .filter(item => item && typeof item.email === 'string' && typeof item.isApproved === 'boolean')
                .map(user => ({
                    email: String(user.email).trim().toLowerCase(),
                    isApproved: user.isApproved
                }));
        }
    } catch (error) {
        console.error(`Error parsing ${USER_DB_KEY} from localStorage`, error);
    }
    return [];
};

/**
 * Safely saves the user database to localStorage.
 * @param users The array of UserObject to save.
 */
const setStoredUsers = (users: UserObject[]) => {
    localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
};


// --- AuthProvider Component ---

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 1. Restore logged-in user session
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

    // 2. Initialize and ensure admin user exists in the database
    let users = getStoredUsers();
    const adminExists = users.some(u => u.email === ADMIN_EMAIL);

    if (!adminExists) {
        users = [...users.filter(u => u.email !== ADMIN_EMAIL), { email: ADMIN_EMAIL, isApproved: true }];
        setStoredUsers(users);
    } else {
      // Ensure admin is always approved
      const admin = users.find(u => u.email === ADMIN_EMAIL);
      if (admin && !admin.isApproved) {
        users = users.map(u => u.email === ADMIN_EMAIL ? { ...u, isApproved: true } : u);
        setStoredUsers(users);
      }
    }
  }, []);

  const login = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    const users = getStoredUsers();
    
    const foundUser = users.find(u => u.email === normalizedEmail);

    if (!foundUser) {
      throw new Error('Account not found. Please contact the creator to create an account.');
    }

    if (!foundUser.isApproved) {
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
  
  const createUserByAdmin = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }
    
    const users = getStoredUsers();
    if (users.some(u => u.email === normalizedEmail)) {
      throw new Error('User with this email already exists.');
    }

    const newUser: UserObject = { email: normalizedEmail, isApproved: true };
    setStoredUsers([...users, newUser]);
  }, []);

  const approveUser = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) return;

    const users = getStoredUsers();
    const userExists = users.some(u => u.email === normalizedEmail);

    if (userExists) {
      // User exists, update their status
      const updatedUsers = users.map(u => 
        u.email === normalizedEmail ? { ...u, isApproved: true } : u
      );
      setStoredUsers(updatedUsers);
    } else {
      // User doesn't exist, create and approve them
      const newUser: UserObject = { email: normalizedEmail, isApproved: true };
      setStoredUsers([...users, newUser]);
    }
  }, []);

  const deleteUser = useCallback((email: string) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail === ADMIN_EMAIL) {
        throw new Error('Cannot delete the creator account.');
    }
    const updatedUsers = getStoredUsers().filter(u => u.email !== normalizedEmail);
    setStoredUsers(updatedUsers);
  }, []);

  const getAllUsers = useCallback((): UserObject[] => {
    return getStoredUsers().sort((a, b) => {
        // Sort by pending first, then alphabetically
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
