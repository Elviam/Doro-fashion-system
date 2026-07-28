import { prisma } from '../../lib/prisma.js'

const userInclude = {
  role: {
    include: {
      permissions: { include: { permission: true } }
    }
  },
  revokedPermissions: { include: { permission: true } },
  grantedPermissions: { include: { permission: true } }
}

// Esto es lo que resuelve el bug de useProtectedRoute: el service layer y el
// frontend siguen esperando `user.role` como string legible ("ADMIN"), no
// como el cuid de roleId. Aquí lo reconstruimos a partir de la relación,
// dejando `roleId` intacto (sigue siendo el cuid real, como debe ser en una
// FK), pero agregando `role` (código) y `permissions` (array de códigos)
// tal como los recibía el frontend desde Firestore.
function mapUser(user) {
  if (!user) return null
  const { role, revokedPermissions = [], grantedPermissions = [], ...rest } = user
  const revokedCodes = revokedPermissions.map((item) => item.permission.code)
  const grantedCodes = grantedPermissions.map((item) => item.permission.code)
  const rolePermissions = role?.permissions?.map((item) => item.permission.code) ?? []

  return {
    ...rest,
    role: role?.codigo ?? null,
    isPrimaryAdmin: rest.isPrimaryAdmin ?? false,
    permissions: [...new Set([...rolePermissions.filter((code) => !revokedCodes.includes(code)), ...grantedCodes])],
    revokedPermissions: revokedCodes,
    grantedPermissions: grantedCodes
  }
}

export class UsersRepository {
  async findAll() {
    const users = await prisma.user.findMany({ include: userInclude })
    return users.map(mapUser)
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: userInclude
    })
    return mapUser(user)
  }

  async findByUsuario(usuario) {
    const user = await prisma.user.findUnique({
      where: { usuario },
      include: userInclude
    })
    return mapUser(user)
  }

  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: userInclude
    })
    return mapUser(user)
  }

  async findRoleById(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    })

    if (!role) return null

    return {
      id: role.id,
      codigo: role.codigo,
      permissions: role.permissions.map((item) => item.permission.code)
    }
  }

  async findPermissionCodes(codes) {
    const permissions = await prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { code: true }
    })
    return permissions.map((permission) => permission.code)
  }

  // IMPORTANTE: `data.roleId` aquí DEBE ser el cuid real del Role, no el
  // código ("ADMIN"/"CLIENTE"). Si tu service todavía arma el objeto de
  // creación con roleId: 'CLIENTE' (como en tu script viejo de
  // createClientUser.js), tienes que resolverlo primero, ej:
  //   const role = await rolesRepository.findByNombre('CLIENTE')
  //   usersRepository.create({ ...data, roleId: role.id })
  // Si te llega un campo `role` (string) en vez de roleId, lo descartamos
  // aquí para que Prisma no truene por columna inexistente.
  async create(data) {
    const { role, revokedPermissions, grantedPermissions, ...userData } = data
    const user = await prisma.user.create({
      data: {
        ...userData,
        ...(revokedPermissions !== undefined
          ? {
              revokedPermissions: {
                create: revokedPermissions.map((code) => ({ permission: { connect: { code } } }))
              }
            }
          : {}),
        ...(grantedPermissions !== undefined
          ? {
              grantedPermissions: {
                create: grantedPermissions.map((code) => ({ permission: { connect: { code } } }))
              }
            }
          : {})
      },
      include: userInclude
    })
    return mapUser(user)
  }

  async update(id, data) {
    const { role, revokedPermissions, grantedPermissions, ...userData } = data
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(revokedPermissions !== undefined
          ? {
              revokedPermissions: {
                deleteMany: {},
                create: revokedPermissions.map((code) => ({ permission: { connect: { code } } }))
              }
            }
          : {}),
        ...(grantedPermissions !== undefined
          ? {
              grantedPermissions: {
                deleteMany: {},
                create: grantedPermissions.map((code) => ({ permission: { connect: { code } } }))
              }
            }
          : {})
      },
      include: userInclude
    })
    return mapUser(user)
  }

  async remove(id) {
    await prisma.user.delete({ where: { id } })
    return true
  }

  async hasHistoricalRelations(id) {
    const [sales, auditLogs] = await Promise.all([
      prisma.sale.count({ where: { vendedorId: id } }),
      prisma.auditLog.count({ where: { userId: id } })
    ])
    return sales > 0 || auditLogs > 0
  }
}

export const usersRepository = new UsersRepository()
