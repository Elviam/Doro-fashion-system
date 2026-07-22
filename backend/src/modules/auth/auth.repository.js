import { prisma } from '../../lib/prisma.js'

const userInclude = {
  role: true,
  revokedPermissions: { include: { permission: true } },
  grantedPermissions: { include: { permission: true } }
}

export class AuthRepository {
  async findByUsuario(usuario) {
    const user = await prisma.user.findUnique({ where: { usuario }, include: userInclude })
    if (!user) return null
    return this.mapUser(user)
  }

  async findById(id) {
    const user = await prisma.user.findUnique({ where: { id }, include: userInclude })
    if (!user) return null
    return this.mapUser(user)
  }

  async findByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email }, include: userInclude })
    if (!user) return null
    return this.mapUser(user)
  }

  async findPermissionsByRoleId(roleId, revokedPermissions = [], grantedPermissions = []) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    })
    const roleCodes = rolePermissions
      .map((rp) => rp.permission.code)
      .filter((code) => !revokedPermissions.includes(code))
    return [...new Set([...roleCodes, ...grantedPermissions])]
  }

  async findRoleByCodigo(codigo) {
    return prisma.role.findUnique({ where: { codigo } })
  }

  async createUser(data) {
    const user = await prisma.user.create({ data, include: userInclude })
    return this.mapUser(user)
  }

  async createClientUserWithProfile(userData) {
    const { user, client } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: userData,
        include: userInclude
      })
      const existingClient = await tx.client.findUnique({ where: { email: userData.email } })
      const profile = existingClient
        ? await tx.client.update({
            where: { id: existingClient.id },
            data: { userId: createdUser.id }
          })
        : await tx.client.create({
            data: {
              userId: createdUser.id,
              nombre: userData.nombre,
              email: userData.email,
              activo: userData.activo ?? true,
            }
          })

      return { user: createdUser, client: profile }
    })

    return { user: this.mapUser(user), client }
  }

  async ensureClientProfile(user) {
    if (!user?.id || !user?.email) return null

    return prisma.$transaction(async (tx) => {
      const linkedClient = await tx.client.findUnique({ where: { userId: user.id } })
      if (linkedClient) return linkedClient

      const clientByEmail = await tx.client.findUnique({ where: { email: user.email } })
      if (clientByEmail) {
        return tx.client.update({
          where: { id: clientByEmail.id },
          data: { userId: user.id }
        })
      }

      return tx.client.create({
        data: {
          userId: user.id,
          nombre: user.nombre,
          email: user.email,
          activo: user.activo ?? true,
        }
      })
    })
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
      revokedPermissions: user.revokedPermissions?.map((item) => item.permission.code) ?? [],
      grantedPermissions: user.grantedPermissions?.map((item) => item.permission.code) ?? [],
      activo: user.activo,
      createdAt: user.createdAt, 
    }
  }
}

export const authRepository = new AuthRepository()
