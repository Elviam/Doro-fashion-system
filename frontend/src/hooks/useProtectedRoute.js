import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { hasPageAccess } from "../utils/permissionMapper";

// Páginas disponibles para todos los roles
const GLOBAL_PAGES = ["tienda", "perfil"];

const ROLE_PERMISSIONS = {
  "role_admin": [
    "dashboard", "productos", "recepciones", "ventas",
    "clientes", "proveedores", "usuarios", "auditoria", "inventario", "tienda"
  ],
  "ADMIN": [
    "dashboard", "productos", "recepciones", "ventas",
    "clientes", "proveedores", "usuarios", "auditoria", "roles", "inventario", "tienda"
  ],
  "GERENTE": [
    "dashboard", "productos", "recepciones", "ventas",
    "clientes", "proveedores", "usuarios", "auditoria", "roles", "inventario", "tienda"
  ],
  "BODEGUERO": [
    "productos", "recepciones", "ventas", "clientes", "proveedores", "inventario", "tienda"
  ],
  "VENDEDOR": [
    "productos", "ventas", "clientes", "tienda"
  ],
  "CLIENTE": []
};

export function useProtectedRoute(requiredPage) {
  const { token, usuario } = useContext(AuthContext);

  if (!token || !usuario) {
    return { isAuthorized: false, reason: "no-session" };
  }

  // Páginas globales disponibles para todos los roles
  if (GLOBAL_PAGES.includes(requiredPage)) {
    return { isAuthorized: true, userRole: usuario?.roleId || usuario?.role };
  }

  const userRole = usuario?.roleId || usuario?.role;

  if (!userRole) {
    return { isAuthorized: false, reason: "no-role" };
  }

  // ✅ Estático PRIMERO — cubre páginas nuevas como inventario
  const allowedPages = ROLE_PERMISSIONS[userRole] || [];
  if (allowedPages.includes(requiredPage)) {
    return { isAuthorized: true, userRole };
  }

  // Dinámico como segunda opción
  if (Array.isArray(usuario?.permissions) && usuario.permissions.length > 0) {
    const hasAccess = hasPageAccess(usuario.permissions, requiredPage);
    if (hasAccess) {
      return { isAuthorized: true, userRole };
    }
  }

  return { isAuthorized: false, reason: "insufficient-permissions", userRole };
}

export const ROLE_PERMISSIONS_EXPORT = ROLE_PERMISSIONS;