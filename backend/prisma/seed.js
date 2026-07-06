/*import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PERMISOS = [
  'dashboard:read',
  'ventas:read', 'ventas:create', 'ventas:update', 'ventas:delete',
  'products:read', 'products:create', 'products:update', 'products:delete',
  'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
  'recepciones:read', 'recepciones:create', 'recepciones:update', 'recepciones:delete',
  'clients:read', 'clients:create', 'clients:update', 'clients:delete',
  'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
  'users:read', 'users:create', 'users:update', 'users:delete',
  'roles:read', 'roles:create', 'roles:update', 'roles:delete',
  'audit:read',
]

const PERMISOS_POR_ROL = {
  ADMIN: PERMISOS,
  GERENTE: PERMISOS,
  BODEGUERO: [
    'dashboard:read',
    'products:read', 'products:create', 'products:update',
    'inventory:read', 'inventory:create', 'inventory:update',
    'recepciones:read', 'recepciones:create', 'recepciones:update',
    'clients:read',
    'suppliers:read', 'suppliers:create', 'suppliers:update',
    'ventas:read',
  ],
  VENDEDOR: [
    'products:read',
    'ventas:read', 'ventas:create', 'ventas:update',
    'clients:read', 'clients:create',
  ],
}

async function main() {
  const perms = await Promise.all(
    PERMISOS.map((code) =>
      prisma.permission.upsert({ where: { code }, update: {}, create: { code } })
    )
  )
  const permsByCode = Object.fromEntries(perms.map((p) => [p.code, p]))

  for (const [codigo, permisosDelRol] of Object.entries(PERMISOS_POR_ROL)) {
    const nombre = {
      ADMIN: 'Administrador',
      GERENTE: 'Gerente',
      BODEGUERO: 'Bodeguero',
      VENDEDOR: 'Vendedor',
    }[codigo]

    const role = await prisma.role.upsert({
      where: { codigo },
      update: {},
      create: { codigo, nombre },
    })

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    await prisma.rolePermission.createMany({
      data: permisosDelRol.map((code) => ({
        roleId: role.id,
        permissionId: permsByCode[code].id,
      })),
    })
  }

  await prisma.role.upsert({
    where: { codigo: 'CLIENTE' },
    update: {},
    create: { codigo: 'CLIENTE', nombre: 'Cliente' },
  })

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { codigo: 'ADMIN' } })
  const passwordHash = await bcrypt.hash('CambiaEstaClave123!', 10)

  await prisma.user.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      usuario: 'admin',
      passwordHash,
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@doro.com',
      roleId: adminRole.id,
      activo: true,
    },
  })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())*/