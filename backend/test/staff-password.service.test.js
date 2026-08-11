import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

process.env.JWT_SECRET ??= 'test-access-secret'
const [{ AuthService }, { authRepository }, { auditRepository }, { env }] = await Promise.all([
  import('../src/modules/auth/auth.service.js'),
  import('../src/modules/auth/auth.repository.js'),
  import('../src/modules/audit/audit.repository.js'),
  import('../src/config/env.js'),
])

const original = {
  findById: authRepository.findById,
  findClientById: authRepository.findClientById,
  updatePassword: authRepository.updatePassword,
  updateClientPassword: authRepository.updateClientPassword,
  createAudit: auditRepository.create,
  demoStaffEmail: env.DEMO_STAFF_EMAIL,
}
function restore() {
  Object.assign(authRepository, {
    findById: original.findById,
    findClientById: original.findClientById,
    updatePassword: original.updatePassword,
    updateClientPassword: original.updateClientPassword,
  })
  auditRepository.create = original.createAudit
  env.DEMO_STAFF_EMAIL = original.demoStaffEmail
}

test('demo STAFF cannot change its own password', async (t) => {
  t.after(restore)
  env.DEMO_STAFF_EMAIL = 'demo@doro.test'
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  authRepository.findById = async () => ({ id: 'demo-1', email: 'demo@doro.test', usuario: 'demo', role: 'BODEGUERO', activo: true, passwordHash })
  let passwordUpdated = false
  authRepository.updatePassword = async () => { passwordUpdated = true }

  const service = new AuthService()
  await assert.rejects(
    () => service.changePassword(
      { id: 'demo-1', accountType: 'STAFF', role: 'BODEGUERO' },
      { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }
    ),
    (error) => error.statusCode === 403 && error.message === 'La cuenta de demostración no permite cambiar la contraseña.'
  )
  assert.equal(passwordUpdated, false)
  assert.equal(service.sanitizeStaff({ email: 'demo@doro.test' }, []).isDemoStaff, true)
})

test('configured demo email preserves normal STAFF and CLIENT password changes', async (t) => {
  t.after(restore)
  env.DEMO_STAFF_EMAIL = 'demo@doro.test'
  auditRepository.create = async () => ({})
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  let staffUpdated = false
  let clientUpdated = false
  authRepository.findById = async () => ({ id: 'staff-1', email: 'staff@doro.test', usuario: 'staff', role: 'BODEGUERO', activo: true, passwordHash })
  authRepository.updatePassword = async () => { staffUpdated = true }
  authRepository.findClientById = async () => ({ id: 'client-1', email: 'demo@doro.test', activo: true, passwordHash })
  authRepository.updateClientPassword = async () => { clientUpdated = true }

  const service = new AuthService()
  await service.changePassword(
    { id: 'staff-1', accountType: 'STAFF', role: 'BODEGUERO' },
    { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }
  )
  await service.changePassword(
    { id: 'client-1', accountType: 'CLIENT' },
    { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }
  )

  assert.equal(staffUpdated, true)
  assert.equal(clientUpdated, true)
})

test('body email cannot impersonate the demo account or bypass its restriction', async (t) => {
  t.after(restore)
  env.DEMO_STAFF_EMAIL = 'demo@doro.test'
  auditRepository.create = async () => ({})
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  const service = new AuthService()
  let account = { id: 'staff-1', email: 'staff@doro.test', usuario: 'staff', role: 'BODEGUERO', activo: true, passwordHash }
  let updates = 0
  authRepository.findById = async () => account
  authRepository.updatePassword = async () => { updates += 1 }

  await service.changePassword(
    { id: 'staff-1', accountType: 'STAFF', role: 'BODEGUERO' },
    { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva', email: 'demo@doro.test' }
  )
  assert.equal(updates, 1)

  account = { ...account, id: 'demo-1', email: 'demo@doro.test', usuario: 'demo' }
  await assert.rejects(
    () => service.changePassword(
      { id: 'demo-1', accountType: 'STAFF', role: 'BODEGUERO' },
      { currentPassword: 'clave-actual', newPassword: 'otra-clave', confirmPassword: 'otra-clave', email: 'staff@doro.test' }
    ),
    (error) => error.statusCode === 403
  )
  assert.equal(updates, 1)
})

test('unset demo email preserves existing STAFF password behavior', async (t) => {
  t.after(restore)
  env.DEMO_STAFF_EMAIL = null
  auditRepository.create = async () => ({})
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  authRepository.findById = async () => ({ id: 'staff-1', email: 'demo@doro.test', usuario: 'staff', role: 'BODEGUERO', activo: true, passwordHash })
  let passwordUpdated = false
  authRepository.updatePassword = async () => { passwordUpdated = true }

  await new AuthService().changePassword(
    { id: 'staff-1', accountType: 'STAFF', role: 'BODEGUERO' },
    { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }
  )
  assert.equal(passwordUpdated, true)
})

test('primary admins, secondary admins and warehouse staff change only their own password', async (t) => {
  t.after(restore)
  auditRepository.create = async () => ({})
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
