import test from 'node:test'
import assert from 'node:assert/strict'
import { requirePermissions } from '../src/middlewares/requirePermissions.js'

function execute(middleware, user) {
  return new Promise((resolve) => {
    const req = { user }
    const res = { statusCode: null, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; resolve({ next: false, res: this }) } }
    middleware(req, res, () => resolve({ next: true, res }))
  })
}

test('requirePermissions devuelve 401 sin sesión autenticada', async () => {
  const result = await execute(requirePermissions(['recepciones:read']), null)
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 401)
})

test('requirePermissions devuelve 403 si falta el permiso', async () => {
  const result = await execute(requirePermissions(['recepciones:confirm']), { permissions: ['recepciones:read'] })
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 403)
})

test('requirePermissions permite continuar con el permiso exacto', async () => {
  const result = await execute(requirePermissions(['recepciones:confirm']), { permissions: ['recepciones:read', 'recepciones:confirm'] })
  assert.equal(result.next, true)
})
