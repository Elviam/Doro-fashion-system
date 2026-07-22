import { Router } from 'express'
import { auditController } from './audit.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { auditIdParamSchema, listAuditQuerySchema } from './audit.schema.js'

const router = Router()

router.get('/', authenticate, requirePermissions(['audit:read']), validate(listAuditQuerySchema, 'query'), asyncHandler(auditController.list.bind(auditController)))
router.get('/filters', authenticate, requirePermissions(['audit:read']), asyncHandler(auditController.filters.bind(auditController)))
router.get('/:id', authenticate, requirePermissions(['audit:read']), validate(auditIdParamSchema, 'params'), asyncHandler(auditController.getById.bind(auditController)))

export default router
