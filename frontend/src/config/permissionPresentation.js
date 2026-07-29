// Fuente de verdad para la interfaz: no cambia la autorización del backend.
// Solo evita que el modal ofrezca permisos que no representan una acción
// concedible desde el panel actual.
export const MODULE_ORDER = [
  'dashboard', 'ventas', 'products', 'clients', 'inventory', 'fulfillment',
  'recepciones', 'reabastecimiento', 'suppliers', 'users', 'configuracion', 'audit'
]

export const MODULE_LABELS = {
  dashboard: 'Dashboard',
  ventas: 'Ventas',
  products: 'Productos',
  clients: 'Clientes',
  inventory: 'Inventario',
  fulfillment: 'Preparación de pedidos',
  recepciones: 'Recepción de mercancía',
  reabastecimiento: 'Reabastecimiento',
  suppliers: 'Proveedores',
  users: 'Personal',
  configuracion: 'Configuración',
  audit: 'Auditoría'
}

// `roles` y `permissions` son una única sección visual de configuración.
const MODULE_ALIASES = { roles: 'configuracion', permissions: 'configuracion' }

export const PERMISSION_PRESENTATION = {
  'dashboard:read': { label: 'Ver dashboard', order: 10 },
  'ventas:read': { label: 'Ver ventas', order: 10 },
  // La UI administrativa sólo expone la transición a CANCELADO.
  'ventas:update': { label: 'Cancelar ventas', order: 20 },
  'products:read': { label: 'Ver productos', order: 10 },
  'products:create': { label: 'Crear productos', order: 20 },
  'products:update': { label: 'Editar productos', order: 30 },
  'products:delete': { label: 'Eliminar productos', order: 40 },
  'clients:read': { label: 'Ver clientes', order: 10 },
  'clients:create': { label: 'Crear clientes', order: 20 },
  'clients:update': { label: 'Editar clientes', order: 30 },
  'clients:delete': { label: 'Eliminar clientes', order: 40 },
  'inventory:read': { label: 'Ver inventario', order: 10 },
  'inventory:update': { label: 'Ajustar inventario', order: 20 },
  'fulfillment:read': { label: 'Ver pedidos para preparación', order: 10 },
  'fulfillment:update': { label: 'Actualizar preparación y envío del pedido', order: 20 },
  'recepciones:read': { label: 'Ver recepciones de mercancía', order: 10 },
  'recepciones:confirm': { label: 'Registrar y confirmar mercancía recibida', order: 20 },
  'reabastecimiento:read': { label: 'Ver resumen y pedidos a proveedores', order: 10 },
  'pedidos_proveedor:create': { label: 'Crear y guardar borradores de pedidos', order: 20 },
  'pedidos_proveedor:send': { label: 'Enviar pedidos a proveedores', order: 30 },
  'suppliers:read': { label: 'Ver proveedores', order: 10 },
  'suppliers:create': { label: 'Crear proveedores', order: 20 },
  'suppliers:update': { label: 'Editar proveedores', order: 30 },
  'suppliers:delete': { label: 'Eliminar proveedores', order: 40 },
  'users:read': { label: 'Ver personal', order: 10 },
  'users:create': { label: 'Crear personal', order: 20 },
  'users:update': { label: 'Editar personal y sus permisos individuales', order: 30 },
  'users:delete': { label: 'Eliminar personal', order: 40 },
  'roles:read': { label: 'Ver roles y permisos', order: 10 },
  'roles:update': { label: 'Editar descripción de roles', order: 20 },
  'permissions:read': { label: 'Consultar catálogo de permisos', order: 30 },
  'audit:read': { label: 'Ver auditoría', order: 10 }
}

export function getPermissionPresentation(code) {
  return PERMISSION_PRESENTATION[code] || null
}

export function getPermissionModule(code) {
  const resource = String(code || '').split(':')[0]
  return MODULE_ALIASES[resource] || resource
}

export function isPermissionVisibleInModal(code) {
  return Boolean(getPermissionPresentation(code))
}

export function sortPermissionGroups(entries) {
  return [...entries].sort(([left], [right]) => MODULE_ORDER.indexOf(left) - MODULE_ORDER.indexOf(right))
}

export function sortPermissions(permissions) {
  return [...permissions].sort((left, right) =>
    (getPermissionPresentation(left.code)?.order || 999) - (getPermissionPresentation(right.code)?.order || 999)
  )
}
