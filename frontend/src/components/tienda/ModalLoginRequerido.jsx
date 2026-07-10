export default function ModalLoginRequerido({ abierto, mensaje, onCerrar, onIniciarSesion }) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,13,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[360px] p-7"
        style={{
          background: "rgba(13,13,13,0.96)",
          border: "1px solid var(--border-gold-40)",
          borderRadius: "2px",
          boxShadow: "0 20px 60px rgba(13,13,13,0.5)",
        }}
      >
        <button
          onClick={onCerrar}
          className="absolute right-4 top-4 transition"
          style={{ color: "var(--ash)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--snow)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
        >
          <i className="bi bi-x-lg text-sm" />
        </button>

        <div
          className="w-10 h-10 rounded-[2px] flex items-center justify-center mb-4"
          style={{ border: "1px solid var(--border-gold-40)", color: "var(--gold)" }}
        >
          <i className="bi bi-person-lock text-lg" />
        </div>

        <h3
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--gold)",
            margin: "0 0 10px",
          }}
        >
          Inicia sesión
        </h3>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--snow)", lineHeight: 1.6, margin: "0 0 20px" }}>
          {mensaje}
        </p>

        <button
          onClick={onIniciarSesion}
          className="w-full transition"
          style={{
            fontFamily: "var(--font-tag)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "12px",
            background: "var(--gold)",
            color: "var(--noir)",
            border: "none",
            borderRadius: "2px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
        >
          Iniciar sesión
        </button>

        <div
          className="mt-5 text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "13px",
            fontWeight: 300,
            letterSpacing: "0.22em",
            color: "rgba(214,171,52,0.35)",
            userSelect: "none",
          }}
        >
          D<span style={{ fontStyle: "italic" }}>'</span>ORO
        </div>
      </div>
    </div>
  );
}