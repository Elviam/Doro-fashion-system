import { useEffect } from "react";

// Semantic color config per toast type
const config = {
  error: {
    iconClass:   "bi bi-bag-x",
    borderColor: "rgba(244,63,94,0.4)",
    iconColor:   "#F43F5E",
    titleColor:  "#F43F5E",
  },
  exito: {
    iconClass:   "bi bi-bag-check",
    borderColor: "rgba(74,222,128,0.4)",
    iconColor:   "#4ADE80",
    titleColor:  "#4ADE80",
  },
  aviso: {
    iconClass:   "bi bi-exclamation",
    borderColor: "var(--border-gold-40)",
    iconColor:   "var(--gold)",
    titleColor:  "var(--gold)",
  },
};

export default function ToastTienda({ toast, onCerrar }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onCerrar, 3500);
    return () => clearTimeout(t);
  }, [toast, onCerrar]);

  if (!toast) return null;

  const estilos = config[toast.tipo] ?? config.aviso;

  return (
    <div className="fixed bottom-6 right-6 z-[80] animate-fade-in-up">
      <div
        className="relative w-72 p-6"
        style={{
          background:   "rgba(13,13,13,0.96)",
          border:       `1px solid ${estilos.borderColor}`,
          borderRadius: "2px",
          backdropFilter: "blur(12px)",
          boxShadow:    "0 20px 60px rgba(13,13,13,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onCerrar}
          className="absolute right-4 top-4 transition"
          style={{ color: "var(--ash)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--snow)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
        >
          <i className="bi bi-x-lg text-sm" />
        </button>

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[2px] flex items-center justify-center mb-3"
          style={{ border: `1px solid ${estilos.borderColor}`, color: estilos.iconColor }}
        >
          <i className={`${estilos.iconClass} text-lg`} />
        </div>

        {/* Title */}
        <h3
          className="pb-3 mb-3"
          style={{
            fontFamily:    "var(--font-tag)",
            fontSize:      "10px",
            fontWeight:    600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         estilos.titleColor,
            borderBottom:  `1px solid ${estilos.borderColor}`,
            margin:        0,
            paddingBottom: "12px",
            marginBottom:  "12px",
          }}
        >
          {toast.titulo}
        </h3>

        {/* Message */}
        {toast.mensaje && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ash)", lineHeight: 1.6, margin: 0 }}>
            {toast.mensaje}
          </p>
        )}

        {/* Action button */}
        {toast.accion && (
          <button
            onClick={() => { toast.accion.onClick(); onCerrar(); }}
            className="mt-4 transition"
            style={{
              fontFamily:    "var(--font-tag)",
              fontSize:      "9px",
              fontWeight:    600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding:       "6px 14px",
              background:    "transparent",
              color:         estilos.titleColor,
              border:        `1px solid ${estilos.borderColor}`,
              borderRadius:  "2px",
              cursor:        "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {toast.accion.label}
          </button>
        )}

        {/* D'oro wordmark */}
        <div
          className="mt-5"
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "14px",
            fontWeight:    300,
            letterSpacing: "0.22em",
            color:         "rgba(214,171,52,0.35)",
            userSelect:    "none",
          }}
        >
          D<span style={{ fontStyle: "italic" }}>'</span>ORO
        </div>
      </div>
    </div>
  );
}