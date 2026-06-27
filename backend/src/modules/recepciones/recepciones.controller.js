import { recepcionesService } from './recepciones.service.js'

export class RecepcionesController {
  async nextFolio(req, res) {
    const folio = await recepcionesService.getNextFolio()
    return res.status(200).json({ folio })
  }

  async list(req, res) {
    const result = await recepcionesService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const item = await recepcionesService.getById(req.params.id)

    return res.status(200).json({
      item
    })
  }

  async create(req, res) {
    const item = await recepcionesService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Recepción creada correctamente',
      item
    })
  }

  async update(req, res) {
    const item = await recepcionesService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Recepción actualizada correctamente',
      item
    })
  }

  async confirm(req, res) {
    const result = await recepcionesService.confirm(req.params.id, req.user)

    return res.status(200).json(result)
  }

  async remove(req, res) {
    await recepcionesService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Recepción eliminada correctamente'
    })
  }
}

export const recepcionesController = new RecepcionesController()