import test from 'node:test'
import assert from 'node:assert/strict'

const [{ RolesService }, { rolesRepository }] = await Promise.all([
  import('../src/modules/roles/roles.service.js'),
  import('../src/modules/roles/roles.repository.js'),
])

const original = { findById: rolesRepository.findById, update: rolesRepository.update }
function restore() { Object.assign(rolesRepository, original) }

test('roles internos cannot be created or deleted through the API service', async (t) => {
  t.after(restore)
  const service = new RolesService()
  await assert.rejects(() => service.create({ nombre: 'GERENTE' }), (error) => error.statusCode === 403)
  await assert.rejects(() => service.remove('role-admin'), (error) => error.statusCode === 403)
})

test('only a visible description can be updated for an internal role', async (t) => {
  t.after(restore)
  rolesRepository.findById = async () => ({ id: 'role-admin', codigo: 'ADMIN', nombre: 'Administrador', descripcion: 'Antes', permissions: [] })
  rolesRepository.update = async (_id, data) => ({ id: 'role-admin', codigo: 'ADMIN', nombre: 'Administrador', descripcion: data.descripcion, permissions: [] })
  const service = new RolesService()
  const updated = await service.update('role-admin', { descripcion: 'DespuÃ©s' })
  assert.equal(updated.descripcion, 'DespuÃ©s')
  await assert.rejects(() => service.update('role-admin', { nombre: 'Otro' }), (error) => error.statusCode === 403)
  await assert.rejects(() => service.update('role-admin', { permissions: ['users:read'] }), (error) => error.statusCode === 403)
})
