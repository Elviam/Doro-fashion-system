import { Router } from 'express'
import { ventasController } from './ventas.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions, requireAnyPermission } from '../../middlewares/requirePermissions.js'
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
  asyncHandler(ventasController.getMyVentas.bind(ventasController))
)

router.get(
  '/',
  authenticate,
  requireAnyPermission(['ventas:read', 'tienda:read']),
  validate(listVentasQuerySchema, 'query'),
  asyncHandler(ventasController.list.bind(ventasController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['ventas:read']),
  validate(ventaIdParamSchema, 'params'),
  asyncHandler(ventasController.getById.bind(ventasController))
)

router.post(
  '/',
  authenticate,
  validate(createVentaSchema),
  asyncHandler(ventasController.create.bind(ventasController))
)

router.patch(
  '/:id/estado',
  authenticate,
  requirePermissions(['ventas:update']),
  validate(ventaIdParamSchema, 'params'),
  validate(updateEstadoSchema),
  asyncHandler(ventasController.updateEstado.bind(ventasController))
)

export default router
