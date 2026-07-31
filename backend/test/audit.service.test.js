import test from 'node:test'
import assert from 'node:assert/strict'

const { AuditService } = await import('../src/modules/audit/audit.service.js')

test('el filtro de auditoría incluye por completo el día seleccionado en Ciudad de México', () => {
  const where = new AuditService().buildWhere({ from: '2026-07-29', to: '2026-07-29' })
  const { gte, lt } = where.createdAt

  assert.equal(gte.toISOString(), '2026-07-29T06:00:00.000Z')
  assert.equal(lt.toISOString(), '2026-07-30T06:00:00.000Z')
  assert.ok(new Date('2026-07-29T06:00:00.000Z') >= gte)
  assert.ok(new Date('2026-07-29T15:00:00.000Z') >= gte)
  assert.ok(new Date('2026-07-30T05:59:59.999Z') < lt)
  assert.ok(new Date('2026-07-30T06:00:00.000Z') >= lt)
})

test('los límites individuales conservan el inicio local de cada día', () => {
  const desde = new AuditService().buildWhere({ from: '2026-07-29' }).createdAt
  const hasta = new AuditService().buildWhere({ to: '2026-07-29' }).createdAt

  assert.equal(desde.gte.toISOString(), '2026-07-29T06:00:00.000Z')
  assert.equal(hasta.lt.toISOString(), '2026-07-30T06:00:00.000Z')
})
