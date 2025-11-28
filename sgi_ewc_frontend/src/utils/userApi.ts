import apiFetch from "./api";
import {
  clearRequestCache,
  fetchWithCache,
  invalidateCache,
} from "./requestCache";
import type { User } from "../types/User";
export type { User } from "../types/User";
import { invalidateDashboardOverviewCache } from "./dashboardApi";

type PaginatedUserResponse =
  | User[]
  | {
      items?: User[] | null;
      data?: User[] | null;
      results?: User[] | null;
    };

const extractUsers = (
  input: PaginatedUserResponse | null | undefined
): User[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    const candidates = [input.items, input.data, input.results];
    const found = candidates.find(Array.isArray);
    if (found && Array.isArray(found)) return found as User[];
  }
  return [];
};

const PROFILE_CACHE_KEY = "auth:profile";
const USERS_CACHE_KEY = "users:list";

// --- Auth ---

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string; user: User }> {
  const result = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  clearRequestCache();
  invalidateCache([PROFILE_CACHE_KEY, USERS_CACHE_KEY]);
  return result;
}

export async function getProfile(): Promise<User> {
  return fetchWithCache(
    PROFILE_CACHE_KEY,
    () => apiFetch("/auth/profile", { method: "GET" }) as Promise<User>
  );
}

export async function logoutUser(): Promise<{ message: string }> {
  try {
    return await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearRequestCache();
    invalidateCache([PROFILE_CACHE_KEY, USERS_CACHE_KEY]);
  }
}

// Obtener la contraseña temporal de un usuario (solo si mustChangePassword=true)
export async function getTempPassword(userId: number): Promise<string> {
  const res = await apiFetch(`/users/${userId}/temp-password`, {
    method: "GET",
  });
  // Si el backend devuelve la contraseña, úsala. Si no, muestra el mensaje del backend.
  return (
    res.tempPassword ||
    res.message ||
    "Contraseña temporal no disponible por seguridad."
  );
}
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  return apiFetch(`/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateOwnProfile(
  data: Partial<
    Pick<
      User,
      | "username"
      | "fullName"
      | "email"
      | "phone"
      | "address"
      | "jobTitle"
      | "bio"
    >
  >
): Promise<User> {
  const updated = await apiFetch("/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  invalidateCache([PROFILE_CACHE_KEY, USERS_CACHE_KEY]);
  return updated as User;
}

export async function uploadOwnAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("file", file);

  const updated = await apiFetch("/users/me/avatar", {
    method: "POST",
    body: formData,
  });
  invalidateCache([PROFILE_CACHE_KEY, USERS_CACHE_KEY]);
  return updated as User;
}

// --- User Management ---
export async function getUsers(forceRefresh = false): Promise<User[]> {
  return fetchWithCache(
    USERS_CACHE_KEY,
    async () => {
      const response = (await apiFetch("/users", {
        method: "GET",
      })) as PaginatedUserResponse;
      return extractUsers(response);
    },
    { force: forceRefresh }
  );
}

// Corrige el tipo de respuesta para incluir tempPassword
export async function createUser(
  data: Partial<User>
): Promise<{ user: User; tempPassword?: string }> {
  const created = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  invalidateCache(USERS_CACHE_KEY);
  invalidateDashboardOverviewCache();
  return created;
}

export async function updateUser(
  id: number,
  data: Partial<User>
): Promise<User> {
  const updated = await apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  invalidateCache(USERS_CACHE_KEY);
  invalidateDashboardOverviewCache();
  return updated;
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch(`/users/${id}`, { method: "DELETE" });
  invalidateCache(USERS_CACHE_KEY);
  invalidateDashboardOverviewCache();
}

// --- Utilidades administrativas ---
export async function regenerateTempPassword(
  userId: number
): Promise<{ tempPassword?: string } | { message: string }> {
  const result = await apiFetch(`/users/${userId}/regenerate-password`, {
    method: "PUT",
  });
  invalidateCache(USERS_CACHE_KEY);
  invalidateDashboardOverviewCache();
  return result;
}
