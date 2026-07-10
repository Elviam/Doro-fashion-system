import { prisma } from '../../lib/prisma.js'

export class AuthRepository {
  async findByUsuario(usuario) {
    const user = await prisma.user.findUnique({ where: { usuario }, include: { role: true } })
    if (!user) return null
    return this.mapUser(user)
  }

  async findById(id) {
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } })
    if (!user) return null
    return this.mapUser(user)
  }

  async findByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } })
    if (!user) return null
    return this.mapUser(user)
  }

  async findPermissionsByRoleId(roleId) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    })
    return rolePermissions.map((rp) => rp.permission.code)
  }

  async findRoleByCodigo(codigo) {
    return prisma.role.findUnique({ where: { codigo } })
  }

  async createUser(data) {
    const user = await prisma.user.create({ data, include: { role: true } })
    return this.mapUser(user)
  }

  async updatePassword(userId, passwordHash) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  }

  // One active reset code per user (matches the unique constraint on
  // PasswordReset.userId) — upsert overwrites any previous code.
  async upsertPasswordReset(userId, { code, expiresAt }) {
    return prisma.passwordReset.upsert({
      where: { userId },
      update: { code, expiresAt, used: false },
      create: { userId, code, expiresAt },
    })
  }

  async findPasswordResetByUserId(userId) {
    return prisma.passwordReset.findUnique({ where: { userId } })
  }

  async markPasswordResetUsed(userId) {
    return prisma.passwordReset.update({ where: { userId }, data: { used: true } })
  }

  async deletePasswordReset(userId) {
    return prisma.passwordReset.delete({ where: { userId } }).catch(() => null)
  }

  mapUser(user) {
    return {
      id: user.id,
      usuario: user.usuario,
      passwordHash: user.passwordHash,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      role: user.role?.codigo ?? null,
      roleId: user.roleId,
      activo: user.activo,
      createdAt: user.createdAt, 
    }
  }
}

export const authRepository = new AuthRepository()