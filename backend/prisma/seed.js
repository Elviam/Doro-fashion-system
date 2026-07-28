import 'dotenv/config'
import bcrypt from 'bcryptjs'
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

  // The primary administrator is an existing internal ADMIN account.  This
  // seed never creates or touches CLIENT records and never overwrites a
  // password. Configure its stable email with PRIMARY_ADMIN_EMAIL; when it is
  // omitted we safely use the sole existing ADMIN, if there is exactly one.
  const configuredEmail = process.env.PRIMARY_ADMIN_EMAIL?.trim().toLowerCase()
  const admins = await prisma.user.findMany({
    where: { roleId: admin.id },
    select: { id: true, email: true, isPrimaryAdmin: true }
  })
  let configuredAdmin = configuredEmail
    ? admins.find((user) => user.email.toLowerCase() === configuredEmail)
    : (admins.length === 1 ? admins[0] : null)
  const existingPrimary = admins.find((user) => user.isPrimaryAdmin)

  if (existingPrimary && configuredAdmin && existingPrimary.id !== configuredAdmin.id) {
    throw new Error('Ya existe otro administrador principal; el seed no transferirÃ¡ esa condiciÃ³n automÃ¡ticamente.')
  }
  if (configuredEmail && !configuredAdmin) {
    const existingUser = await prisma.user.findUnique({ where: { email: configuredEmail }, select: { id: true, roleId: true } })
    if (existingUser) {
      throw new Error(`El correo configurado para administrador principal ya pertenece a una cuenta que no es ADMIN: ${configuredEmail}`)
    }
    if (admins.length > 0) {
      throw new Error(`No existe una cuenta ADMIN con el correo configurado para administrador principal: ${configuredEmail}`)
    }
    const usuario = process.env.PRIMARY_ADMIN_USUARIO?.trim()
    const password = process.env.PRIMARY_ADMIN_PASSWORD
    if (!usuario || !password) {
      throw new Error('Para una base sin administradores define PRIMARY_ADMIN_USUARIO y PRIMARY_ADMIN_PASSWORD; el seed no inventa credenciales.')
    }
    configuredAdmin = await prisma.user.create({
      data: {
        usuario,
        passwordHash: await bcrypt.hash(password, 10),
        nombre: process.env.PRIMARY_ADMIN_NOMBRE?.trim() || 'Administrador',
        apellido: process.env.PRIMARY_ADMIN_APELLIDO?.trim() || null,
        email: configuredEmail,
        roleId: admin.id,
        isPrimaryAdmin: true,
      },
      select: { id: true, email: true, isPrimaryAdmin: true }
    })
  }
  if (!existingPrimary && configuredAdmin) {
    await prisma.user.update({ where: { id: configuredAdmin.id }, data: { isPrimaryAdmin: true } })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
