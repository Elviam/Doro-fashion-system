import { Router } from 'express'
import { auditController } from './audit.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  auditIdParamSchema,
  createAuditSchema,
  listAuditQuerySchema
} from './audit.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['audit:read']),
  validate(listAuditQuerySchema, 'query'),
  asyncHandler(auditController.list.bind(auditController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['audit:read']),
  validate(auditIdParamSchema, 'params'),
  asyncHandler(auditController.getById.bind(auditController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['audit:read']),
  validate(createAuditSchema),
  asyncHandler(auditController.create.bind(auditController))
)

export default router