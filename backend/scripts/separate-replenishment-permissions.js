import 'dotenv/config'
import { createPrismaClient } from '../src/lib/prisma.js'

const prisma = createPrismaClient(process.env.DIRECT_URL || process.env.DATABASE_URL)
const permissions = [
  ['reabastecimiento:read', 'Ver reabastecimiento', 'reabastecimiento'],
  ['pedidos_proveedor:create', 'Crear pedido a proveedor', 'reabastecimiento'],
  ['pedidos_proveedor:send', 'Enviar pedido a proveedor', 'reabastecimiento'],
]
const dryRun = process.argv.includes('--dry-run')

async function main() {
  const plan = await prisma.$transaction(async (tx) => {
    const admin = await tx.role.findUnique({ where: { codigo: 'ADMIN' }, select: { id: true } })
    if (!admin) throw new Error('No existe el rol ADMIN')
    const existing = await tx.permission.findMany({ where: { code: { in: permissions.map(([code]) => code) } }, select: { id: true, code: true } })
    const missing = permissions.filter(([code]) => !existing.some((permission) => permission.code === code))
    if (dryRun) return { missing: missing.map(([code]) => code), roleLinks: permissions.map(([code]) => code) }
    for (const [code, nombre, modulo] of missing) await tx.permission.create({ data: { code, nombre, descripcion: nombre, modulo } })
    const created = await tx.permission.findMany({ where: { code: { in: permissions.map(([code]) => code) } }, select: { id: true, code: true } })
    for (const permission of created) await tx.rolePermission.upsert({ where: { roleId_permissionId: { roleId: admin.id, permissionId: permission.id } }, update: {}, create: { roleId: admin.id, permissionId: permission.id } })
    return { missing: missing.map(([code]) => code), roleLinks: created.map((permission) => permission.code) }
  })
  console.log(JSON.stringify({ dryRun, ...plan }, null, 2))
}

main().finally(() => prisma.$disconnect())
