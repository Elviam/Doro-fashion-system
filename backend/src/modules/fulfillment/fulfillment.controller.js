import { fulfillmentService } from './fulfillment.service.js'

export class FulfillmentController {
  async list(req, res) {
    return res.status(200).json(await fulfillmentService.list())
  }

  async dispatch(req, res) {
    const item = await fulfillmentService.dispatch(req.params.id, req.user)
    return res.status(200).json({ message: 'Pedido preparado y enviado a paqueteria correctamente', item })
  }

  async updateShippingStatus(req, res) {
    const item = await fulfillmentService.updateShippingStatus(req.params.id, req.body.estadoEnvio, req.user)
    return res.status(200).json({ message: 'Seguimiento actualizado correctamente', item })
  }
}

export const fulfillmentController = new FulfillmentController()
