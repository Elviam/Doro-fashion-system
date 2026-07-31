import { prisma } from '../../lib/prisma.js'

const staffInclude = {
  role: true,
  revokedPermissions: { include: { permission: true } },
  grantedPermissions: { include: { permission: true } }
}

export class AuthRepository {
  async findByUsuario(usuario) {
    const user = await prisma.user.findUnique({ where: { usuario }, include: staffInclude })
    return user ? this.mapStaff(user) : null
  }

  async findById(id) {
    const user = await prisma.user.findUnique({ where: { id }, include: staffInclude })
    return user ? this.mapStaff(user) : null
  }

  async findClientByEmail(email) {
    return prisma.client.findUnique({ where: { email } })
  }

  async findClientById(id) {
    return prisma.client.findUnique({ where: { id } })
  }

  async createClient(data) {
    return prisma.client.create({ data })
  }

  async updateClientPassword(id, passwordHash) {
    return prisma.client.update({ where: { id }, data: { passwordHash } })
  }

  async findPermissionsByRoleId(roleId, revokedPermissions = [], grantedPermissions = []) {
    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { codigo: true } })
    if (role?.codigo === 'ADMIN') return (await prisma.permission.findMany({ select: { code: true } })).map((permission) => permission.code)
    const rolePermissions = await prisma.rolePermission.findMany({ where: { roleId }, include: { permission: true } })
    return [...new Set([...rolePermissions.map((item) => item.permission.code).filter((code) => !revokedPermissions.includes(code)), ...grantedPermissions])]
  }

  async updatePassword(userId, passwordHash) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  }

  mapStaff(user) {
    return {
      id: user.id, usuario: user.usuario, passwordHash: user.passwordHash, nombre: user.nombre, apellido: user.apellido,
      email: user.email, role: user.role?.codigo ?? null, roleId: user.roleId, isPrimaryAdmin: user.isPrimaryAdmin ?? false,
      revokedPermissions: user.revokedPermissions?.map((item) => item.permission.code) ?? [],
      grantedPermissions: user.grantedPermissions?.map((item) => item.permission.code) ?? [], activo: user.activo, createdAt: user.createdAt
    }
  }
}

export const authRepository = new AuthRepository()
