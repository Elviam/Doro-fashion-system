import { prisma } from '../src/lib/prisma.js'


const MISSING_PERMISSIONS = [
  { code: 'permissions:read', description: 'Permite listar y ver permisos' },
  { code: 'permissions:create', description: 'Permite crear permisos' },
  { code: 'permissions:update', description: 'Permite actualizar permisos' },
  { code: 'permissions:delete', description: 'Permite eliminar permisos' },
  { code: 'permissions:seed', description: 'Permite sembrar permisos base' }
]

async function main() {
  console.log('🚀 Creando permisos faltantes del módulo permissions...')

  const created = []
  for (const perm of MISSING_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: perm
    })
    created.push(permission)
    console.log(`  ✓ ${permission.code}`)
  }

  const adminRole = await prisma.role.findUnique({ where: { codigo: 'ADMIN' } })

  if (!adminRole) {
    console.error('❌ No se encontró el rol ADMIN (codigo: "ADMIN"). Nada que conectar.')
    process.exit(1)
  }

  console.log(`🔗 Conectando permisos al rol ADMIN (${adminRole.id})...`)

  await prisma.rolePermission.createMany({
    data: created.map((permission) => ({
      roleId: adminRole.id,
      permissionId: permission.id
    })),
    skipDuplicates: true
  })

  console.log('✅ Listo. Cierra sesión y vuelve a entrar para que el nuevo JWT incluya estos permisos.')
}

main()
  .catch((error) => {
    console.error('❌ Error al sembrar permisos:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())