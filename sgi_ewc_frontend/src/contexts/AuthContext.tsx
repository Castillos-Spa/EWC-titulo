import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, getProfile, logoutUser } from '../utils/userApi';
import { User } from '../types/User';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
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
      // El backend devuelve access_token y refresh_token
      const { access_token, refresh_token } = await apiLogin(email, password);
      if (!access_token || !refresh_token) {
        throw new Error('No se recibieron los tokens necesarios');
      }

      localStorage.setItem('authToken', access_token);
      localStorage.setItem('refreshToken', refresh_token); // ¡Guardar el refresh token!
      // Obtener perfil desde backend
      const profile = await getProfile();
       // Asegurarnos de que el área se incluya en los roles si existe
    const roles = profile.roles ?? [];
    if (profile.area && !roles.includes(profile.area)) {
      roles.push(profile.area);
    }
      // mapear/normalizar si es necesario (ejemplo mínimo)
      const mapped = {
        id: profile.id ?? profile.userId ?? profile.sub ?? 0,
        username: profile.username ?? profile.email?.split('@')[0] ?? '',
        email: profile.email,
        area: profile.area ?? undefined,
        roles: roles ?? [],
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

  const logout = useCallback(async () => {
    try {
      // Llama al backend para invalidar la sesión en el servidor.
      await logoutUser();
    } catch (error) {
      // Incluso si la llamada a la API falla, el logout del frontend debe continuar.
      console.error("Fallo al cerrar sesión en el servidor:", error);
    } finally {
      // Limpia los tokens y el estado local sin importar el resultado de la API.
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      setUser(null);
    }
  }, []);

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