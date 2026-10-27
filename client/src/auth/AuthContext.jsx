import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('capdex_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('capdex_token');
      const storedUser = localStorage.getItem('capdex_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with /api/auth/me
          const res = await axiosClient.get('/auth/me');
          if (res.data && res.data.data) {
            if (res.data.data.is_laid_off) {
              sessionStorage.setItem('capdex_laid_off_user', JSON.stringify(res.data.data));
              logout();
              window.location.href = '/laid-off';
              return;
            }
            setUser(res.data.data);
            localStorage.setItem('capdex_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    
    if (res.data?.data?.isLaidOff) {
      const laidOffUser = res.data.data.user;
      sessionStorage.setItem('capdex_laid_off_user', JSON.stringify(laidOffUser));
      return { isLaidOff: true, user: laidOffUser };
    }

    const { token: newToken, user: newUser } = res.data.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('capdex_token', newToken);
    localStorage.setItem('capdex_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await axiosClient.post('/auth/logout');
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('capdex_token');
      localStorage.removeItem('capdex_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.data && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('capdex_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
