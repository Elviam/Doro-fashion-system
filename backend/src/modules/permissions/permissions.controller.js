import { permissionsService } from './permissions.service.js'

export class PermissionsController {
  async list(req, res) {
    const result = await permissionsService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const permission = await permissionsService.getById(req.params.id)

    return res.status(200).json({
      item: permission
    })
  }

  async create(req, res) {
    const permission = await permissionsService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Permiso creado correctamente',
      item: permission
    })
  }

  async seed(req, res) {
    const result = await permissionsService.seed(req.user)

    return res.status(200).json(result)
  }

  async update(req, res) {
    const permission = await permissionsService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Permiso actualizado correctamente',
      item: permission
    })
  }

  async remove(req, res) {
    await permissionsService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Permiso eliminado correctamente'
    })
  }
}

export const permissionsController = new PermissionsController()