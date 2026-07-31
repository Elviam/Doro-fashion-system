import test from 'node:test'
import assert from 'node:assert/strict'
import { clientApi, getAuthToken, releaseExpiredSessionLock, staffApi } from '../src/services/api.js'
import { fetchNotifications } from '../src/services/notifications.service.js'
import { isEmptySuccessfulNotifications, NOTIFICATION_STATUS } from '../src/hooks/useNotifications.js'

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
}
globalThis.window = new EventTarget()
window.location = { pathname: '/perfil', search: '' }
globalThis.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) { super(type); this.detail = options.detail }
}

test('the own-password request explicitly selects staffToken', () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  localStorage.setItem('clientToken', 'client-session')
  assert.equal(getAuthToken('STAFF'), 'staff-session')
})

test('an unspecified request does not infer a token from the current route', () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  localStorage.setItem('clientToken', 'client-session')
  window.location.search = '?scope=staff'
  assert.equal(getAuthToken(), '')
  window.location.search = ''
})

test('staff and client clients send only their explicitly assigned token', async () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  localStorage.setItem('clientToken', 'client-session')
  const authorization = []
  globalThis.fetch = async (_url, options) => {
    authorization.push(options.headers.Authorization)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  await staffApi.get('/dashboard/summary')
  await clientApi.get('/clients/me/addresses')
  assert.deepEqual(authorization, ['Bearer staff-session', 'Bearer client-session'])
})

test('only a real STAFF 401 raises one scoped expiration event; 403 and network failures do not', async () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  let expired = 0
  const listener = () => { expired += 1 }
  window.addEventListener('doro:session-expired', listener)
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  await Promise.all([staffApi.get('/one').catch(() => {}), staffApi.get('/two').catch(() => {})])
  assert.equal(expired, 1)
  releaseExpiredSessionLock('STAFF')
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Sin permiso' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  await staffApi.get('/forbidden').catch(() => {})
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await staffApi.get('/offline').catch(() => {})
  assert.equal(expired, 1)
  window.removeEventListener('doro:session-expired', listener)
})

test('a STAFF 503 is normalized without expiring or removing the staff session', async () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  let expired = 0
  const listener = () => { expired += 1 }
  window.addEventListener('doro:session-expired', listener)
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Servicio temporalmente no disponible' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  await assert.rejects(staffApi.get('/dashboard/summary'), (error) => error.status === 503 && error.code === 'HTTP_503' && error.isNetworkError === false)
  assert.equal(localStorage.getItem('staffToken'), 'staff-session')
  assert.equal(expired, 0)
  window.removeEventListener('doro:session-expired', listener)
})

test('notifications use staffApi and preserve the expected total/items contract', async () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  let authorization = ''
  globalThis.fetch = async (_url, options) => {
    authorization = options.headers.Authorization
    return new Response(JSON.stringify({ total: 1, items: [{ id: 'stock-1', createdAt: null }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const payload = await fetchNotifications()
  assert.equal(authorization, 'Bearer staff-session')
  assert.equal(payload.total, 1)
  assert.equal(payload.items.length, 1)
})

test('a later successful notifications response remains usable after a temporary 503', async () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    if (calls === 1) return new Response(JSON.stringify({ message: 'Servicio temporalmente no disponible' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ total: 2, items: [{ id: 'one' }, { id: 'two' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  await assert.rejects(fetchNotifications(), (error) => error.status === 503)
  const recovered = await fetchNotifications()
  assert.deepEqual(recovered.items.map((item) => item.id), ['one', 'two'])
  assert.equal(localStorage.getItem('staffToken'), 'staff-session')
})

test('only an explicit empty successful response may render Todo en orden', () => {
  assert.equal(isEmptySuccessfulNotifications({ status: NOTIFICATION_STATUS.IDLE, total: 0, items: [] }), false)
  assert.equal(isEmptySuccessfulNotifications({ status: NOTIFICATION_STATUS.LOADING, total: 0, items: [] }), false)
  assert.equal(isEmptySuccessfulNotifications({ status: NOTIFICATION_STATUS.ERROR, total: 0, items: [] }), false)
  assert.equal(isEmptySuccessfulNotifications({ status: NOTIFICATION_STATUS.SUCCESS, total: 0, items: [] }), true)
})

test('an invalid notifications count is rejected instead of becoming an empty success', async () => {
  values.clear()
  localStorage.setItem('staffToken', 'staff-session')
  globalThis.fetch = async () => new Response(JSON.stringify({ total: 2, items: [{ id: 'only-one' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  await assert.rejects(fetchNotifications(), (error) => error.code === 'INVALID_NOTIFICATIONS_PAYLOAD')
})
