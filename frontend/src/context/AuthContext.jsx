import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await client.get('/auth/me');
          setUser(res.data.data);
        } catch (error) {
          console.error('Failed to restore auth user session:', error.message);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await client.post('/auth/login', { email, password });
      const { token, ...userData } = res.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Invalid credentials.';
      return { success: false, message };
    }
  };

  const signup = async (name, email, password, role = 'user') => {
    try {
      const res = await client.post('/auth/signup', { name, email, password, role });
      const { token, ...userData } = res.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped in AuthProvider');
  }
  return context;
};
