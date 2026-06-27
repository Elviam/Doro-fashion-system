import { Router } from 'express'
import { notificationsController } from './notifications.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  authenticate,
  asyncHandler(notificationsController.list.bind(notificationsController))
)

export default router