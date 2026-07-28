import { Router } from 'express'
import { clientsController } from './clients.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions, requireClientAccount } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  addressIdParamSchema,
  addressSchema
} from './clients.schema.js'

const router = Router()

router.get('/me/addresses', authenticate, requireClientAccount, asyncHandler(clientsController.listMyAddresses.bind(clientsController)))
router.post('/me/addresses', authenticate, requireClientAccount, validate(addressSchema), asyncHandler(clientsController.createMyAddress.bind(clientsController)))
router.patch('/me/addresses/:addressId', authenticate, requireClientAccount, validate(addressIdParamSchema, 'params'), validate(addressSchema), asyncHandler(clientsController.updateMyAddress.bind(clientsController)))
router.delete('/me/addresses/:addressId', authenticate, requireClientAccount, validate(addressIdParamSchema, 'params'), asyncHandler(clientsController.removeMyAddress.bind(clientsController)))

router.get(
  '/',
  authenticate,
  requirePermissions(['clients:read']),
  validate(listClientsQuerySchema, 'query'),
  asyncHandler(clientsController.list.bind(clientsController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['clients:read']),
  validate(clientIdParamSchema, 'params'),
  asyncHandler(clientsController.getById.bind(clientsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['clients:create']),
  validate(createClientSchema),
  asyncHandler(clientsController.create.bind(clientsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['clients:delete']),
  validate(clientIdParamSchema, 'params'),
  asyncHandler(clientsController.remove.bind(clientsController))
)

export default router
