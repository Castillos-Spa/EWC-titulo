import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../utils/api';
import { User } from '../types/User';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mocks eliminados — ahora usamos datos reales del backend

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData && userData !== 'undefined') {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        setUser(null);
        localStorage.removeItem('userData');
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await apiLogin(email, password); // { access_token }
      const token = result?.access_token;
      if (!token) throw new Error('No token received');
      localStorage.setItem('authToken', token);
      // Obtener perfil desde backend
      const profile = await getProfile();
      // mapear/normalizar si es necesario (ejemplo mínimo)
      const mapped = {
        id: profile.id ?? profile.userId ?? profile.sub ?? 0,
        username: profile.username ?? profile.email?.split('@')[0] ?? '',
        email: profile.email,
        area: profile.area ?? undefined,
        roles: profile.roles ?? [],
        permissions: profile.permissions ?? [],
        active: profile.active ?? true, // <-- aquí
        name: profile.username ?? profile.email?.split('@')[0],
        mustChangePassword: profile.mustChangePassword ?? false,
      } as User;
      localStorage.setItem('userData', JSON.stringify(mapped));
      setUser(mapped);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};