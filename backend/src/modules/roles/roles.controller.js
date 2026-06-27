import { rolesService } from './roles.service.js'

export class RolesController {
  async list(req, res) {
    const result = await rolesService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const role = await rolesService.getById(req.params.id)

    return res.status(200).json({
      item: role
    })
  }

  async create(req, res) {
    const role = await rolesService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Rol creado correctamente',
      item: role
    })
  }

  async update(req, res) {
    const role = await rolesService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      item: role
    })
  }

  async remove(req, res) {
    await rolesService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Rol eliminado correctamente'
    })
  }
}

export const rolesController = new RolesController()