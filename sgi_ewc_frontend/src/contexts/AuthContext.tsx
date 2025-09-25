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

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const profile = await getProfile();
        // Reutilizamos la misma lógica de normalización que en el login
        const normalizedUser = normalizeProfile(profile);
        setUser(normalizedUser);
      } catch (error) {
        console.error("Fallo al verificar el token, cerrando sesión local.", error);
        await logout(); // Limpia todo si el token no es válido
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

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
      const mapped = normalizeProfile(profile);
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

/**
 * Normaliza el perfil de usuario recibido del backend a la estructura `User` del frontend.
 */
function normalizeProfile(profile: any): User {
  // El backend puede devolver 'userId' (del token JWT) o 'id' (de la base de datos).
  const userId = profile.id ?? profile.userId;
  if (!userId) {
    throw new Error('El perfil de usuario obtenido no es válido o no contiene un ID (id/userId).');
  }

  // Normalizar áreas a arreglo de strings
  let areas: string[] = [];
  if (Array.isArray(profile.area)) {
    areas = profile.area as string[];
  } else if (profile.area) {
    areas = [profile.area as string];
  }

  // Unificar roles + áreas en una sola lista de roles únicos
  const normalizedRoles = Array.from(new Set([...(profile.roles ?? []), ...areas]));

  return {
    id: userId,
    username: profile.username ?? profile.email?.split('@')[0] ?? '',
    email: profile.email,
    area: areas, // <-- Mantenemos el array de áreas
    roles: normalizedRoles,
    permissions: profile.permissions ?? [],
    active: profile.active ?? true,
    mustChangePassword: profile.mustChangePassword ?? false,
  } as User;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};