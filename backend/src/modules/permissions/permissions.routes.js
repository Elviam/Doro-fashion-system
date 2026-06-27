import { Router } from 'express'
import { permissionsController } from './permissions.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createPermissionSchema,
  listPermissionsQuerySchema,
  permissionIdParamSchema,
  updatePermissionSchema
} from './permissions.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['permissions:read']),
  validate(listPermissionsQuerySchema, 'query'),
  asyncHandler(permissionsController.list.bind(permissionsController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['permissions:read']),
  validate(permissionIdParamSchema, 'params'),
  asyncHandler(permissionsController.getById.bind(permissionsController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['permissions:create']),
  validate(createPermissionSchema),
  asyncHandler(permissionsController.create.bind(permissionsController))
)

router.post(
  '/seed',
  authenticate,
  requirePermissions(['permissions:seed']),
  asyncHandler(permissionsController.seed.bind(permissionsController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions(['permissions:update']),
  validate(permissionIdParamSchema, 'params'),
  validate(updatePermissionSchema),
  asyncHandler(permissionsController.update.bind(permissionsController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['permissions:delete']),
  validate(permissionIdParamSchema, 'params'),
  asyncHandler(permissionsController.remove.bind(permissionsController))
)

export default router