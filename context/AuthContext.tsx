import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import api, { setLogoutHandler } from '../services/api';
import * as SecureStore from 'expo-secure-store';

interface User {
  id?: string | number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'user';
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any, isSignUp?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register global logout handler for 401 errors
    setLogoutHandler(() => logout());

    const checkUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          const response = await api.get('/auth/');
          setUser(response.data.user || response.data);
        }
      } catch (error) {
        console.log('No valid session found');
        await SecureStore.deleteItemAsync('userToken');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (credentials: any, isSignUp: boolean = false) => {
    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const response = await api.post(endpoint, credentials);
      const { token, user: userData } = response.data;
      
      await SecureStore.setItemAsync('userToken', token);
      
      const role = userData?.role || 'member';
      const finalUser = { ...userData, role };
      setUser(finalUser);
      // Navigation is handled automatically by _layout.tsx when user state changes
    } catch (error: any) {
      console.error('Authentication failed:', error?.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    setUser(null);
    // Navigation is handled automatically by _layout.tsx
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
