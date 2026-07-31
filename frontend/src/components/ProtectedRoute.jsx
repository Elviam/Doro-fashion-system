import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useProtectedRoute } from "../hooks/useProtectedRoute";

export default function ProtectedRoute({ children, requiredPage, redirectTo = "/login" }) {
  const location = useLocation();
  const { token, loading, sessionUnavailable, retrySession } = useContext(AuthContext);
  const { isAuthorized, reason, userRole } = useProtectedRoute(requiredPage);

  if (loading) return <SessionLoading />;
  if (token && sessionUnavailable) return <SessionUnavailable retrySession={retrySession} />;

  if (!token) {
    const staffPage = location.state?.accountType === "STAFF" || new URLSearchParams(location.search).get("scope") === "staff" || !["tienda", "perfil"].includes(requiredPage);
    return <Navigate to={staffPage ? "/staff/login" : redirectTo} replace />;
  }

  if (!isAuthorized) {
    if (reason === "insufficient-permissions") return <Navigate to={userRole === "CLIENTE" ? "/tienda" : "/dashboard"} replace />;
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

function SessionLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-[var(--snow)] p-6 dark:bg-[var(--noir-soft)]"><div className="flex flex-col items-center gap-3 text-[var(--noir)] dark:text-[var(--snow)]"><i className="bi bi-arrow-repeat animate-spin text-4xl text-[var(--gold)]" /><p className="font-tag text-[11px] font-semibold uppercase tracking-[0.2em]">Cargando sesión...</p></div></div>;
}

function SessionUnavailable({ retrySession }) {
  const navigate = useNavigate();
  return <div className="flex min-h-screen items-center justify-center bg-[var(--snow)] p-6 dark:bg-[var(--noir-soft)]"><section className="w-full max-w-md rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--ivory-deep)] p-6 text-center shadow-sm dark:bg-[var(--noir)]"><i className="bi bi-wifi-off text-3xl text-[var(--gold)]" /><h1 className="mt-3 font-display text-xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">No fue posible verificar la sesión en este momento</h1><p className="mt-2 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">El servicio no está disponible temporalmente.</p><div className="mt-5 flex justify-center gap-3"><button type="button" onClick={retrySession} className="rounded-[2px] bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--noir)]">Reintentar</button><button type="button" onClick={() => navigate("/")} className="rounded-[2px] border border-[var(--border-gold-40)] px-4 py-2 text-sm font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Volver al inicio</button></div></section></div>;
}
