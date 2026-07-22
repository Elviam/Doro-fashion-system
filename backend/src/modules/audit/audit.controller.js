import { auditService } from './audit.service.js'

export class AuditController {
  async list(req, res) {
    return res.status(200).json(await auditService.list(req.query))
  }

  async getById(req, res) {
    return res.status(200).json({ item: await auditService.getById(req.params.id) })
  }

  async filters(req, res) {
    return res.status(200).json(await auditService.getFilters())
  }
}

export const auditController = new AuditController()
