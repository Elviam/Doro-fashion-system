const opcionesOrden = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
];

export default function BarraOrdenamiento({ total, ordenamiento, setOrdenamiento, vista, setVista, onAbrirFiltros, filtrosActivos = 0 }) {
  return (
    <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
      {filtrosActivos > 0 ? (
        <p className="font-tag text-xs lg:text-sm font-bold uppercase tracking-[0.14em] text-[var(--noir-soft)]">
          <b className="tabular-nums">{total}</b> PRODUCTOS ENCONTRADOS
        </p>
      ) : (
        <span aria-hidden="true" />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onAbrirFiltros}
          className="font-tag lg:hidden h-10 min-w-[112px] flex items-center justify-center gap-1.5 bg-[var(--noir-soft)] border border-[var(--border-gold-20)] text-[var(--ash)] hover:text-[var(--snow)] hover:border-[var(--gold)] px-3 rounded-[2px] text-xs lg:text-sm font-bold transition"
        >
          <i className="bi bi-sliders" />
          Filtros
          {filtrosActivos > 0 && (
            <span className="bg-[var(--gold)] text-[var(--noir)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {filtrosActivos}
            </span>
          )}
        </button>

        <div className="h-10 min-w-[88px] flex items-center bg-[var(--noir-soft)] border border-[var(--border-gold-20)] rounded-[2px] p-0.5">
          <button
            onClick={() => setVista("grid")}
            title="Vista cuadricula"
            className={`w-9 h-9 rounded-[2px] flex items-center justify-center transition-colors ${
              vista === "grid"
                ? "bg-[var(--gold)] text-[var(--noir)]"
                : "text-[var(--ash)] hover:text-[var(--snow)]"
            }`}
          >
            <i className="bi bi-grid-3x3-gap-fill" />
          </button>
          <button
            onClick={() => setVista("lista")}
            title="Vista lista"
            className={`w-9 h-9 rounded-[2px] flex items-center justify-center transition-colors ${
              vista === "lista"
                ? "bg-[var(--gold)] text-[var(--noir)]"
                : "text-[var(--ash)] hover:text-[var(--snow)]"
            }`}
          >
            <i className="bi bi-list-ul" />
          </button>
        </div>

        <select
          value={ordenamiento}
          onChange={(e) => setOrdenamiento(e.target.value)}
          className="h-10 min-w-[160px] max-w-[160px] sm:max-w-none font-body bg-[var(--noir-soft)] text-[var(--snow)] border border-[var(--border-gold-20)] rounded-[2px] px-3 text-xs lg:text-sm font-medium outline-none hover:border-[var(--gold)] cursor-pointer"
        >
          {opcionesOrden.map((op) => (
            <option key={op.value} value={op.value} className="bg-[var(--noir)]">
              {op.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
