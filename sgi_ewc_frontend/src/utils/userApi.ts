import apiFetch from "./api";
import { User } from "../types/User"; // Asegúrate de que User se exporte desde types/User.ts

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
  const res = await apiFetch("/users", { method: "GET" });
  // Backend may return either an array or a paginated object { items, total, page, pageSize }
  if (Array.isArray(res)) return res as User[];
  if (res && Array.isArray(res.items)) return res.items as User[];
  // fallback: try to extract from data property
  if (res && Array.isArray(res.data)) return res.data as User[];
  return [];
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

export type { User };
