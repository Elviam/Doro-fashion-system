const opcionesOrden = [
  { value: "relevancia",  label: "Relevancia"           },
  { value: "precio_asc",  label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "nombre_asc",  label: "Nombre: A - Z"         },
  { value: "nombre_desc", label: "Nombre: Z - A"         },
];

export default function BarraOrdenamiento({ total, ordenamiento, setOrdenamiento, vista, setVista, onAbrirFiltros, filtrosActivos = 0 }) {
  return (
    <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">

      {/* Contador de resultados */}
      <p className="font-body text-sm lg:text-base text-[var(--ash)]">
        <b className="text-[var(--snow)] tabular-nums">{total}</b> productos encontrados
      </p>

      <div className="flex items-center gap-2">

        {/* Botón filtros — solo móvil */}
        <button
          onClick={onAbrirFiltros}
          className="font-tag lg:hidden flex items-center gap-1.5 bg-[var(--noir-soft)] border border-[var(--border-gold-20)] text-[var(--ash)] hover:text-[var(--snow)] hover:border-[var(--gold)] px-3 py-2 rounded-[2px] text-xs lg:text-sm font-bold transition"
        >
          <i className="bi bi-sliders" />
          Filtros
          {filtrosActivos > 0 && (
            <span className="bg-[var(--gold)] text-[var(--noir)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {filtrosActivos}
            </span>
          )}
        </button>

        {/* Toggle grid / lista */}
        <div className="flex items-center bg-[var(--noir-soft)] border border-[var(--border-gold-20)] rounded-[2px] p-0.5">
          <button
            onClick={() => setVista("grid")}
            title="Vista cuadrícula"
            className={`w-8 h-8 rounded-[2px] flex items-center justify-center transition-colors ${
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
            className={`w-8 h-8 rounded-[2px] flex items-center justify-center transition-colors ${
              vista === "lista"
                ? "bg-[var(--gold)] text-[var(--noir)]"
                : "text-[var(--ash)] hover:text-[var(--snow)]"
            }`}
          >
            <i className="bi bi-list-ul" />
          </button>
        </div>

        {/* Selector de ordenamiento */}
        <select
          value={ordenamiento}
          onChange={(e) => setOrdenamiento(e.target.value)}
          className="font-body bg-[var(--noir-soft)] text-[var(--snow)] border border-[var(--border-gold-20)] rounded-[2px] px-3 py-2 text-xs lg:text-sm font-medium outline-none hover:border-[var(--gold)] cursor-pointer max-w-[130px] sm:max-w-none"
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