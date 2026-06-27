import { ventasService } from './ventas.service.js'

export class VentasController {
  async list(req, res) {
    const result = await ventasService.list(req.query)

    return res.status(200).json(result)
  }

  async getMyVentas(req, res) {
    const result = await ventasService.getMyVentas(req.user)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const venta = await ventasService.getById(req.params.id)

    return res.status(200).json({
      item: venta
    })
  }

  async create(req, res) {
    const venta = await ventasService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Venta registrada correctamente',
      item: venta
    })
  }

  async updateEstado(req, res) {
    const venta = await ventasService.updateEstado(req.params.id, req.body.estado, req.user)

    return res.status(200).json({
      message: 'Estado de la venta actualizado correctamente',
      item: venta
    })
  }
}

export const ventasController = new VentasController()
