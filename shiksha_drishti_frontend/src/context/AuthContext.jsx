import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sd_token'));
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token: newToken, user: newUser, assignments: newAssignments } = res.data;
    localStorage.setItem('sd_token', newToken);
    localStorage.setItem('sd_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setAssignments(newAssignments || []);
    return newUser;
  }, []);


  const clearSession = useCallback(() => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
    setToken(null);
    setUser(null);
    setAssignments([]);
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('sd_token');
      if (currentToken) {
        await authApi.logout();
      }
    } catch {
      /* ignore */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Refresh user profile + assignments
  const refreshMe = useCallback(async () => {
    const currentToken = localStorage.getItem('sd_token');
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      setAssignments(res.data.assignments || []);
      localStorage.setItem('sd_user', JSON.stringify(res.data.user));
    } catch (err) {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  // Listen for unauthorized events
  useEffect(() => {
    const handler = () => clearSession();
    window.addEventListener('sd:unauthorized', handler);
    return () => window.removeEventListener('sd:unauthorized', handler);
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, token, assignments, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
