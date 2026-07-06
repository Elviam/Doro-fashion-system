import { auditRepository } from '../modules/audit/audit.repository.js'

export async function logAuditEvent({
  action,
  resource,
  resourceId = '',
  details = {},
  currentUser = null
}) {
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