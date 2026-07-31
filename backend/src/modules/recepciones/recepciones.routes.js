import { Router } from 'express'
import { recepcionesController } from './recepciones.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requireAnyPermission, requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  confirmRecepcionSchema,
  attachReceptionInvoiceSchema,
  createRecepcionSchema,
  listRecepcionesQuerySchema,
  recepcionIdParamSchema,
  updateRecepcionSchema
} from './recepciones.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['reabastecimiento:read']),
  validate(listRecepcionesQuerySchema, 'query'),
  asyncHandler(recepcionesController.list.bind(recepcionesController))
)

// Vista operativa del almacén. Conserva el mismo modelo de datos, pero no
// expone el listado administrativo de pedidos de proveedor.
router.get(
  '/pendientes',
  authenticate,
  requirePermissions(['recepciones:read']),
  validate(listRecepcionesQuerySchema, 'query'),
  asyncHandler(recepcionesController.listForConfirmation.bind(recepcionesController))
)

router.get(
  '/next-folio',
  authenticate,
  requirePermissions(['pedidos_proveedor:create']),
  asyncHandler(recepcionesController.nextFolio.bind(recepcionesController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['reabastecimiento:read']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.getById.bind(recepcionesController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['pedidos_proveedor:create']),
  validate(createRecepcionSchema),
  asyncHandler(recepcionesController.create.bind(recepcionesController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions(['recepciones:update']),
  validate(recepcionIdParamSchema, 'params'),
  validate(updateRecepcionSchema),
  asyncHandler(recepcionesController.update.bind(recepcionesController))
)

router.patch(
  '/:id/confirm',
  authenticate,
  requirePermissions(['recepciones:confirm']),
  validate(recepcionIdParamSchema, 'params'),
  validate(confirmRecepcionSchema),
  asyncHandler(recepcionesController.confirm.bind(recepcionesController))
)

router.patch(
  '/:id/factura',
  authenticate,
  requirePermissions(['recepciones:confirm']),
  validate(recepcionIdParamSchema, 'params'),
  validate(attachReceptionInvoiceSchema),
  asyncHandler(recepcionesController.attachInvoice.bind(recepcionesController))
)

router.patch(
  '/:id/enviar',
  authenticate,
  requirePermissions(['pedidos_proveedor:send']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.enviar.bind(recepcionesController))
)

router.patch(
  '/:id/cancel',
  authenticate,
  requireAnyPermission(['pedidos_proveedor:send', 'recepciones:cancel']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.cancel.bind(recepcionesController))
)

router.delete(
  '/:id',
  authenticate,
  requireAnyPermission(['pedidos_proveedor:create', 'recepciones:delete']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.remove.bind(recepcionesController))
)

export default router
