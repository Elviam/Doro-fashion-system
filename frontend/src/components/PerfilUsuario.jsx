import { useState, useEffect } from "react";
import { staffApi } from "../services/api";
import CambioPasswordForm from "./CambioPasswordForm";
import { getPasswordMovementDescription } from "../utils/passwordAuditPresentation";

const ACTION_CFG = {
  CREATE:        { label: "CREATE",  clases: "bg-verde/12 border-verde/35 text-green-700 dark:text-verde" },
  UPDATE:        { label: "UPDATE",  clases: "bg-amarillo/12 border-amarillo/35 text-yellow-700 dark:text-amarillo" },
  DELETE:        { label: "DELETE",  clases: "bg-rojo/12 border-rojo/35 text-red-700 dark:text-rojo" },
  TOGGLE_ACTIVE: { label: "TOGGLE",  clases: "bg-azul/12 border-azul/35 text-blue-700 dark:text-azul" },
  CHANGE_PASSWORD: { label: "Cambio de contraseña", clases: "bg-amarillo/12 border-amarillo/35 text-yellow-700 dark:text-amarillo" },
  RESET_PASSWORD: { label: "Restablecimiento de contraseña", clases: "bg-amarillo/12 border-amarillo/35 text-yellow-700 dark:text-amarillo" },
};

function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CFG[action] || {
    label: action,
    clases: "bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs lg:text-sm font-tag font-semibold whitespace-nowrap border ${cfg.clases}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDetails(details) {
  if (!details) return "Sin detalles";
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ");
  }
  return String(details);
}

export default function PerfilUsuario({ usuario }) {
  const [auditoria, setAuditoria] = useState([]);
  const [cargando, setCargando] = useState(true);
  const puedeVerAuditoria = usuario?.role === "ADMIN" || usuario?.permissions?.includes("audit:read");
  const usuarioId = usuario?.id;
  const nombreUsuario = usuario?.usuario;

  useEffect(() => {
    const cargarAuditoria = async () => {
      try {
        const data = await staffApi.get("/audit?limit=50");
        const movimientos = (data.items || [])
          .filter(item => item.userId === usuarioId || (!item.userId && item.usuario === nombreUsuario))
          .slice(0, 20);
        setAuditoria(movimientos);
      } catch (error) {
        console.error("Error cargando auditoría:", error);
      } finally {
        setCargando(false);
      }
    };

    if (nombreUsuario && puedeVerAuditoria) {
      cargarAuditoria();
    } else {
      setCargando(false);
    }
  }, [nombreUsuario, puedeVerAuditoria, usuarioId]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 box-border">
      
      <div className="rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] p-5 shadow-lg dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[var(--gold-08)] text-[var(--gold-dark)] dark:text-[var(--gold-light)]"><i className="bi bi-shield-lock text-lg" /></div>
          <div>
            <h3 className="font-display text-base font-bold text-[var(--noir)] dark:text-[var(--snow)] lg:text-lg">Seguridad</h3>
            <p className="mt-1 font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Cambia tu contraseña conociendo la actual. Nadie puede verla después de guardarla.</p>
          </div>
        </div>

        <CambioPasswordForm />
      </div>

      <div className="rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] shadow-lg p-5 sm:p-6 w-full bg-[var(--snow)] dark:bg-[var(--noir-soft)] backdrop-blur-sm box-border">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] bg-gradient-to-br from-[var(--gold)] via-[var(--gold-dark)] to-[var(--gold-light)] flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--noir)] select-none">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-[var(--noir)] dark:text-[var(--snow)] mb-2.5 break-words">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <div className="space-y-2 font-body text-xs sm:text-sm lg:text-base">
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] truncate">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Usuario:</span> @{usuario?.usuario}
              </p>
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] break-all sm:break-normal">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Email:</span> {usuario?.email}
              </p>
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Rol:</span> {usuario?.role || "N/A"}
              </p>
              <div className="text-[var(--noir-soft)] dark:text-[var(--ash)] flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Estado:</span>
                <span className={`font-tag inline-block px-2 py-0.5 rounded-[2px] text-xs lg:text-sm font-semibold border ${
                  usuario?.activo
                    ? "bg-verde/20 text-green-700 dark:text-verde border-verde/30"
                    : "bg-rojo/20 text-red-700 dark:text-rojo border-rojo/30"
                }`}>
                  {usuario?.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] shadow-lg p-5 sm:p-6 w-full bg-[var(--snow)] dark:bg-[var(--noir-soft)] backdrop-blur-sm box-border">
        <h3 className="font-display text-base lg:text-lg font-bold text-[var(--noir)] dark:text-[var(--snow)] mb-4 flex items-center gap-2">
          <i className="bi bi-clock-history text-[var(--gold)]" />
          Movimientos Recientes
        </h3>

        {cargando ? (
          <div className="text-center py-10 font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm lg:text-base">
            <p>Cargando movimientos...</p>
          </div>
        ) : auditoria.length === 0 ? (
          <div className="text-center py-10 font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm lg:text-base">
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {auditoria.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-[var(--gold-08)] hover:bg-[var(--gold-08)]/70 transition box-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 w-full">
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <ActionBadge action={item.action} />
                      <span className="font-tag text-[10px] lg:text-xs font-bold text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase tracking-wider bg-[var(--snow)] dark:bg-[var(--noir)] px-2 py-0.5 rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] whitespace-nowrap">
                        {item.resource}
                      </span>
                    </div>
                    
                    <p className="font-mono text-xs sm:text-sm lg:text-base text-[var(--noir)] dark:text-[var(--snow)] bg-[var(--snow)] dark:bg-[var(--noir)] p-2.5 rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] break-all sm:break-words max-h-24 overflow-y-auto custom-scrollbar w-full box-border">
                      {getPasswordMovementDescription(item) || formatDetails(item.details)}
                    </p>
                  </div>

                  <div className="text-left lg:text-right shrink-0 border-t border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] lg:border-0 pt-2 lg:pt-0.5">
                    <span className="font-body text-[11px] lg:text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] block lg:inline font-medium whitespace-nowrap">
                      <i className="bi bi-calendar3 lg:hidden mr-1.5 opacity-60" />
                      {fmtDateShort(item.createdAt)}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
