import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

process.env.JWT_SECRET ??= 'test-access-secret'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret'

const [{ AuthService }, { authRepository }, { authenticate }, { errorHandler }, { prisma }, { env }] = await Promise.all([
  import('../src/modules/auth/auth.service.js'),
  import('../src/modules/auth/auth.repository.js'),
  import('../src/middlewares/auth.js'),
  import('../src/middlewares/errorHandler.js'),
  import('../src/lib/prisma.js'),
  import('../src/config/env.js'),
])

const original = {
  findByUsuario: authRepository.findByUsuario,
  findById: authRepository.findById,
  permissionFindMany: prisma.permission.findMany,
}

function restore() { Object.assign(authRepository, original); prisma.permission.findMany = original.permissionFindMany }

function runAuthenticate(token) {
  return new Promise((resolve) => {
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = {
      statusCode: null, body: null,
      status(code) { this.statusCode = code; return this },
      json(body) { this.body = body; resolve({ req, res: this, error: null }) },
    }
    authenticate(req, res, (error) => resolve({ req, res, error: error || null }))
  })
}

function staff(overrides = {}) {
  return { id: 'staff-auth-1', usuario: 'admin', passwordHash: '$2a$04$9uSPPmYCAxHPtqWkEdQqjOQczJdZeyDn.rhlOwi6u.RdqlCbSx72W', nombre: 'Admin', email: 'admin@doro.test', role: 'ADMIN', roleId: 'role-admin', activo: true, revokedPermissions: [], grantedPermissions: [], ...overrides }
}

test('a token produced by real staff-login authenticates through decoded.sub', async (t) => {
  t.after(restore)
  const account = staff({ passwordHash: await bcrypt.hash('secreto-seguro', 4) })
  authRepository.findByUsuario = async () => account
  authRepository.findById = async (id) => id === account.id ? account : null
  prisma.permission.findMany = async () => [{ code: 'dashboard:read' }]
  const result = await new AuthService().staffLogin({ usuario: 'admin', password: 'secreto-seguro' })
  const authenticated = await runAuthenticate(result.token)
  assert.equal(authenticated.error, null)
  assert.equal(authenticated.req.user.id, account.id)
  assert.equal(authenticated.req.user.sub, account.id)
  assert.equal(authenticated.req.user.accountType, 'STAFF')
})

test('expired and altered tokens return controlled 401 responses', async (t) => {
  t.after(restore)
  const expired = jwt.sign({ sub: 'staff-auth-1', accountType: 'STAFF' }, env.JWT_SECRET, { expiresIn: -1 })
  assert.equal((await runAuthenticate(expired)).res.statusCode, 401)
  assert.equal((await runAuthenticate(`${expired}x`)).res.statusCode, 401)
})

test('an inactive staff account is rejected but a database failure is delegated, never converted to 401', async (t) => {
  t.after(restore)
  const token = jwt.sign({ sub: 'staff-auth-1', accountType: 'STAFF' }, env.JWT_SECRET, { expiresIn: '1h' })
  authRepository.findById = async () => staff({ activo: false })
  assert.equal((await runAuthenticate(token)).res.statusCode, 401)
  const databaseError = Object.assign(new Error('database unavailable'), { code: 'P1001', name: 'PrismaClientInitializationError' })
  authRepository.findById = async () => { throw databaseError }
  const failedLookup = await runAuthenticate(token)
  assert.equal(failedLookup.res.statusCode, null)
  assert.equal(failedLookup.error, databaseError)
})

test('a Prisma or Neon connectivity failure remains a 503 response', () => {
  const response = {
    statusCode: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  errorHandler(
    Object.assign(new Error('database unavailable'), { code: 'P1001', name: 'PrismaClientInitializationError' }),
    { method: 'POST', originalUrl: '/api/recepciones' },
    response,
    () => {},
  )
  assert.equal(response.statusCode, 503)
})
