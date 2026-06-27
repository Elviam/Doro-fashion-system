import { suppliersService } from './suppliers.service.js'

export class SuppliersController {
  async list(req, res) {
    const result = await suppliersService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const supplier = await suppliersService.getById(req.params.id)

    return res.status(200).json({
      item: supplier
    })
  }

  async create(req, res) {
    const supplier = await suppliersService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Proveedor creado correctamente',
      item: supplier
    })
  }

  async update(req, res) {
    const supplier = await suppliersService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Proveedor actualizado correctamente',
      item: supplier
    })
  }

  async toggleActive(req, res) {
    const supplier = await suppliersService.toggleActive(req.params.id, req.body.activo, req.user)

    return res.status(200).json({
      message: 'Estado del proveedor actualizado correctamente',
      item: supplier
    })
  }

  async remove(req, res) {
    await suppliersService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Proveedor eliminado correctamente'
    })
  }
}

export const suppliersController = new SuppliersController()