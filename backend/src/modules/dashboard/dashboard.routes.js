import { Router } from 'express'
import { dashboardController } from './dashboard.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { recentActivityQuerySchema } from './dashboard.schema.js'

const router = Router()

router.get(
  '/summary',
  authenticate,
  requirePermissions(['dashboard:read']),
  asyncHandler(dashboardController.summary.bind(dashboardController))
)

router.get(
  '/recent-activity',
  authenticate,
  requirePermissions(['dashboard:read']),
  validate(recentActivityQuerySchema, 'query'),
  asyncHandler(dashboardController.recentActivity.bind(dashboardController))
)

export default router