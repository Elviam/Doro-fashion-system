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
  return (
    <div
      className="fixed inset-0 flex items-center justify-center backdrop-blur-sm"
      style={{ background: "var(--noir-overlay-78)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <i
          className="bi bi-arrow-repeat text-4xl animate-spin"
          style={{ color: "var(--gold)" }}
        />
        <p
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--snow)",
          }}
        >
          Cargando...
        </p>
      </div>
    </div>
  );
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