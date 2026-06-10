import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  PROJECT_MANAGER: 'project_manager',
  DEVELOPER: 'developer',
  TESTER: 'tester',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  org_admin: 'Organization Admin',
  project_manager: 'Project Manager',
  developer: 'Developer',
  tester: 'Tester',
  viewer: 'Viewer',
};

export const ROLE_HIERARCHY = ['viewer', 'tester', 'developer', 'project_manager', 'org_admin', 'super_admin'];

export const canManageRole = (actorRole, targetRole) => {
  return ROLE_HIERARCHY.indexOf(actorRole) > ROLE_HIERARCHY.indexOf(targetRole);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else setLoading(false);
  }, [fetchUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); }
    catch {} finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return ROLE_HIERARCHY.indexOf(user.role) >= ROLE_HIERARCHY.indexOf(role);
  };

  const isAtLeast = (role) => {
    if (!user) return false;
    return ROLE_HIERARCHY.indexOf(user.role) >= ROLE_HIERARCHY.indexOf(role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser, hasRole, isAtLeast }}>
      {children}
    </AuthContext.Provider>
  );
};