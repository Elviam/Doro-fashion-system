// src/services/suppliers.service.js
// Todas las llamadas HTTP al backend de proveedores

// Use the environment variable which includes the `/api` prefix, fallback to a sensible default
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

// Lee el token igual que lo hace tu AuthContext
function getToken() {
  return localStorage.getItem("token") ?? "";
}

// Headers comunes para todas las peticiones
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── Utilidades de conversión backend ↔ frontend ──────────────────────────
// El backend usa:  activo: true/false  y  createdAt/updatedAt (ISO string)
// El frontend usa: estado: "Activo"/"Inactivo"  y  creado/editado (DD-MM-YYYY)

function isoToDisplay(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Convierte un proveedor del backend al formato que usa Proveedores.jsx
function toFrontend(supplier) {
  return {
    id: supplier.id,
    nombre: supplier.nombre || "",
    rfc: supplier.rfc || "",
    giro: supplier.giro || "",
    email: supplier.email || "",
    telefono: supplier.telefono || "",
    contacto: supplier.contacto || "",
    direccion: supplier.direccion || "",
    notas: supplier.notas || "",
    estado: supplier.activo !== false ? "Activo" : "Inactivo",
    creado: isoToDisplay(supplier.createdAt),
    editado: isoToDisplay(supplier.updatedAt),
  };
}

// Convierte el formData del frontend al body que espera el backend
function toBackend(formData) {
  return {
    nombre: formData.nombre,
    rfc: formData.rfc || "",
    email: formData.email || "",
    telefono: formData.telefono || "",
    contacto: formData.contacto || "",
    direccion: formData.direccion || "",
    giro: formData.giro || "",
    notas: formData.notas || "",
    activo: formData.estado === "Activo",
  };
}

// ─── Manejo de errores ────────────────────────────────────────────────────
async function handleResponse(res) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  let mensaje = `Error ${res.status}`;
  try {
    const data = await res.json();
    console.log("Respuesta del backend:", data);
    mensaje = data.message || data.error || mensaje;
  } catch {
    // body no era JSON
  }

  const error = new Error(mensaje);
  error.status = res.status;
  throw error;
}

// ─── Endpoints ────────────────────────────────────────────────────────────

/**
 * GET /suppliers
 * Devuelve { items, total, page, limit } ya convertidos al formato frontend.
 */
export async function fetchSuppliers({ q = "", activo, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set("q", q);
  if (typeof activo === "boolean") params.set("activo", String(activo));

  const res = await fetch(`${BASE_URL}/suppliers?${params}`, {
    headers: authHeaders(),
  });

  const data = await handleResponse(res);

  return {
    items: (data.items || []).map(toFrontend),
    total: data.total ?? 0,
    page: data.page ?? page,
    limit: data.limit ?? limit,
  };
}

/**
 * POST /suppliers
 * Recibe el formData del frontend, devuelve el proveedor creado (formato frontend).
 */
export async function createSupplier(formData) {
  const res = await fetch(`${BASE_URL}/suppliers`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(toBackend(formData)),
  });

  const data = await handleResponse(res);
  return toFrontend(data.item);
}

/**
 * PATCH /suppliers/:id
 * Recibe el formData del frontend, devuelve el proveedor actualizado (formato frontend).
 */
export async function updateSupplier(id, formData) {
  const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(toBackend(formData)),
  });

  const data = await handleResponse(res);
  return toFrontend(data.item);
}

/**
 * DELETE /suppliers/:id
 */
export async function deleteSupplier(id) {
  const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await handleResponse(res);
  return true;
}