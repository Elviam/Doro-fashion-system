import { staffApi } from './api';

// Consulta el log de auditoría más reciente para un recurso específico.
// Filtra client-side por resourceId porque el endpoint /audit no expone ese filtro directamente.
export async function obtenerUltimoLog({ token, resource, resourceId, action }) {
  if (!token || !resourceId) return null;
  try {
    const params = new URLSearchParams({
      resource,
      limit: "100",
      ...(action && { action }),
    });
    const data = await staffApi.get(`/audit?${params}`);
    const items = (data.items || []).filter(
      (l) => String(l.resourceId) === String(resourceId)
    );
    if (items.length === 0) return null;
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return items[0];
  } catch {
    return null;
  }
}
