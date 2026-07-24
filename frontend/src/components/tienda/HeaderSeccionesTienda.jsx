import { useNavigate } from "react-router-dom";

const DoroWordmark = () => (
  <div
    style={{
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: 300,
      letterSpacing: "0.22em",
      color: "var(--gold-light)",
      userSelect: "none",
      display: "flex",
      alignItems: "baseline",
      gap: "2px",
    }}
  >
    D
    <span style={{ fontStyle: "italic", color: "var(--gold)", marginRight: "1px" }}>'</span>
    ORO
  </div>
);

export default function HeaderSeccionesTienda() {
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "var(--noir)",
        borderBottom: "1px solid var(--border-gold-20)",
      }}
    >
      <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/tienda")}
            className="flex items-center gap-2 px-5 py-2 transition-colors"
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--gold-light)",
              background: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--gold-light)";
            }}
          >
            <span className="font-display text-2xl leading-none" aria-hidden="true">←</span>
            <span className="hidden sm:inline">Volver a la tienda</span>
            <span className="sm:hidden">Volver</span>
          </button>
        </div>

        <div className="flex items-baseline gap-3">
          <DoroWordmark />
          <span
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.24em",
              color: "var(--ash)",
              textTransform: "uppercase",
            }}
          >
            Boutique
          </span>
        </div>

      </div>
    </header>
  );
}
