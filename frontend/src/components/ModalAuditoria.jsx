const ACTION_CFG = {
  CREATE:        { label: "CREATE",  bg: "rgba(74,222,128,0.13)",  border: "rgba(74,222,128,0.40)",  colorDark: "#84B140", colorLight: "#3d7a1a" },
  UPDATE:        { label: "UPDATE",  bg: "rgba(251,191,36,0.13)",  border: "rgba(251,191,36,0.40)",  colorDark: "#C9A800", colorLight: "#92720a" },
  DELETE:        { label: "DELETE",  bg: "rgba(244,63,94,0.13)",   border: "rgba(244,63,94,0.40)",   colorDark: "#D04E37", colorLight: "#b83224" },
  TOGGLE_ACTIVE: { label: "TOGGLE",  bg: "rgba(56,189,248,0.13)",  border: "rgba(56,189,248,0.40)",  colorDark: "#0ea5e9", colorLight: "#0369a1" },
};

function fmtShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "numeric", year: "numeric",
  });
}

function fmtLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "2-digit" }) +
    " · " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

export default function ModalAuditoria({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const cfg = ACTION_CFG[data.action] || {
    label: data.action,
    bg: "rgba(167,139,250,0.13)", border: "rgba(167,139,250,0.40)",
    colorDark: "#a78bfa", colorLight: "#7750AD",
  };

  const detalles = data.details ? Object.entries(data.details) : [];

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-oscuro/40 dark:bg-black/60 font-poppins"
      onClick={onClose}
    >
      
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border bg-lila-pastel border-morado/20 dark:bg-bg-card dark:border-lila/20"
        onClick={(e) => e.stopPropagation()}
      >

        
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-morado/10 dark:border-lila/10">
          <div className="flex items-center gap-2">
            
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <span className="dark:hidden"  style={{ color: cfg.colorLight }}>{cfg.label}</span>
              <span className="hidden dark:inline" style={{ color: cfg.colorDark }}>{cfg.label}</span>
            </span>

            
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(99,102,241,0.10)", border: "0.5px solid rgba(99,102,241,0.30)" }}
            >
              <span className="dark:hidden"  style={{ color: "#5b4ea8" }}>{data.resource}</span>
              <span className="hidden dark:inline" style={{ color: "#a5b4fc" }}>{data.resource}</span>
            </span>
          </div>

          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer text-morado/50 hover:text-morado hover:bg-morado/10 dark:text-lila-soft/60 dark:hover:text-blanco dark:hover:bg-lila/10"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col gap-5
          [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-morado/20
          hover:[&::-webkit-scrollbar-thumb]:bg-morado/50
          dark:[&::-webkit-scrollbar-thumb]:bg-lila/30 dark:hover:[&::-webkit-scrollbar-thumb]:bg-lila">

          
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-oscuro dark:text-blanco m-0 leading-tight">
              {data.usuario || "Usuario desconocido"}
            </h2>
            <div className="flex items-center gap-3 text-xs text-morado/55 dark:text-lila-soft/70 flex-wrap">
              <span className="flex items-center gap-1">
                <i className="bi bi-calendar3 text-[11px]" />
                {fmtShort(data.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <i className="bi bi-layers text-[11px]" />
                {data.resource}
              </span>
            </div>

            
            {data.resourceId && (
              <p
                className="mt-1 pl-3 text-xs font-mono italic text-oscuro/55 dark:text-lila-soft/70 border-l-2 m-0"
                style={{ borderColor: cfg.colorDark }}
              >
                "{data.resourceId}"
              </p>
            )}
          </div>

          
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "ACCIÓN",   value: cfg.label,        accion: true },
              { label: "RECURSO",  value: data.resource                  },
              { label: "DETALLES", value: detalles.length,  highlight: true },
            ].map(({ label, value, accion, highlight }) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-3 py-2.5 rounded-xl border bg-morado/4 border-morado/10 dark:bg-oscuro/30 dark:border-lila/10"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-morado/45 dark:text-lila-soft/55">
                  {label}
                </span>
                {accion ? (
                  <>
                    <span className="text-sm font-bold dark:hidden" style={{ color: cfg.colorLight }}>{value}</span>
                    <span className="text-sm font-bold hidden dark:inline" style={{ color: cfg.colorDark }}>{value}</span>
                  </>
                ) : (
                  <span className={`text-sm font-bold ${highlight ? "text-verde" : "text-oscuro dark:text-blanco"}`}>
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>

          
          {detalles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest m-0 text-morado/45 dark:text-lila-soft/60">
                Detalles del evento
              </p>
              <div className="flex flex-col gap-1.5">
                {detalles.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl border bg-morado/4 border-morado/8 dark:bg-oscuro/25 dark:border-lila/8"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 text-morado/55 dark:text-lila-soft">
                      {key}
                    </span>
                    <span className="text-xs font-mono text-right break-all text-oscuro dark:text-blanco">
                      {typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          
          <div className="flex items-center justify-between pt-1 border-t border-morado/10 dark:border-lila/10">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-morado/40 dark:text-lila-soft/50">
                Registrado
              </span>
              <span className="text-xs font-medium text-oscuro/70 dark:text-lila-soft">
                {fmtLong(data.createdAt)}
              </span>
            </div>
            <p className="font-cinzel tracking-widest text-sm text-morado/25 dark:text-lila/50 m-0">
              A U R A
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
