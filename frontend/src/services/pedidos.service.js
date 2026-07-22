const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function getToken() {
  return localStorage.getItem("token") ?? "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }
  let mensaje = `Error ${res.status}`;
  try {
    const data = await res.json();
    mensaje = data.message || data.error || mensaje;
  } catch {}
  const error = new Error(mensaje);
  error.status = res.status;
  throw error;
}

export const ESTADO_PEDIDO_LABELS = {
  BORRADOR: "En borrador",
  ENVIADA: "Enviado",
  CONFIRMADA: "Recibido",
  CANCELADA: "Cancelado",
};

export async function fetchPedidos({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit, origen: "REABASTECIMIENTO" });
  const res = await fetch(`${BASE_URL}/recepciones?${params}`, { headers: authHeaders() });
  const data = await handleResponse(res);
  return { items: data.items || [], total: data.total ?? 0 };
}

export async function crearPedido({ supplierId, items, comentarios, folio }) {
  const body = {
    origen: "REABASTECIMIENTO",
    fecha: new Date().toISOString(),
    supplierId: supplierId || null,
    comentarios: comentarios || undefined,
    folio: folio?.trim() || undefined,
    items,
  };

  const res = await fetch(`${BASE_URL}/recepciones`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await handleResponse(res);
  return data.item;
}

export async function enviarPedido(id) {
  const res = await fetch(`${BASE_URL}/recepciones/${id}/enviar`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const data = await handleResponse(res);
  return data.item;
}
