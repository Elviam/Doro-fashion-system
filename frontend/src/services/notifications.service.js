import { staffApi } from './api.js'

export async function fetchNotifications(options = {}) {
  const payload = await staffApi.get('/notifications', options)
  if (typeof payload?.total !== 'number' || !Array.isArray(payload?.items) || payload.total !== payload.items.length) {
    const error = new Error('La respuesta de notificaciones no tiene el formato esperado')
    error.code = 'INVALID_NOTIFICATIONS_PAYLOAD'
    throw error
  }
  return payload
}
