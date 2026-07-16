import { RANGO_PRECIO } from "../../constants/precio";

const departamentos = ["Dama", "Caballero", "Unisex"];

const tallasSuperiores = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
const tallasInferiores = ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"];

// Quick price presets for one-click filtering
const PRESETS_PRECIO = [
  { label: "Menos de $800", min: 0, max: 800 },
  { label: "$800 - $1,500", min: 800, max: 1500 },
  { label: "$1,500 - $2,250", min: 1500, max: 2250 },
  { label: "$2,250 - $3,000", min: 2250, max: RANGO_PRECIO.max },
];

function toggleTalla(tallas, talla) {
  return tallas.includes(talla)
    ? tallas.filter((t) => t !== talla)
    : [...tallas, talla];
}

// Injects the CSS needed for the dual-thumb range slider once per mount.
// Uses the classic "two overlapping native ranges" technique: the track is
// transparent and pointer-events are disabled everywhere except the thumb,
// so both handles remain independently draggable.
function EstilosRangoDoble() {
  return (
    <style>{`
      .rango-doble-input {
        position: absolute;
        left: 0;
        width: 100%;
        height: 4px;
        background: transparent;
        pointer-events: none;
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
      }
      .rango-doble-input::-webkit-slider-thumb {
        pointer-events: auto;
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--gold);
        border: 2px solid var(--noir);
        cursor: pointer;
      }
      .rango-doble-input::-moz-range-thumb {
        pointer-events: auto;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--gold);
        border: 2px solid var(--noir);
        cursor: pointer;
      }
      .rango-doble-input::-webkit-slider-runnable-track,
      .rango-doble-input::-moz-range-track {
        background: transparent;
        border: none;
      }
    `}</style>
  );
}

function RangoDoble({ valorMin, valorMax, onCambiarMin, onCambiarMax }) {
  const { min, max } = RANGO_PRECIO;
  const rango = max - min;
  // Minimum gap between thumbs so they never overlap completely
  const gapMinimo = Math.max(RANGO_PRECIO.paso, Math.round(rango * 0.02));

  const pctMin = ((valorMin - min) / rango) * 100;
  const pctMax = ((valorMax - min) / rango) * 100;

  const handleMin = (e) => {
    const val = Math.min(Number(e.target.value), valorMax - gapMinimo);
    onCambiarMin(val);
  };

  const handleMax = (e) => {
    const val = Math.max(Number(e.target.value), valorMin + gapMinimo);
    onCambiarMax(val);
  };

  return (
    <div className="relative h-4 flex items-center">
      <EstilosRangoDoble />

      {/* Base track */}
      <div
        className="absolute left-0 right-0 h-[3px] rounded-full"
        style={{ background: "var(--border-gold-40)" }}
      />

      {/* Active range fill */}
      <div
        className="absolute h-[3px] rounded-full"
        style={{
          left: `${pctMin}%`,
          right: `${100 - pctMax}%`,
          background: "var(--gold)",
        }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={RANGO_PRECIO.paso}
        value={valorMin}
        onChange={handleMin}
        className="rango-doble-input"
        aria-label="Precio mínimo"
        // Bring the min thumb to front when it is close to the right edge,
        // so it stays reachable even when both thumbs nearly overlap
        style={{ zIndex: valorMin > max - gapMinimo * 3 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={RANGO_PRECIO.paso}
        value={valorMax}
        onChange={handleMax}
        className="rango-doble-input"
        aria-label="Precio máximo"
        style={{ zIndex: 4 }}
      />
    </div>
  );
}

function InputPrecio({ etiqueta, valor, onChange, min, max }) {
  const manejarCambio = (e) => {
    const raw = e.target.value;
    if (raw === "") return;
    onChange(Number(raw));
  };

  const manejarBlur = (e) => {
    const val = Number(e.target.value);
    const clamped = Math.min(Math.max(val, min), max);
    onChange(clamped);
  };

  return (
    <div className="flex-1">
      <span
        style={{
          fontFamily: "var(--font-tag)",
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ash)",
          display: "block",
          marginBottom: "4px",
        }}
      >
        {etiqueta}
      </span>
      <div
        className="flex items-center rounded-[2px]"
        style={{ border: "1px solid var(--border-gold-40)", background: "var(--ivory)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--ash)",
            paddingLeft: "8px",
          }}
        >
          $
        </span>
        <input
          type="number"
          value={valor}
          min={min}
          max={max}
          step={RANGO_PRECIO.paso}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          className="w-full bg-transparent outline-none"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--noir)",
            padding: "8px 8px 8px 4px",
          }}
        />
      </div>
    </div>
  );
}

function SeccionFiltro({ titulo, children, ultima = false }) {
  return (
    <div
      className={`py-4 ${!ultima ? "border-b" : ""}`}
      style={!ultima ? { borderColor: "var(--border-gold-25)" } : {}}
    >
      <p
        style={{
          fontFamily: "var(--font-tag)",
          fontSize: "12px",
          letterSpacing: "0.24em",
          color: "var(--gold-dark)",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: "12px",
          margin: 0,
          paddingBottom: "12px",
        }}
      >
        {titulo}
      </p>
      {children}
    </div>
  );
}

function ContenidoFiltros({ filtros, setFiltro, onLimpiar, onCerrar, filtrosActivos = 0 }) {
  const presetActivo = PRESETS_PRECIO.find(
    (p) => p.min === filtros.precioMin && p.max === filtros.precioMax
  );
  const hayFiltros = filtrosActivos > 0;

  return (
    <div
      className="rounded-[2px] p-5 shadow-sm"
      style={{ background: "var(--snow)", border: "1px solid var(--border-gold-25)" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "19px",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--noir)",
            margin: 0,
          }}
        >
          Filtros
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onLimpiar}
            disabled={!hayFiltros}
            className="rounded-[2px] transition"
            style={{
              fontFamily: "var(--font-tag)",
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: hayFiltros ? "var(--noir)" : "var(--ash)",
              background: hayFiltros ? "var(--gold)" : "transparent",
              border: hayFiltros ? "1px solid var(--gold)" : "1px solid var(--border-gold-25)",
              cursor: hayFiltros ? "pointer" : "default",
              padding: "7px 12px",
              fontWeight: 700,
            }}
            onMouseEnter={(e) => {
              if (hayFiltros) e.currentTarget.style.background = "var(--gold-light)";
            }}
            onMouseLeave={(e) => {
              if (hayFiltros) e.currentTarget.style.background = "var(--gold)";
            }}
          >
            {hayFiltros ? "Limpiar" : "Sin filtros"}
          </button>
          {onCerrar && (
            <button
              onClick={onCerrar}
              style={{
                color: "var(--noir)",
                background: "none",
                border: "none",
                cursor: "pointer",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold-dark)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--noir)")}
            >
              <i className="bi bi-x-lg text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Price range — dual-thumb slider + numeric inputs + quick presets */}
      <SeccionFiltro titulo="Rango de precio">
        <div className="space-y-4">
          <RangoDoble
            valorMin={filtros.precioMin}
            valorMax={filtros.precioMax}
            onCambiarMin={(val) => setFiltro("precioMin", val)}
            onCambiarMax={(val) => setFiltro("precioMax", val)}
          />

          <div className="flex gap-3">
            <InputPrecio
              etiqueta="Mínimo"
              valor={filtros.precioMin}
              min={RANGO_PRECIO.min}
              max={filtros.precioMax - RANGO_PRECIO.paso}
              onChange={(val) => setFiltro("precioMin", val)}
            />
            <InputPrecio
              etiqueta="Máximo"
              valor={filtros.precioMax}
              min={filtros.precioMin + RANGO_PRECIO.paso}
              max={RANGO_PRECIO.max}
              onChange={(val) => setFiltro("precioMax", val)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS_PRECIO.map((preset) => {
              const activo = presetActivo === preset;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    setFiltro("precioMin", preset.min);
                    setFiltro("precioMax", preset.max);
                  }}
                  className="rounded-[2px] transition-all"
                  style={{
                    fontFamily: "var(--font-tag)",
                    fontSize: "10px",
                    letterSpacing: "0.04em",
                    padding: "6px 10px",
                    background: activo ? "var(--gold)" : "transparent",
                    color: "var(--noir)",
                    border: activo ? "1px solid var(--gold)" : "1px solid var(--border-gold-40)",
                    cursor: "pointer",
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </SeccionFiltro>

      {/* Departamento */}
      <SeccionFiltro titulo="Departamento">
        <div className="flex flex-col gap-1">
          {departamentos.map((dep) => {
            const activo = filtros.departamento === dep;
            return (
              <button
                key={dep}
                onClick={() => setFiltro("departamento", activo ? "" : dep)}
                className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-left transition-all"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  background: activo ? "var(--gold-08)" : "transparent",
                  color: "var(--noir)",
                  border: activo ? "1px solid var(--border-gold-40)" : "1px solid transparent",
                  cursor: "pointer",
                  fontWeight: activo ? 600 : 400,
                }}
              >
                <i
                  className="bi bi-check-circle-fill text-xs shrink-0"
                  style={{
                    color: "var(--gold-dark)",
                    opacity: activo ? 1 : 0,
                    transition: "opacity 0.2s",
                  }}
                />
                {dep}
              </button>
            );
          })}
        </div>
      </SeccionFiltro>

      {/* Tallas superiores */}
      <SeccionFiltro titulo="Talla ropa">
        <div className="flex flex-wrap gap-1.5">
          {tallasSuperiores.map((t) => {
            const activa = filtros.tallas.includes(t);
            return (
              <button
                key={t}
                onClick={() => setFiltro("tallas", toggleTalla(filtros.tallas, t))}
                className="min-w-[36px] h-9 px-2 rounded-[2px] transition-all"
                style={{
                  fontFamily: "var(--font-tag)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  background: activa ? "var(--gold)" : "transparent",
                  color: "var(--noir)",
                  border: activa ? "1px solid var(--gold)" : "1px solid var(--border-gold-40)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!activa) {
                    e.currentTarget.style.borderColor = "var(--gold-dark)";
                    e.currentTarget.style.background = "var(--gold-08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!activa) {
                    e.currentTarget.style.borderColor = "var(--border-gold-40)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </SeccionFiltro>

      {/* Tallas inferiores */}
      <SeccionFiltro titulo="Talla inferior">
        <div className="flex flex-wrap gap-1.5">
          {tallasInferiores.map((t) => {
            const activa = filtros.tallas.includes(t);
            return (
              <button
                key={t}
                onClick={() => setFiltro("tallas", toggleTalla(filtros.tallas, t))}
                className="min-w-[36px] h-9 px-2 rounded-[2px] transition-all"
                style={{
                  fontFamily: "var(--font-tag)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  background: activa ? "var(--gold)" : "transparent",
                  color: "var(--noir)",
                  border: activa ? "1px solid var(--gold)" : "1px solid var(--border-gold-40)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!activa) {
                    e.currentTarget.style.borderColor = "var(--gold-dark)";
                    e.currentTarget.style.background = "var(--gold-08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!activa) {
                    e.currentTarget.style.borderColor = "var(--border-gold-40)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </SeccionFiltro>

      {/* Solo en stock */}
      <SeccionFiltro titulo="Disponibilidad" ultima>
        <label className="flex items-center gap-2 cursor-pointer mt-3">
          <span
            className="w-4 h-4 rounded-[2px] flex items-center justify-center transition-all shrink-0"
            style={{
              background: filtros.soloEnStock ? "var(--gold)" : "transparent",
              border: filtros.soloEnStock
                ? "1px solid var(--gold)"
                : "1px solid var(--border-gold-40)",
            }}
          >
            {filtros.soloEnStock && (
              <i className="bi bi-check text-sm leading-none" style={{ color: "var(--noir)" }} />
            )}
          </span>
          <input
            type="checkbox"
            checked={filtros.soloEnStock}
            onChange={(e) => setFiltro("soloEnStock", e.target.checked)}
            className="sr-only"
          />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--noir)" }}>
            Solo productos en stock
          </span>
        </label>
      </SeccionFiltro>
    </div>
  );
}

export function DrawerFiltros({ filtros, setFiltro, onLimpiar, filtrosActivos = 0, abierto, onCerrar }) {
  return (
    <>
      <div
        onClick={onCerrar}
        className={`fixed inset-0 z-[60] backdrop-blur-sm transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(13,13,13,0.45)" }}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[61] max-h-[85vh] overflow-y-auto p-4 transition-transform duration-300 ${
          abierto ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "var(--ivory-deep)",
          borderTop: "1px solid var(--border-gold-25)",
          borderRadius: "2px 2px 0 0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-[2px] mx-auto mb-4" style={{ background: "var(--gold)", opacity: 0.5 }} />
        <ContenidoFiltros filtros={filtros} setFiltro={setFiltro} onLimpiar={onLimpiar} filtrosActivos={filtrosActivos} onCerrar={onCerrar} />
      </div>
    </>
  );
}

export default function FiltrosSidebar({ filtros, setFiltro, onLimpiar, filtrosActivos = 0 }) {
  return (
    <aside className="sticky top-32 self-start hidden lg:block w-[260px] shrink-0">
      <ContenidoFiltros filtros={filtros} setFiltro={setFiltro} onLimpiar={onLimpiar} filtrosActivos={filtrosActivos} />
    </aside>
  );
}
