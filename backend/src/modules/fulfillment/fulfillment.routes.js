import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { fulfillmentController } from './fulfillment.controller.js'
import { fulfillmentSaleIdParamSchema, shippingStatusSchema } from './fulfillment.schema.js'

const router = Router()

router.get('/', authenticate, requirePermissions(['fulfillment:read']), asyncHandler(fulfillmentController.list.bind(fulfillmentController)))
router.patch('/:id/dispatch', authenticate, requirePermissions(['fulfillment:update']), validate(fulfillmentSaleIdParamSchema, 'params'), asyncHandler(fulfillmentController.dispatch.bind(fulfillmentController)))
router.patch('/:id/shipping-status', authenticate, requirePermissions(['fulfillment:update']), validate(fulfillmentSaleIdParamSchema, 'params'), validate(shippingStatusSchema), asyncHandler(fulfillmentController.updateShippingStatus.bind(fulfillmentController)))

export default router
