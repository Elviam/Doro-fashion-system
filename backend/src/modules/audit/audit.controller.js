import { auditService } from './audit.service.js'

export class AuditController {
  async list(req, res) {
    const result = await auditService.list(req.query)

    return res.status(200).json(result)
  }

  async getById(req, res) {
    const item = await auditService.getById(req.params.id)

    return res.status(200).json({
      item
    })
  }

  async create(req, res) {
    const item = await auditService.create(req.body)

    return res.status(201).json({
      message: 'Registro de auditoría creado correctamente',
      item
    })
  }
}

export const auditController = new AuditController()