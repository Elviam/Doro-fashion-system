import { clientsService } from './clients.service.js'

export class ClientsController {
  async listMyAddresses(req, res) {
    return res.status(200).json(await clientsService.listMyAddresses(req.user))
  }

  async createMyAddress(req, res) {
    const item = await clientsService.createMyAddress(req.body, req.user)
    return res.status(201).json({ item })
  }

  async updateMyAddress(req, res) {
    const item = await clientsService.updateMyAddress(req.params.addressId, req.body, req.user)
    return res.status(200).json({ item })
  }

  async removeMyAddress(req, res) {
    await clientsService.removeMyAddress(req.params.addressId, req.user)
    return res.status(204).send()
  }

  async list(req, res) {
    const result = await clientsService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const client = await clientsService.getById(req.params.id)

    return res.status(200).json({
      item: client
    })
  }

  async create(req, res) {
    const client = await clientsService.create(req.body, req.user)

    return res.status(201).json({
      message: 'Cliente creado correctamente',
      item: client
    })
  }

  async update(req, res) {
    const client = await clientsService.update(req.params.id, req.body, req.user)

    return res.status(200).json({
      message: 'Cliente actualizado correctamente',
      item: client
    })
  }

  async toggleActive(req, res) {
    const client = await clientsService.toggleActive(req.params.id, req.body.activo, req.user)

    return res.status(200).json({
      message: 'Estado del cliente actualizado correctamente',
      item: client
    })
  }

  async remove(req, res) {
    await clientsService.remove(req.params.id, req.user)

    return res.status(200).json({
      message: 'Cliente eliminado correctamente'
    })
  }
}

export const clientsController = new ClientsController()
