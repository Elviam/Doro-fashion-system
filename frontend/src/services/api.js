const BASE = import.meta.env.VITE_API_URL
const REQUEST_TIMEOUT_MS = 30000

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Verifica tu conexión e inténtalo de nuevo.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detalles = err.errors && typeof err.errors === 'object'
      ? Object.values(err.errors).join(' ')
      : ''
    throw new Error([err.message || `Error ${res.status}`, detalles].filter(Boolean).join(': '))
  }

  return res.json()
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
}
