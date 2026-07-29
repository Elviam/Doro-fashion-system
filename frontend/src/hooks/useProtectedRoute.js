import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { hasPageAccess } from "../utils/permissionMapper";
import { getRoleCode } from "../utils/accessControl";

const GLOBAL_PAGES = ["tienda", "perfil"];

export function useProtectedRoute(requiredPage) {
  const { token, usuario } = useContext(AuthContext);

  if (!token || !usuario) {
    return { isAuthorized: false, reason: "no-session" };
  }

  const userRole = getRoleCode(usuario);

  if (GLOBAL_PAGES.includes(requiredPage)) {
    return { isAuthorized: true, userRole };
  }

  const isAuthorized = hasPageAccess(usuario, requiredPage);
  return {
    isAuthorized,
    reason: isAuthorized ? undefined : "insufficient-permissions",
    userRole,
  };
}
