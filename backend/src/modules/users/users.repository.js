import { prisma } from '../../lib/prisma.js'

const roleInclude = {
  role: {
    include: {
      permissions: { include: { permission: true } }
    }
  }
}

// Esto es lo que resuelve el bug de useProtectedRoute: el service layer y el
// frontend siguen esperando `user.role` como string legible ("ADMIN"), no
// como el cuid de roleId. Aquí lo reconstruimos a partir de la relación,
// dejando `roleId` intacto (sigue siendo el cuid real, como debe ser en una
// FK), pero agregando `role` (código) y `permissions` (array de códigos)
// tal como los recibía el frontend desde Firestore.
function mapUser(user) {
  if (!user) return null
  const { role, ...rest } = user
  return {
    ...rest,
    role: role?.codigo ?? null,
    permissions: role?.permissions?.map((rp) => rp.permission.code) ?? []
  }
}

export class UsersRepository {
  async findAll() {
    const users = await prisma.user.findMany({ include: roleInclude })
    return users.map(mapUser)
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: roleInclude
    })
    return mapUser(user)
  }

  async findByUsuario(usuario) {
    const user = await prisma.user.findUnique({
      where: { usuario },
      include: roleInclude
    })
    return mapUser(user)
  }

  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: roleInclude
    })
    return mapUser(user)
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
    const { role, permissions, ...userData } = data
    const user = await prisma.user.create({
      data: userData,
      include: roleInclude
    })
    return mapUser(user)
  }

  async update(id, data) {
    const { role, permissions, ...userData } = data
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      include: roleInclude
    })
    return mapUser(user)
  }

  async remove(id) {
    await prisma.user.delete({ where: { id } })
    return true
  }
}

export const usersRepository = new UsersRepository()