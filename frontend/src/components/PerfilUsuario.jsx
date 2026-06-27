import { useState, useEffect } from "react";
import { api } from "../services/api";

const ACTION_CFG = {
  CREATE:        { label: "CREATE",  bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.35)",  color: "#84B140" },
  UPDATE:        { label: "UPDATE",  bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  color: "#E0DA66" },
  DELETE:        { label: "DELETE",  bg: "rgba(244,63,94,0.12)",   border: "rgba(244,63,94,0.35)",   color: "#D04E37" },
  TOGGLE_ACTIVE: { label: "TOGGLE",  bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.35)",  color: "#38bdf8" },
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
    label: action, bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.35)", color: "#a78bfa",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color }}
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

  useEffect(() => {
    const cargarAuditoria = async () => {
      try {
        const data = await api.get("/audit?limit=50");
        const movimientos = (data.items || [])
          .filter(item => item.usuario === usuario?.usuario)
          .slice(0, 20);
        setAuditoria(movimientos);
      } catch (error) {
        console.error("Error cargando auditoría:", error);
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.usuario) {
      cargarAuditoria();
    }
  }, [usuario?.usuario]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 box-border">
      
      <div className="rounded-2xl border border-lila/10 shadow-lg p-5 sm:p-6 w-full bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm box-border">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-lila via-lilaMid to-lilaSoft flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-3xl sm:text-4xl font-bold text-oscuro select-none">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-lila mb-2.5 break-words">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-text-muted truncate">
                <span className="font-semibold text-lila-soft">Usuario:</span> @{usuario?.usuario}
              </p>
              <p className="text-text-muted break-all sm:break-normal">
                <span className="font-semibold text-lila-soft">Email:</span> {usuario?.email}
              </p>
              <p className="text-text-muted">
                <span className="font-semibold text-lila-soft">Rol:</span> {usuario?.role?.nombre || "N/A"}
              </p>
              <div className="text-text-muted flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="font-semibold text-lila-soft">Estado:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
                  usuario?.activo
                    ? "bg-verde/20 text-verde border-verde/30"
                    : "bg-rojo/20 text-rojo border-rojo/30"
                }`}>
                  {usuario?.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-lila/10 shadow-lg p-5 sm:p-6 w-full bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm box-border">
        <h3 className="text-base sm:text-lg font-bold text-lila mb-4 flex items-center gap-2">
          <i className="bi bi-clock-history text-lila-mid" />
          Movimientos Recientes
        </h3>

        {cargando ? (
          <div className="text-center py-10 text-text-muted text-sm">
            <p>Cargando movimientos...</p>
          </div>
        ) : auditoria.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {auditoria.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl border border-lila/10 bg-oscuro/40 hover:bg-oscuro/60 transition box-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 w-full">
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <ActionBadge action={item.action} />
                      <span className="text-[10px] font-bold text-lila/60 uppercase tracking-wider bg-oscuro/30 px-2 py-0.5 rounded border border-lila/5 whitespace-nowrap">
                        {item.resource}
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-lila bg-oscuro/20 p-2.5 rounded-lg border border-lila/5 font-mono break-all sm:break-words max-h-24 overflow-y-auto custom-scrollbar w-full box-border">
                      {formatDetails(item.details)}
                    </p>
                  </div>

                  <div className="text-left lg:text-right shrink-0 border-t border-lila/5 lg:border-0 pt-2 lg:pt-0.5">
                    <span className="text-[11px] text-text-muted block lg:inline font-medium whitespace-nowrap">
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