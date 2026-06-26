'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  token: string | null;
  user: any | null;
}

interface AuthContextType {
  token: string | null;
  user: any | null;
  isAdmin: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAdmin: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load auth from local storage on mount
    const storedToken = localStorage.getItem('jwt');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setAuthState({ token: storedToken, user: JSON.parse(storedUser) });
      } catch (e) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
    }
    setMounted(true);
  }, []);

  const login = (token: string, user: any) => {
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ token, user });
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setAuthState({ token: null, user: null });
  };

  const isAdmin = !!authState.user; // For now, any logged-in user is considered an admin

  // Prevent hydration mismatch on initial render with auth state
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ ...authState, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
