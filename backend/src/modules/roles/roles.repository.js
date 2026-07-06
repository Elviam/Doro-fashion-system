import { prisma } from '../../lib/prisma.js'

const permissionsInclude = {
  permissions: { include: { permission: true } }
}

// Aplana la relación RolePermission -> Permission a un array de códigos,
// igual a como lo tenías en Firestore: { permissions: ['users:read', ...] }
function mapRole(role) {
  if (!role) return null
  const { permissions, ...rest } = role
  return {
    ...rest,
    permissions: permissions.map((rp) => rp.permission.code)
  }
}

export class RolesRepository {
  async findAll() {
    const roles = await prisma.role.findMany({ include: permissionsInclude })
    return roles.map(mapRole)
  }

  async findById(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: permissionsInclude
    })
    return mapRole(role)
  }

  // OJO: en Firestore buscabas por `nombre` (ej. "ADMIN"). En tu schema
  // actual el campo único con ese propósito es `codigo`, no `nombre`
  // (`nombre` ahora es el nombre para mostrar, ej. "Administrador").
  // Mantengo el nombre del método para no romper call sites, pero
  // internamente busca por `codigo`.
  async findByNombre(codigo) {
    const role = await prisma.role.findUnique({
      where: { codigo },
      include: permissionsInclude
    })
    return mapRole(role)
  }

  async create(data) {
    const { permissions = [], ...roleData } = data
    const role = await prisma.role.create({
      data: {
        ...roleData,
        permissions: {
          create: permissions.map((code) => ({
            permission: { connect: { code } }
          }))
        }
      },
      include: permissionsInclude
    })
    return mapRole(role)
  }

  async update(id, data) {
    const { permissions, ...roleData } = data

    if (permissions) {
      // Reemplazo completo del set de permisos, igual que el batch.set
      // con merge que hacías en seedRoles.js
      await prisma.rolePermission.deleteMany({ where: { roleId: id } })
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        ...(permissions
          ? {
              permissions: {
                create: permissions.map((code) => ({
                  permission: { connect: { code } }
                }))
              }
            }
          : {})
      },
      include: permissionsInclude
    })
    return mapRole(role)
  }

  async remove(id) {
    await prisma.role.delete({ where: { id } })
    return true
  }
}

export const rolesRepository = new RolesRepository()