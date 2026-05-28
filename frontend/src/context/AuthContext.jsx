import React, { createContext, useEffect, useState } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('emp_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data && res.data.require2FA) {
        return res.data;
      }
      const { token, user: u } = res.data;
      localStorage.setItem('emp_token', token);
      localStorage.setItem('emp_user', JSON.stringify(u));
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const signup = async payload => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', payload);
      const { token, user: u } = res.data;
      localStorage.setItem('emp_token', token);
      localStorage.setItem('emp_user', JSON.stringify(u));
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('emp_user', JSON.stringify(updated));
  };

  const value = { user, loading, login, signup, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

