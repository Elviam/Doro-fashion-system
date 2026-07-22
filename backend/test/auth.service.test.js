import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

process.env.JWT_SECRET ??= 'test-access-secret'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret'

const [{ AuthService }, { authRepository }] = await Promise.all([
  import('../src/modules/auth/auth.service.js'),
  import('../src/modules/auth/auth.repository.js'),
])

const originalRepository = {
  findByUsuario: authRepository.findByUsuario,
  findByEmail: authRepository.findByEmail,
  findRoleByCodigo: authRepository.findRoleByCodigo,
  createClientUserWithProfile: authRepository.createClientUserWithProfile,
  findPermissionsByRoleId: authRepository.findPermissionsByRoleId,
}

function restoreRepository() {
  Object.assign(authRepository, originalRepository)
}

test('staff login entrega token y permisos del rol', async (t) => {
  t.after(restoreRepository)
  const passwordHash = await bcrypt.hash('secreto-seguro', 4)
  authRepository.findByUsuario = async () => ({
    id: 'user-admin', usuario: 'admin', passwordHash, nombre: 'Admin', apellido: 'Doro',
    email: 'admin@doro.test', role: 'ADMIN', roleId: 'role-admin', activo: true,
  })
  authRepository.findPermissionsByRoleId = async () => ['recepciones:read', 'recepciones:enviar']

  const result = await new AuthService().staffLogin({ usuario: 'admin', password: 'secreto-seguro' })

  assert.ok(result.token)
  assert.equal(result.user.role, 'ADMIN')
  assert.deepEqual(result.user.permissions, ['recepciones:read', 'recepciones:enviar'])
})

test('staff login rechaza una cuenta de cliente', async (t) => {
  t.after(restoreRepository)
  const passwordHash = await bcrypt.hash('secreto-seguro', 4)
  authRepository.findByUsuario = async () => ({
    id: 'user-client', usuario: 'cliente', passwordHash, nombre: 'Cliente', apellido: null,
    email: 'cliente@doro.test', role: 'CLIENTE', roleId: 'role-client', activo: true,
  })
  authRepository.findPermissionsByRoleId = async () => []

  await assert.rejects(
    () => new AuthService().staffLogin({ usuario: 'cliente', password: 'secreto-seguro' }),
    (error) => error.statusCode === 401,
  )
})

test('staff login rechaza credenciales inexistentes', async (t) => {
  t.after(restoreRepository)
  authRepository.findByUsuario = async () => null

  await assert.rejects(
    () => new AuthService().staffLogin({ usuario: 'nadie', password: 'secreto-seguro' }),
    (error) => error.statusCode === 401,
  )
})

test('registro crea la cuenta CLIENTE junto con su perfil de cliente', async (t) => {
  t.after(restoreRepository)
  let userData = null

  authRepository.findByEmail = async () => null
  authRepository.findRoleByCodigo = async () => ({ id: 'role-client', codigo: 'CLIENTE' })
  authRepository.findByUsuario = async () => null
  authRepository.createClientUserWithProfile = async (data) => {
    userData = data
    return {
      user: {
        id: 'user-client',
        ...data,
        apellido: null,
        role: 'CLIENTE',
        createdAt: new Date(),
      }
    }
  }
  authRepository.findPermissionsByRoleId = async () => []

  const result = await new AuthService().register({
    nombre: 'Cliente Nuevo',
    email: 'cliente@doro.test',
    password: 'secreto-seguro',
  })

  assert.equal(userData.email, 'cliente@doro.test')
  assert.equal(userData.roleId, 'role-client')
  assert.equal(result.user.role, 'CLIENTE')
  assert.ok(result.token)
})
