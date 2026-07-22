import { auditRepository } from '../modules/audit/audit.repository.js'

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
      details,
      userId: currentUser?.sub || null
    })
  } catch (error) {
    console.error('AUDIT LOG ERROR =>', error)
  }
}
