import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useProtectedRoute } from "../hooks/useProtectedRoute";

export default function ProtectedRoute({
  children,
  requiredPage,
  redirectTo = "/login"
}) {

  const {
    token,
    loading
  } = useContext(AuthContext);

  const {
    isAuthorized,
    reason,
    userRole
  } = useProtectedRoute(requiredPage);

  // Esperar validación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // No hay sesión
  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  // No autorizado
  if (!isAuthorized) {

    if (reason === "insufficient-permissions") {

      if (userRole === "CLIENTE") {
        return <Navigate to="/tienda" replace />;
      }

      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to={redirectTo} replace />;
  }

  return children;
}