import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEffectivePermissions } from '../src/services/authorization.service.js'

const db = {
  permission: { findMany: async () => [{ code: 'inventory:read' }, { code: 'new:functional' }, { code: 'users:read' }] },
  rolePermission: { findMany: async () => [{ permission: { code: 'inventory:read' } }, { permission: { code: 'recepciones:confirm' } }] }
}

test('ADMIN receives every registered permission, including a newly added one', async () => {
  const permissions = await resolveEffectivePermissions({ role: 'ADMIN', roleId: 'admin' }, db)
  assert.deepEqual(permissions, ['inventory:read', 'new:functional', 'users:read'])
})

test('BODEGUERO applies grants and revocations without administrative grants', async () => {
  const permissions = await resolveEffectivePermissions({
    role: 'BODEGUERO', roleId: 'warehouse', revokedPermissions: ['recepciones:confirm'],
    grantedPermissions: ['fulfillment:read', 'users:read']
  }, db)
  assert.deepEqual(permissions, ['inventory:read', 'fulfillment:read'])
})
