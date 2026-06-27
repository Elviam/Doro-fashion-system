import { Router } from 'express'
import { recepcionesController } from './recepciones.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createRecepcionSchema,
  listRecepcionesQuerySchema,
  recepcionIdParamSchema,
  updateRecepcionSchema
} from './recepciones.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['recepciones:read']),
  validate(listRecepcionesQuerySchema, 'query'),
  asyncHandler(recepcionesController.list.bind(recepcionesController))
)

router.get(
  '/next-folio',
  authenticate,
  requirePermissions(['recepciones:create']),
  asyncHandler(recepcionesController.nextFolio.bind(recepcionesController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['recepciones:read']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.getById.bind(recepcionesController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['recepciones:create']),
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
  requirePermissions(['recepciones:update']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.confirm.bind(recepcionesController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['recepciones:delete']),
  validate(recepcionIdParamSchema, 'params'),
  asyncHandler(recepcionesController.remove.bind(recepcionesController))
)

export default router