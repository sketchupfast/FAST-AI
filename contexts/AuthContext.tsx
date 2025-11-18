import React, { createContext } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};
