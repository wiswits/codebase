import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = 'http://localhost:5000/api/v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('token', userData.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, full_name, role) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { email, password, full_name, role });
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('token', userData.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}