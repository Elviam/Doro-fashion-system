const BASE = import.meta.env.VITE_API_URL

// 🔧 Cambia esto a false cuando tengas el backend listo
const USE_MOCK = true

function getToken() {
  return localStorage.getItem('token')
}

// --- Datos mock ---
const mockUsuarios = [
  { id: '1', usuario: 'jperez', nombre: 'Juan', apellido: 'Pérez', email: 'jperez@correo.com', role: 'ADMIN', roleId: 'role_admin', activo: true },
  { id: '2', usuario: 'mgomez', nombre: 'María', apellido: 'Gómez', email: 'mgomez@correo.com', role: 'GERENTE', roleId: 'GERENTE', activo: true },
  { id: '3', usuario: 'lrodriguez', nombre: 'Luis', apellido: 'Rodríguez', email: 'lrodriguez@correo.com', role: 'VENDEDOR', roleId: 'role_vendedor', activo: false },
  { id: '4', usuario: 'acastro', nombre: 'Ana', apellido: 'Castro', email: 'acastro@correo.com', role: 'BODEGUERO', roleId: 'role_bodeguero', activo: true },
  { id: '5', usuario: 'sfernandez', nombre: 'Sofía', apellido: 'Fernández', email: 'sfernandez@correo.com', role: 'ADMIN', roleId: 'role_admin', activo: true },
  { id: '6', usuario: 'dtorres', nombre: 'Diego', apellido: 'Torres', email: 'dtorres@correo.com', role: 'BODEGUERO', roleId: 'role_bodeguero', activo: true },
]

const mockRoles = [
  { id: 'role_admin', nombre: 'Administrador' },
  { id: 'GERENTE', nombre: 'Gerente' },
  { id: 'role_vendedor', nombre: 'Vendedor' },
  { id: 'role_bodeguero', nombre: 'Bodeguero' },
]

function getMockResponse(path, options) {
  const method = options.method || 'GET'

  if (path.startsWith('/users')) {
    if (method === 'GET') return { items: mockUsuarios }
    if (method === 'POST') return { id: String(Date.now()), ...JSON.parse(options.body || '{}') }
    if (method === 'PATCH') return { ok: true }
    if (method === 'DELETE') return { ok: true }
  }

  if (path.startsWith('/roles')) {
    if (method === 'GET') return { items: mockRoles }
  }

  return {}
}
// --- Fin mock ---

async function request(path, options = {}) {
  if (USE_MOCK && (path.startsWith('/users') || path.startsWith('/roles'))) {
    await new Promise((r) => setTimeout(r, 300)) // simula latencia
    return getMockResponse(path, options)
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Error ${res.status}`)
  }

  return res.json()
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
}