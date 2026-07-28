import { Router } from 'express'
import { productsController } from './products.controller.js'
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
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

// Catálogo público — cualquier visitante (con o sin cuenta) puede verlo.
// No lleva `authenticate` ni permisos: no son acciones de administración,
// son lectura de un catálogo abierto, igual que en cualquier tienda en línea.
router.get(
  '/',
  optionalAuthenticate,
  validate(listProductsQuerySchema, 'query'),
  asyncHandler(productsController.list.bind(productsController))
)

router.get(
  '/:id',
  optionalAuthenticate,
  validate(productIdParamSchema, 'params'),
  asyncHandler(productsController.getById.bind(productsController))
)

// A partir de aquí: acciones de administración del catálogo.
// Estas SÍ requieren estar autenticado y tener el permiso correspondiente
// — un cliente nunca tendrá `products:create/update/delete` asignado a su rol.
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
