import { Router } from 'express'
import { rolesController } from './roles.controller.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  createRoleSchema,
  listRolesQuerySchema,
  roleIdParamSchema,
  updateRoleSchema
} from './roles.schema.js'

const router = Router()

router.get(
  '/',
  authenticate,
  requirePermissions(['roles:read']),
  validate(listRolesQuerySchema, 'query'),
  asyncHandler(rolesController.list.bind(rolesController))
)

router.get(
  '/:id',
  authenticate,
  requirePermissions(['roles:read']),
  validate(roleIdParamSchema, 'params'),
  asyncHandler(rolesController.getById.bind(rolesController))
)

router.post(
  '/',
  authenticate,
  requirePermissions(['roles:create']),
  validate(createRoleSchema),
  asyncHandler(rolesController.create.bind(rolesController))
)

router.patch(
  '/:id',
  authenticate,
  requirePermissions(['roles:update']),
  validate(roleIdParamSchema, 'params'),
  validate(updateRoleSchema),
  asyncHandler(rolesController.update.bind(rolesController))
)

router.delete(
  '/:id',
  authenticate,
  requirePermissions(['roles:delete']),
  validate(roleIdParamSchema, 'params'),
  asyncHandler(rolesController.remove.bind(rolesController))
)

export default router