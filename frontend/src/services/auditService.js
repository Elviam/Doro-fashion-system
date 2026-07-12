const API_URL = import.meta.env.VITE_API_URL;

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
    const res = await fetch(`${API_URL}/audit?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
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