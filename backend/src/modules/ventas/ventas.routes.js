import { Router } from 'express'
import { ventasController } from './ventas.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions, requireAnyPermission, requireClientAccount, requireStaffAccount } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createVentaSchema,
  ventaIdParamSchema,
  updateEstadoSchema,
  listVentasQuerySchema,
} from './ventas.schema.js'

const router = Router()

router.get(
  '/me',
  authenticate,
  requireClientAccount,
  asyncHandler(ventasController.getMyVentas.bind(ventasController))
)

router.get(
  '/',
  authenticate,
  requireStaffAccount,
  requireAnyPermission(['ventas:read', 'tienda:read']),
  validate(listVentasQuerySchema, 'query'),
  asyncHandler(ventasController.list.bind(ventasController))
)

router.get(
  '/:id',
  authenticate,
  requireStaffAccount,
  requirePermissions(['ventas:read']),
  validate(ventaIdParamSchema, 'params'),
  asyncHandler(ventasController.getById.bind(ventasController))
)

router.post(
  '/',
  authenticate,
  requireClientAccount,
  validate(createVentaSchema),
  asyncHandler(ventasController.create.bind(ventasController))
)

router.post(
  '/:id/simulate-payment',
  authenticate,
  requireClientAccount,
  validate(ventaIdParamSchema, 'params'),
  asyncHandler(ventasController.simulatePayment.bind(ventasController))
)

router.patch(
  '/:id/estado',
  authenticate,
  requireStaffAccount,
  requirePermissions(['ventas:update']),
  validate(ventaIdParamSchema, 'params'),
  validate(updateEstadoSchema),
  asyncHandler(ventasController.updateEstado.bind(ventasController))
)

export default router
