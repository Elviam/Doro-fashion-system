import { inventoryService } from './inventory.service.js'

export class InventoryController {
  async list(req, res) {
    const result = await inventoryService.list(req.query)

    return res.status(200).json(result)
  }

  async getByProductId(req, res) {
    const item = await inventoryService.getByProductId(req.params.productId)

    return res.status(200).json({
      item
    })
  }

  async adjust(req, res) {
    const result = await inventoryService.adjust(
      req.params.productId,
      req.body,
      req.user
    )

    return res.status(200).json(result)
  }

  async listMovements(req, res) {
    const result = await inventoryService.listMovements(req.query)

    return res.status(200).json(result)
  }
}

export const inventoryController = new InventoryController()