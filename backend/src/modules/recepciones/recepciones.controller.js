import { recepcionesService } from './recepciones.service.js'

export class RecepcionesController {
  async nextFolio(req, res) {
    const folio = await recepcionesService.getNextFolio()
    return res.status(200).json({ folio })
  }

  async list(req, res) {
    const result = await recepcionesService.list({
      ...req.query,
      origen: 'REABASTECIMIENTO'
    }, req.user)

    return res.status(200).json(result)
  }

  async listForConfirmation(req, res) {
    const result = await recepcionesService.list({
      ...req.query,
      origen: 'REABASTECIMIENTO'
    }, req.user)

    // El almacén solamente trabaja con mercancía que ya fue enviada o tiene
    // un resultado de recepción; nunca con borradores administrativos.
    result.items = result.items.filter((item) => item.status !== 'BORRADOR')
    result.total = result.items.length
    return res.status(200).json(result)
  }

  async getById(req, res) {
    const item = await recepcionesService.getById(req.params.id, req.user)

    return res.status(200).json({
      item
    })
  }

  async create(req, res) {
    if (req.body.origen !== 'REABASTECIMIENTO') {
      return res.status(400).json({ message: 'Este endpoint solo crea pedidos a proveedores' })
    }
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
    const result = await recepcionesService.confirm(
      req.params.id,
      req.body.items,
      req.body.facturaProveedor,
      req.body.facturaUrl,
      req.user
    )

    return res.status(200).json(result)
  }

  async attachInvoice(req, res) {
    const item = await recepcionesService.attachInvoice(req.params.id, req.body, req.user)
    return res.status(200).json({ message: 'Factura adjuntada correctamente', item })
  }
  
  async enviar(req, res) {
    const result = await recepcionesService.enviar(req.params.id, req.user)
    return res.status(200).json(result)
  }
  
  async cancel(req, res) {
    const result = await recepcionesService.cancelar(req.params.id, req.user)
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
