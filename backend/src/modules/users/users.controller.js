import { usersService } from './users.service.js'

export class UsersController {
  async list(req, res) {
    const result = await usersService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const user = await usersService.getById(req.params.id)

    return res.status(200).json({
      item: user
    })
  }

  async create(req, res) {
    const user = await usersService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      item: user
    })
  }

  async update(req, res) {
    const user = await usersService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Usuario actualizado correctamente',
      item: user
    })
  }

  async toggleActive(req, res) {
    const user = await usersService.toggleActive(req.params.id, req.body.activo, req.user)

    return res.status(200).json({
      message: 'Estado del usuario actualizado correctamente',
      item: user
    })
  }

  async remove(req, res) {
    await usersService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Usuario eliminado correctamente'
    })
  }
}

export const usersController = new UsersController()