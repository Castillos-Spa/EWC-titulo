import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, getProfile, logoutUser } from '../utils/userApi';
import type {
  User,
  ClientAuthSession,
  TenantSummary,
  TenantCompany,
  BackendModuleKey,
} from '../types/User';
import { loadAuthSession, saveAuthSession, clearAuthSession } from '../utils/authSessionStorage';

interface AuthContextType {
  session: ClientAuthSession | null;
  user: User | null;
  tenant: TenantSummary | null;
  companyId: number | null;
  companies: TenantCompany[];
  modules: BackendModuleKey[];
  login: (
    email: string,
    password: string,
    tenantSlug: string,
    companyId?: number | null,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildSessionFromProfile = (
  profile: User,
  base: ClientAuthSession | null,
): ClientAuthSession => ({
  user: profile,
  tenant: base?.tenant ?? null,
  companyId: profile.companyId ?? base?.companyId ?? null,
  companies: base?.companies ?? [],
  modules: profile.modules ?? base?.modules ?? [],
  tenantModules: profile.tenantModules ?? base?.tenantModules ?? base?.modules ?? [],
  restrictedModules: profile.restrictedModules ?? base?.restrictedModules ?? [],
  moduleMap: profile.moduleMap ?? base?.moduleMap ?? undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ClientAuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((next: ClientAuthSession | null) => {
    if (next) {
      saveAuthSession(next);
      setSession(next);
    } else {
      clearAuthSession();
      setSession(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Fallo al cerrar sesión en el servidor:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      applySession(null);
    }
  }, [applySession]);

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    const storedSession = loadAuthSession();
    if (storedSession) {
      setSession(storedSession);
    }

    if (!token) {
      applySession(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getProfile();
      const mergedSession = buildSessionFromProfile(profile, storedSession);
      applySession(mergedSession);
    } catch (error) {
      console.error('Fallo al verificar el token, cerrando sesión local.', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  }, [applySession, logout]);

  useEffect(() => {
    void loadUserFromToken();

    const handleSessionExpired = () => {
      void logout();
    };

    const handleSessionRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<ClientAuthSession | undefined>).detail;
      if (detail) {
        applySession(detail);
      } else {
        void loadUserFromToken();
      }
    };

    globalThis.addEventListener?.('session-expired', handleSessionExpired);
    globalThis.addEventListener?.('session-refreshed', handleSessionRefreshed);

    return () => {
      globalThis.removeEventListener?.('session-expired', handleSessionExpired);
      globalThis.removeEventListener?.('session-refreshed', handleSessionRefreshed);
    };
  }, [applySession, loadUserFromToken, logout]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      tenantSlug: string,
      requestedCompanyId?: number | null,
    ): Promise<boolean> => {
      setIsLoading(true);
      try {
        const {
          access_token,
          refresh_token,
          user: loggedInUser,
          tenant,
          companyId: responseCompanyId,
          companies,
          modules,
          tenantModules,
          restrictedModules,
          moduleMap,
        } = await apiLogin(email, password, tenantSlug, requestedCompanyId);

        if (!access_token || !refresh_token || !loggedInUser) {
          throw new Error('No se recibieron los tokens necesarios');
        }

        localStorage.setItem('authToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);

        let normalizedModules: BackendModuleKey[] = [];
        if (Array.isArray(modules)) {
          normalizedModules = modules;
        } else if (Array.isArray(loggedInUser.modules)) {
          normalizedModules = loggedInUser.modules;
        }

        let normalizedTenantModules: BackendModuleKey[] = [];
        if (Array.isArray(tenantModules)) {
          normalizedTenantModules = tenantModules;
        } else if (Array.isArray(loggedInUser.tenantModules)) {
          normalizedTenantModules = loggedInUser.tenantModules;
        } else {
          normalizedTenantModules = normalizedModules;
        }

        let normalizedRestrictedModules: BackendModuleKey[] = [];
        if (Array.isArray(restrictedModules)) {
          normalizedRestrictedModules = restrictedModules;
        } else if (Array.isArray(loggedInUser.restrictedModules)) {
          normalizedRestrictedModules = loggedInUser.restrictedModules;
        }

        const nextSession: ClientAuthSession = {
          user: loggedInUser,
          tenant: tenant ?? null,
          companyId: responseCompanyId ?? requestedCompanyId ?? null,
          companies: Array.isArray(companies) ? companies : [],
          modules: normalizedModules,
          tenantModules: normalizedTenantModules,
          restrictedModules: normalizedRestrictedModules,
          moduleMap: moduleMap ?? loggedInUser.moduleMap ?? undefined,
        };

        applySession(nextSession);

        try {
          if (tenantSlug) {
            localStorage.setItem('lastTenantSlug', tenantSlug);
          }
        } catch (storageError) {
          console.warn('No se pudo persistir el último tenant utilizado', storageError);
        }

        setIsLoading(false);
        return true;
      } catch (err) {
        console.error('Login error', err);
        setIsLoading(false);
        return false;
      }
    },
    [applySession],
  );

  const contextValue = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      tenant: session?.tenant ?? null,
      companyId: session?.companyId ?? null,
      companies: session?.companies ?? [],
      modules: session?.modules ?? [],
      login,
      logout,
      isLoading,
    }),
    [session, login, logout, isLoading],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};