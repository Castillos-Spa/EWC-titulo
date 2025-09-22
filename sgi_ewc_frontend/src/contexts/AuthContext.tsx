import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
      } catch {
        setUser(null);
        localStorage.removeItem('userData');
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
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

      // El backend puede devolver 'userId' (del token JWT) o 'id' (de la base de datos).
      // Nos aseguramos de que al menos uno de los dos exista.
      const userId = profile.id ?? profile.userId;
      if (!userId) {
        throw new Error('El perfil de usuario obtenido no es válido o no contiene un ID (id/userId).');
      }

      // Normalizar áreas a arreglo de strings
      let areas: string[] = [];
      if (Array.isArray(profile.area)) {
        areas = profile.area as unknown as string[];
      } else if (profile.area) {
        areas = [profile.area as unknown as string];
      }

      // Unificar roles + áreas en una sola lista de roles únicos
      const normalizedRoles = Array.from(
        new Set([...(profile.roles ?? []), ...areas])
      );

      // mapear/normalizar si es necesario (ejemplo mínimo)
      const mapped = {
        id: userId,
        username: profile.username ?? profile.email?.split('@')[0] ?? '',
        email: profile.email,
        // Mantener `area` como string para compatibilidad (tomar primera si hay varias)
        area: areas[0] ?? undefined,
        roles: normalizedRoles,
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
  }, []);

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

  const contextValue = useMemo(
    () => ({ user, login, logout, isLoading }),
    [user, login, logout, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
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