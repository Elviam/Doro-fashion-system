// Mapeo de permisos a páginas accesibles
// Los permisos del backend tienen formato "recurso:accion"
import { getUserPermissions, hasPermission as checkUserPermission, isAdmin } from './accessControl.js';

export const PERMISSION_TO_PAGE_MAP = {
  'dashboard:read': 'dashboard',
  'products:read': 'productos',
  'recepciones:read': 'recepciones',
  'reabastecimiento:read': 'reabastecimiento',
  'pedidos_proveedor:create': 'generarPedidoProveedor',
  'pedidos_proveedor:send': 'pedidosProveedor',
  'clients:read': 'clientes',
  'suppliers:read': 'proveedores',
  'users:read': 'usuarios',
  'roles:read': 'configuracion',
  'permissions:read': 'configuracion',
  'audit:read': 'auditoria',
  'inventory:read': 'inventario', 
  'fulfillment:read': 'preparacion',
  'tienda:read': 'tienda',
  'ventas:read': 'ventas'
};

export const PAGE_REQUIRED_ANY = {
  reabastecimiento: ['reabastecimiento:read'],
  generarPedidoProveedor: ['pedidos_proveedor:create'],
  pedidosProveedor: ['reabastecimiento:read', 'pedidos_proveedor:send'],
};

// Extraer páginas permitidas basado en permisos
export function getPagesFromPermissions(permissions) {
  if (!Array.isArray(permissions)) {
    return [];
  }

  const pages = new Set();
  
  permissions.forEach(permission => {
    const page = PERMISSION_TO_PAGE_MAP[permission];
    if (page) {
      pages.add(page);
    }
  });

  return Array.from(pages);
}

// Verificar si el usuario tiene acceso a una página específica
export function hasPageAccess(userOrPermissions, page) {
  if (isAdmin(userOrPermissions)) return true;
  const permissions = Array.isArray(userOrPermissions) ? userOrPermissions : getUserPermissions(userOrPermissions);
  const requiredAny = PAGE_REQUIRED_ANY[page];
  if (requiredAny) return requiredAny.some((permission) => permissions.includes(permission));
  const allowedPages = getPagesFromPermissions(permissions);
  return allowedPages.includes(page);
}

// Verificar si tiene un permiso específico
export function hasPermission(userOrPermissions, permission) {
  return Array.isArray(userOrPermissions)
    ? userOrPermissions.includes(permission)
    : checkUserPermission(userOrPermissions, permission);
}

// Verificar si puede crear/actualizar/eliminar en una página
export function canPerformAction(userOrPermissions, resource, action) {
  const permissionKey = `${resource}:${action}`;
  return hasPermission(userOrPermissions, permissionKey);
}
