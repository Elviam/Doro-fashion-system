const BASE = import.meta.env?.VITE_API_URL ?? ''
const REQUEST_TIMEOUT_MS = 30000
const closingScopes = new Set()

export function getAuthToken(auth) {
  if (auth === 'STAFF') return localStorage.getItem('staffToken') || ''
  if (auth === 'CLIENT') return localStorage.getItem('clientToken') || ''
  return ''
}

function notifyExpiredSession(auth) {
  if (!auth || closingScopes.has(auth) || typeof window === 'undefined') return
  closingScopes.add(auth)
  window.dispatchEvent(new CustomEvent('doro:session-expired', { detail: { accountType: auth } }))
}

export function releaseExpiredSessionLock(auth) {
  closingScopes.delete(auth)
}

async function request(path, { auth, signal: externalSignal, ...options } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true })
  const token = getAuthToken(auth)

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (externalSignal?.aborted) {
      const abortedError = new Error('La solicitud fue cancelada.')
      abortedError.code = 'ABORTED'
      throw abortedError
    }
    if (error.name === 'AbortError') {
      const timeoutError = new Error('La solicitud tardó demasiado. Verifica tu conexión e inténtalo de nuevo.')
      timeoutError.code = 'NETWORK_ERROR'
      timeoutError.isNetworkError = true
      timeoutError.isTimeout = true
      throw timeoutError
    }
    const networkError = new Error('No fue posible cargar la información. Revisa tu conexión e inténtalo nuevamente.')
    networkError.code = 'NETWORK_ERROR'
    networkError.isNetworkError = true
    networkError.isTimeout = false
    throw networkError
  } finally {
    clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', abortFromCaller)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) notifyExpiredSession(auth)
    const details = err.errors && typeof err.errors === 'object' ? Object.values(err.errors).join(' ') : ''
    const error = new Error([err.message || `Error ${res.status}`, details].filter(Boolean).join(': '))
    error.status = res.status
    error.auth = auth
    error.code = `HTTP_${res.status}`
    error.isNetworkError = false
    error.isTimeout = false
    throw error
  }

  return res.json()
}

function createApi(auth) {
  return {
    get: (path, options = {}) => request(path, { ...options, auth }),
    post: (path, body, options = {}) => request(path, { ...options, auth, method: 'POST', body: JSON.stringify(body) }),
    patch: (path, body, options = {}) => request(path, { ...options, auth, method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path, options = {}) => request(path, { ...options, auth, method: 'DELETE' }),
  }
}

export const staffApi = createApi('STAFF')
export const clientApi = createApi('CLIENT')
export const publicApi = createApi(undefined)
// Backwards-compatible alias for storefront calls. Administrative code must use staffApi.
export const api = clientApi
