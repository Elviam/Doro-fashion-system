import { auditRepository } from '../modules/audit/audit.repository.js'

const SECRET_DETAIL_KEYS = new Set(['password', 'passwordhash', 'currentpassword', 'newpassword', 'confirmpassword', 'token', 'cookie', 'code', 'recoverycode'])

function stripSecrets(value) {
  if (Array.isArray(value)) return value.map(stripSecrets)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !SECRET_DETAIL_KEYS.has(key.toLowerCase()))
    .map(([key, nested]) => [key, stripSecrets(nested)]))
}

export async function logAuditEvent({
  action,
  resource,
  resourceId = '',
  details = {},
  currentUser = null
}) {
  // La auditoría del panel es para rendición de cuentas del personal. Las
  // acciones del cliente pertenecen a los módulos de tienda/ventas, no aquí.
  if (!['ADMIN', 'BODEGUERO'].includes(currentUser?.role)) return

  try {
    await auditRepository.create({
      action,
      resource,
      resourceId,
      details: stripSecrets(details),
      userId: currentUser?.sub || null
    })
  } catch (error) {
    console.error('AUDIT LOG ERROR =>', error)
  }
}
