import apiFetch from "./api";

/**
 * Marca una notificación como leída en el backend.
 * Asumimos que tienes un endpoint como: PATCH /notifications/:id/read
 */
export async function markNotificationAsRead(
  notificationId: string | number
): Promise<void> {
  // No esperamos una respuesta, pero la API debería devolver un 200 OK.
  return apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
}
