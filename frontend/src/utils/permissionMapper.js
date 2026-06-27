// Mapeo de permisos a páginas accesibles
// Los permisos del backend tienen formato "recurso:accion"
export const PERMISSION_TO_PAGE_MAP = {
  'dashboard:read': 'dashboard',
  'products:read': 'productos',
  'recepciones:read': 'recepciones',
  'clients:read': 'clientes',
  'suppliers:read': 'proveedores',
  'users:read': 'usuarios',
  'audit:read': 'auditoria',
  'roles:read': 'roles',
  'inventory:read': 'productos', // inventory usa la misma página que productos
  'tienda:read': 'tienda',
  'ventas:read': 'ventas'
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
export function hasPageAccess(permissions, page) {
  const allowedPages = getPagesFromPermissions(permissions);
  return allowedPages.includes(page);
}

// Verificar si tiene un permiso específico
export function hasPermission(permissions, permission) {
  if (!Array.isArray(permissions)) {
    return false;
  }
  return permissions.includes(permission);
}

// Verificar si puede crear/actualizar/eliminar en una página
export function canPerformAction(permissions, resource, action) {
  const permissionKey = `${resource}:${action}`;
  return hasPermission(permissions, permissionKey);
}
