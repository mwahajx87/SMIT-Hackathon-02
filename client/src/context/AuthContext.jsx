import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hcm_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem('hcm_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('hcm_token');
      if (token && token !== 'undefined') {
        try {
          const profile = await apiRequest('/auth/me');
          setUser(profile);
          localStorage.setItem('hcm_user', JSON.stringify(profile));
        } catch (err) {
          localStorage.removeItem('hcm_token');
          localStorage.removeItem('hcm_user');
          setUser(null);
        }
      }
      setLoading(false);
    }

    loadUser();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('hcm_token', data.token);
    localStorage.setItem('hcm_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('hcm_token');
    localStorage.removeItem('hcm_user');
    setUser(null);
  };

  const updateUser = (updater) => {
    setUser((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next) {
        localStorage.setItem('hcm_user', JSON.stringify(next));
      } else {
        localStorage.removeItem('hcm_user');
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
