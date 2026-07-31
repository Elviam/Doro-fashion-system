import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getPasswordAuditPresentation,
  getPasswordMovementDescription,
} from '../src/utils/passwordAuditPresentation.js'

test('own password change presents the affected account once', () => {
  const presentation = getPasswordAuditPresentation({
    action: 'CHANGE_PASSWORD', resource: 'auth',
    details: { actorUserId: '1', actorUsername: 'admin', targetUserId: '1', targetUsername: 'admin' }
  })
  assert.equal(presentation.actionLabel, 'Cambio de contraseña')
  assert.equal(presentation.resourceLabel, 'Seguridad de cuenta')
  assert.deepEqual(presentation.fields, [{ label: 'CUENTA', value: '@admin' }])
  assert.equal(getPasswordMovementDescription({ action: 'CHANGE_PASSWORD', resource: 'auth', details: { targetUsername: 'admin' } }), 'Cambiaste tu contraseña.')
})

test('administrative reset presents actor and affected account', () => {
  const presentation = getPasswordAuditPresentation({
    action: 'RESET_PASSWORD', resource: 'auth',
    details: { actorUserId: '1', actorUsername: 'admin', targetUserId: '2', targetUsername: 'bodeguero' }
  })
  assert.equal(presentation.actionLabel, 'Restablecimiento de contraseña')
  assert.deepEqual(presentation.fields, [
    { label: 'REALIZADO POR', value: '@admin' },
    { label: 'CUENTA AFECTADA', value: '@bodeguero' },
  ])
  assert.equal(getPasswordMovementDescription({ action: 'RESET_PASSWORD', resource: 'auth', details: { targetUsername: 'bodeguero' } }), 'Restableciste la contraseña de @bodeguero.')
})

test('legacy password records remain renderable without inventing usernames', () => {
  const presentation = getPasswordAuditPresentation({ action: 'RESET_PASSWORD', resource: 'auth', details: 'Usuario: admin' })
  assert.deepEqual(presentation.fields, [
    { label: 'REALIZADO POR', value: 'No disponible' },
    { label: 'CUENTA AFECTADA', value: 'No disponible' },
  ])
})

test('other audit event types keep their existing generic presentation', () => {
  assert.equal(getPasswordAuditPresentation({ action: 'UPDATE', resource: 'products', details: { nombre: 'Blusa' } }), null)
})
