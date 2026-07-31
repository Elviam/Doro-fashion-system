import test from 'node:test'
import assert from 'node:assert/strict'

const [{ UsersService }, { usersRepository }, { auditRepository }] = await Promise.all([
  import('../src/modules/users/users.service.js'),
  import('../src/modules/users/users.repository.js'),
  import('../src/modules/audit/audit.repository.js'),
])

const original = {
  findById: usersRepository.findById,
  findRoleById: usersRepository.findRoleById,
  update: usersRepository.update,
  createAudit: auditRepository.create,
}

function restore() {
  Object.assign(usersRepository, {
    findById: original.findById,
    findRoleById: original.findRoleById,
    update: original.update,
  })
  auditRepository.create = original.createAudit
}

test('administrative password reset records actor and affected account without credentials', async (t) => {
  t.after(restore)
  const target = {
    id: 'staff-2', usuario: 'bodeguero', nombre: 'Bodega', apellido: 'Uno', email: 'bodega@doro.test',
    role: 'BODEGUERO', roleId: 'role-bodega', activo: true, permissions: [], revokedPermissions: [], grantedPermissions: []
  }
  usersRepository.findById = async () => target
  usersRepository.findRoleById = async () => ({ id: 'role-bodega', codigo: 'BODEGUERO', permissions: [] })
  usersRepository.update = async (_id, data) => ({ ...target, ...data })
  let auditEvent
  auditRepository.create = async (event) => { auditEvent = event }

  await new UsersService().update('staff-2', { password: 'nueva-clave-segura' }, {
    id: 'staff-1', sub: 'staff-1', usuario: 'admin', role: 'ADMIN', isPrimaryAdmin: true
  })

  assert.equal(auditEvent.action, 'RESET_PASSWORD')
  assert.equal(auditEvent.resource, 'auth')
  assert.deepEqual(auditEvent.details, {
    actorUserId: 'staff-1', actorUsername: 'admin', targetUserId: 'staff-2', targetUsername: 'bodeguero'
  })
  assert.doesNotMatch(JSON.stringify(auditEvent.details), /nueva-clave|hash|token/i)
})
