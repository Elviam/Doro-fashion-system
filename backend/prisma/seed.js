import 'dotenv/config'
import { createPrismaClient } from '../src/lib/prisma.js'

// Seeding is an administrative task, so it uses Neon’s direct connection.
const prisma = createPrismaClient(process.env.DIRECT_URL || process.env.DATABASE_URL)

const RECEPCION_PERMISSIONS = [
  'recepciones:read',
  'recepciones:create',
  'recepciones:update',
  'recepciones:enviar',
  'recepciones:confirm',
  'recepciones:cancel',
  'recepciones:delete'
]

const BODEGUERO_DEFAULT_PERMISSIONS = [
  'inventory:read',
  'inventory:update',
  'recepciones:read',
  'recepciones:confirm',
  'fulfillment:read',
  'fulfillment:update'
]

async function ensurePermissions() {
  const permissions = []

  for (const code of [...new Set([...RECEPCION_PERMISSIONS, ...BODEGUERO_DEFAULT_PERMISSIONS])]) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: `Permiso ${code}` }
    })
    permissions.push(permission)
  }

  const allPermissions = await prisma.permission.findMany({ select: { id: true, code: true } })
  return Object.fromEntries(allPermissions.map((permission) => [permission.code, permission.id]))
}

async function replaceRolePermissions(roleId, permissionsByCode, permissionCodes) {
  await prisma.rolePermission.deleteMany({
    where: { roleId }
  })

  await prisma.rolePermission.createMany({
    data: permissionCodes.map((code) => ({
      roleId,
      permissionId: permissionsByCode[code]
    }))
  })
}

async function main() {
  const permissionsByCode = await ensurePermissions()

  const admin = await prisma.role.upsert({
    where: { codigo: 'ADMIN' },
    update: { nombre: 'Administrador' },
    create: { codigo: 'ADMIN', nombre: 'Administrador' }
  })
  const allPermissions = await prisma.permission.findMany({ select: { code: true } })
  await replaceRolePermissions(admin.id, permissionsByCode, allPermissions.map((permission) => permission.code))

  const bodeguero = await prisma.role.upsert({
    where: { codigo: 'BODEGUERO' },
    update: { nombre: 'Bodeguero' },
    create: { codigo: 'BODEGUERO', nombre: 'Bodeguero' }
  })
  await replaceRolePermissions(bodeguero.id, permissionsByCode, BODEGUERO_DEFAULT_PERMISSIONS)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
