import apiFetch from "./api";
import type { User } from "../types/User";
export type { User } from "../types/User";

type PaginatedUserResponse =
  | User[]
  | {
      items?: User[] | null;
      data?: User[] | null;
      results?: User[] | null;
    };

const extractUsers = (input: PaginatedUserResponse | null | undefined): User[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    const candidates = [input.items, input.data, input.results];
    const found = candidates.find(Array.isArray);
    if (found && Array.isArray(found)) return found as User[];
  }
  return [];
};

// --- Auth ---

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string; user: User }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfile(): Promise<User> {
  return apiFetch("/auth/profile", { method: "GET" });
}

export async function logoutUser(): Promise<{ message: string }> {
  return apiFetch("/auth/logout", { method: "POST" });
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

// --- User Management ---
export async function getUsers(): Promise<User[]> {
  const response = (await apiFetch("/users", { method: "GET" })) as PaginatedUserResponse;
  return extractUsers(response);
}

// Corrige el tipo de respuesta para incluir tempPassword
export async function createUser(
  data: Partial<User>
): Promise<{ user: User; tempPassword?: string }> {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: number,
  data: Partial<User>
): Promise<User> {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}

// --- Utilidades administrativas ---
export async function regenerateTempPassword(userId: number): Promise<{ tempPassword?: string } | { message: string }> {
  return apiFetch(`/users/${userId}/regenerate-password`, { method: "PUT" });
}
