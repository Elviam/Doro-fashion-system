import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

process.env.JWT_SECRET ??= 'test-access-secret'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret'

const [{ AuthService }, { authRepository }] = await Promise.all([
  import('../src/modules/auth/auth.service.js'),
  import('../src/modules/auth/auth.repository.js'),
])

const original = {
  findByUsuario: authRepository.findByUsuario,
  findClientByEmail: authRepository.findClientByEmail,
  findClientById: authRepository.findClientById,
  createClient: authRepository.createClient,
  updateClientPassword: authRepository.updateClientPassword,
  updatePassword: authRepository.updatePassword,
}
function restore() { Object.assign(authRepository, original) }

test('ADMIN and BODEGUERO authenticate only through the staff User lookup', async (t) => {
  t.after(restore)
  const passwordHash = await bcrypt.hash('secreto-seguro', 4)
  for (const role of ['ADMIN', 'BODEGUERO']) {
    let clientLookupCalled = false
    authRepository.findByUsuario = async () => ({ id: role, usuario: role.toLowerCase(), passwordHash, nombre: role, email: role + '@doro.test', role, roleId: null, activo: true, revokedPermissions: [], grantedPermissions: [] })
    authRepository.findClientByEmail = async () => { clientLookupCalled = true; return null }
    const result = await new AuthService().staffLogin({ usuario: role.toLowerCase(), password: 'secreto-seguro' })
    assert.equal(result.user.accountType, 'STAFF')
    assert.equal(clientLookupCalled, false)
  }
})

test('staff login rejects a technical CLIENTE User record', async (t) => {
  t.after(restore)
  authRepository.findByUsuario = async () => ({ id: 'legacy-client', role: 'CLIENTE', activo: true })
  await assert.rejects(() => new AuthService().staffLogin({ usuario: 'cliente', password: 'secreto-seguro' }), (error) => error.statusCode === 401)
})

test('client login uses only Client, even when the same person also has a staff account', async (t) => {
  t.after(restore)
  const passwordHash = await bcrypt.hash('secreto-seguro', 4)
  authRepository.findByUsuario = async () => { throw new Error('staff lookup must not occur') }
  authRepository.findClientByEmail = async (email) => email === 'cliente@doro.test'
    ? { id: 'client-1', nombre: 'Cliente', email, passwordHash, activo: true }
    : null
  const result = await new AuthService().clientLogin({ email: 'cliente@doro.test', password: 'secreto-seguro' })
  assert.equal(result.user.accountType, 'CLIENT')
  authRepository.findClientByEmail = async () => ({ id: 'client-2', nombre: 'Cliente independiente', email: 'staff@doro.test', passwordHash, activo: true })
  const independentAccount = await new AuthService().clientLogin({ email: 'staff@doro.test', password: 'secreto-seguro' })
  assert.equal(independentAccount.user.accountType, 'CLIENT')
  authRepository.findClientByEmail = async () => null
  await assert.rejects(() => new AuthService().clientLogin({ email: 'staff@doro.test', password: 'secreto-seguro' }), (error) => error.statusCode === 401)
})

test('registration creates only a Client credential record and does not enforce User email uniqueness', async (t) => {
  t.after(restore)
  let created = null
  authRepository.findByUsuario = async () => { throw new Error('User lookup must not occur') }
  authRepository.findClientByEmail = async () => null
  authRepository.createClient = async (data) => { created = { id: 'client-new', ...data, createdAt: new Date() }; return created }
  const result = await new AuthService().register({ nombre: 'Cliente Nuevo', email: 'cliente@doro.test', password: 'secreto-seguro' })
  assert.equal(created.email, 'cliente@doro.test')
  assert.ok(created.passwordHash)
  assert.equal(created.userId, undefined)
  assert.equal(result.user.accountType, 'CLIENT')
})

test('auth me serializes the primary-administrator flag for staff accounts', async () => {
  const result = await new AuthService().me({
    id: 'admin-1',
    usuario: 'admin',
    nombre: 'Administrador',
    email: 'admin@doro.test',
    role: 'ADMIN',
    roleId: 'role-admin',
    activo: true,
    isPrimaryAdmin: true,
    accountType: 'STAFF',
    permissions: ['users:create'],
  })
  assert.equal(result.isPrimaryAdmin, true)
  assert.equal(result.accountType, 'STAFF')
})

test('client changes their password only from an authenticated account', async (t) => {
  t.after(restore)
  const passwordHash = await bcrypt.hash('clave-actual', 4)
  const client = { id: 'client-1', nombre: 'Cliente', email: 'cliente@doro.test', activo: true, passwordHash }
  let savedPassword
  authRepository.findClientById = async (id) => id === client.id ? client : null
  authRepository.updateClientPassword = async (id, hash) => { savedPassword = { id, hash } }

  await new AuthService().changePassword(
    { id: client.id, accountType: 'CLIENT' },
    { currentPassword: 'clave-actual', newPassword: 'clave-nueva', confirmPassword: 'clave-nueva' }
  )

  assert.equal(savedPassword.id, client.id)
  assert.ok(await bcrypt.compare('clave-nueva', savedPassword.hash))
})
