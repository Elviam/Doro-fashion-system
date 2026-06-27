import { Router } from 'express'
import healthRoutes from '../modules/health/health.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import usersRoutes from '../modules/users/users.routes.js'
import rolesRoutes from '../modules/roles/roles.routes.js'
import permissionsRoutes from '../modules/permissions/permissions.routes.js'
import clientsRoutes from '../modules/clients/clients.routes.js'
import suppliersRoutes from '../modules/suppliers/suppliers.routes.js'
import productsRoutes from '../modules/products/products.routes.js'
import inventoryRoutes from '../modules/inventory/inventory.routes.js'
import recepcionesRoutes from '../modules/recepciones/recepciones.routes.js'
import auditRoutes from '../modules/audit/audit.routes.js'
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js'
import searchRoutes from '../modules/search/search.routes.js'
import ventasRoutes from '../modules/ventas/ventas.routes.js'
import notificationsRoutes from '../modules/notifications/notifications.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/roles', rolesRoutes)
router.use('/permissions', permissionsRoutes)
router.use('/clients', clientsRoutes)
router.use('/suppliers', suppliersRoutes)
router.use('/products', productsRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/recepciones', recepcionesRoutes)
router.use('/audit', auditRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/search', searchRoutes)
router.use('/ventas', ventasRoutes)
router.use('/notifications', notificationsRoutes)

export default router