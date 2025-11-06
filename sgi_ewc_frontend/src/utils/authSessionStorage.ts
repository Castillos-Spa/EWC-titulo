import type { ClientAuthSession } from "../types/User";

const STORAGE_KEY = "authSession";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getStorage = (): StorageLike | null => {
  try {
    return globalThis?.localStorage ?? null;
  } catch {
    return null;
  }
};

export const loadAuthSession = (): ClientAuthSession | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ClientAuthSession | null;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      user: parsed.user,
      tenant: parsed.tenant ?? null,
      companyId: parsed.companyId ?? null,
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      modules: Array.isArray(parsed.modules) ? parsed.modules : [],
    };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveAuthSession = (session: ClientAuthSession | null): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  if (!session) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  const payload: ClientAuthSession = {
    user: session.user,
    tenant: session.tenant ?? null,
    companyId: session.companyId ?? null,
    companies: Array.isArray(session.companies) ? session.companies : [],
    modules: Array.isArray(session.modules) ? session.modules : [],
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearAuthSession = (): void => {
  const storage = getStorage();
  storage?.removeItem(STORAGE_KEY);
};

export { STORAGE_KEY as AUTH_SESSION_STORAGE_KEY };
