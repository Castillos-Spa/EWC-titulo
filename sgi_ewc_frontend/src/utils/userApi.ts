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
  newPassword: string
): Promise<void> {
  return apiFetch(`/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password: newPassword }),
  });
}
import apiFetch from "./api";
import { User } from "../types/User";

export async function getUsers(): Promise<User[]> {
  return apiFetch("/users", { method: "GET" });
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
