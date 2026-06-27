import { Router } from 'express'
import { suppliersController } from './suppliers.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierIdParamSchema,
  toggleSupplierActiveSchema,
  updateSupplierSchema
} from './suppliers.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['suppliers:read']),
  validate(listSuppliersQuerySchema, 'query'),
  asyncHandler(suppliersController.list.bind(suppliersController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['suppliers:read']),
  validate(supplierIdParamSchema, 'params'),
  asyncHandler(suppliersController.getById.bind(suppliersController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['suppliers:create']),
  validate(createSupplierSchema),
  asyncHandler(suppliersController.create.bind(suppliersController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions(['suppliers:update']),
  validate(supplierIdParamSchema, 'params'),
  validate(updateSupplierSchema),
  asyncHandler(suppliersController.update.bind(suppliersController))
)

router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermissions(['suppliers:update']),
  validate(supplierIdParamSchema, 'params'),
  validate(toggleSupplierActiveSchema),
  asyncHandler(suppliersController.toggleActive.bind(suppliersController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['suppliers:delete']),
  validate(supplierIdParamSchema, 'params'),
  asyncHandler(suppliersController.remove.bind(suppliersController))
)

export default router