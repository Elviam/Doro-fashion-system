import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

process.env.JWT_SECRET ??= 'test-access-secret'
const [{ AuthService }, { authRepository }, { auditRepository }] = await Promise.all([
  import('../src/modules/auth/auth.service.js'),
  import('../src/modules/auth/auth.repository.js'),
  import('../src/modules/audit/audit.repository.js'),
])

const original = { findById: authRepository.findById, updatePassword: authRepository.updatePassword, createAudit: auditRepository.create }
function restore() { Object.assign(authRepository, { findById: original.findById, updatePassword: original.updatePassword }); auditRepository.create = original.createAudit }

test('primary admins, secondary admins and warehouse staff change only their own password', async (t) => {
  t.after(restore)
  const service = new AuthService()
  const oldHash = await bcrypt.hash('clave-actual', 4)
  for (const [role, isPrimaryAdmin] of [['ADMIN', true], ['ADMIN', false], ['BODEGUERO', false]]) {
    const account = { id: `${role}-${isPrimaryAdmin}`, usuario: role.toLowerCase(), role, activo: true, passwordHash: oldHash, isPrimaryAdmin }
    let saved
    authRepository.findById = async (id) => ({ ...account, id })
    authRepository.updatePassword = async (id, passwordHash) => { saved = { id, passwordHash } }
    await service.changePassword({ id: account.id, accountType: 'STAFF', role, usuario: account.usuario }, { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' })
    assert.equal(saved.id, account.id)
    assert.ok(await bcrypt.compare('clave-nueva', saved.passwordHash))
    assert.equal(account.role, role)
    assert.equal(account.isPrimaryAdmin, isPrimaryAdmin)
  }
})

test('own password change rejects an incorrect or reused current password', async (t) => {
  t.after(restore)
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  authRepository.findById = async () => ({ id: 'staff-1', usuario: 'staff', role: 'ADMIN', activo: true, passwordHash })
  const service = new AuthService()
  const actor = { id: 'staff-1', accountType: 'STAFF', role: 'ADMIN', usuario: 'staff' }
  await assert.rejects(() => service.changePassword(actor, { currentPassword: 'incorrecta', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }), (error) => error.statusCode === 400)
  await assert.rejects(() => service.changePassword(actor, { currentPassword: 'clave-actual', newPassword: 'clave-actual', confirmPassword: 'clave-actual' }), (error) => error.statusCode === 400)
})

test('own password change logs only the actor and affected account identity', async (t) => {
  t.after(restore)
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  authRepository.findById = async () => ({ id: 'staff-1', usuario: 'admin', role: 'ADMIN', activo: true, passwordHash })
  authRepository.updatePassword = async () => {}
  let auditEvent
  auditRepository.create = async (event) => { auditEvent = event }

  await new AuthService().changePassword(
    { id: 'staff-1', sub: 'staff-1', accountType: 'STAFF', role: 'ADMIN', usuario: 'admin' },
    { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }
  )

  assert.equal(auditEvent.action, 'CHANGE_PASSWORD')
  assert.equal(auditEvent.resource, 'auth')
  assert.deepEqual(auditEvent.details, {
    actorUserId: 'staff-1', actorUsername: 'admin', targetUserId: 'staff-1', targetUsername: 'admin'
  })
  assert.doesNotMatch(JSON.stringify(auditEvent.details), /clave|hash|token/i)
})
