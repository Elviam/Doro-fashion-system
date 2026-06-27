import { Router } from 'express'
import { productsController } from './products.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions, requireAnyPermission } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  toggleProductActiveSchema,
  updateProductSchema
} from './products.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requireAnyPermission(['products:read', 'tienda:read']),
  validate(listProductsQuerySchema, 'query'),
  asyncHandler(productsController.list.bind(productsController))
)

router.get(
  '/:id',
  authenticate,
  requireAnyPermission(['products:read', 'tienda:read']),
  validate(productIdParamSchema, 'params'),
  asyncHandler(productsController.getById.bind(productsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['products:create']),
  validate(createProductSchema),
  asyncHandler(productsController.create.bind(productsController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions(['products:update']),
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(productsController.update.bind(productsController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions(['products:update']),
  validate(productIdParamSchema, 'params'),
  validate(toggleProductActiveSchema),
  asyncHandler(productsController.toggleActive.bind(productsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['products:delete']),
  validate(productIdParamSchema, 'params'),
  asyncHandler(productsController.remove.bind(productsController))
)

export default router