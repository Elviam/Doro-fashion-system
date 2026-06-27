const departamentos = ["Dama", "Caballero", "Unisex"];

const tallasSuperiores = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
const tallasInferiores = ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"];
const tallasCalzado    = ["22", "22.5", "23", "23.5", "24", "24.5", "25", "25.5", "26", "26.5", "27", "27.5", "28", "28.5", "29", "29.5", "30", "31"];

function toggleTalla(tallas, talla) {
  return tallas.includes(talla)
    ? tallas.filter((t) => t !== talla)
    : [...tallas, talla];
}

function SeccionFiltro({ titulo, children, ultima = false }) {
  return (
    <div className={`py-4 ${!ultima ? "border-b border-lila/10" : ""}`}>
      <p className="text-[11px] tracking-[2px] text-lila-soft uppercase font-bold mb-3">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function ContenidoFiltros({ filtros, setFiltro, onLimpiar, onCerrar }) {
  return (
    <div className="bg-bg-card border border-lila/10 rounded-2xl p-5 shadow-lg">

        {/* Encabezado */}
        <div className="flex justify-between items-center mb-2">
          <p className="text-base font-bold text-blanco">Filtros</p>
          <div className="flex items-center gap-3">
            <button onClick={onLimpiar} className="text-xs text-lila-soft hover:text-lila underline">
              Limpiar
            </button>
            {onCerrar && (
              <button onClick={onCerrar} className="text-lila-soft hover:text-blanco transition">
                <i className="bi bi-x-lg text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Precio */}
        <SeccionFiltro titulo="Precio máximo">
          <input type="range" min={0} max={2000} step={50} value={filtros.precioMax}
            onChange={(e) => setFiltro("precioMax", parseInt(e.target.value))}
            className="w-full accent-lila"
          />
          <div className="flex justify-between text-xs text-lila-soft mt-1">
            <span>$0</span>
            <b className="text-lila">Hasta ${Number(filtros.precioMax).toLocaleString("es-MX")}</b>
          </div>
        </SeccionFiltro>

        {/* Departamento */}
        <SeccionFiltro titulo="Departamento">
          <div className="flex flex-col gap-2">
            {departamentos.map((dep) => {
              const activo = filtros.departamento === dep;
              return (
                <button key={dep} onClick={() => setFiltro("departamento", activo ? "" : dep)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    activo ? "bg-lila/10 text-blanco border border-lila/30" : "text-lila-soft hover:text-blanco border border-transparent"
                  }`}
                >
                  <i className={`bi bi-check-circle-fill text-xs ${activo ? "text-lila" : "opacity-0"}`} />
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
                <button key={t} onClick={() => setFiltro("tallas", toggleTalla(filtros.tallas, t))}
                  className={`min-w-[36px] h-9 px-2 rounded-md text-xs font-bold border transition-colors ${
                    activa ? "bg-lila text-oscuro border-lila" : "text-lila-soft border-lila/20 hover:border-lila"
                  }`}
                >{t}</button>
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
                <button key={t} onClick={() => setFiltro("tallas", toggleTalla(filtros.tallas, t))}
                  className={`min-w-[36px] h-9 px-2 rounded-md text-xs font-bold border transition-colors ${
                    activa ? "bg-lila text-oscuro border-lila" : "text-lila-soft border-lila/20 hover:border-lila"
                  }`}
                >{t}</button>
              );
            })}
          </div>
        </SeccionFiltro>

        {/* Tallas calzado */}
        <SeccionFiltro titulo="Talla calzado">
          <div className="flex flex-wrap gap-1.5">
            {tallasCalzado.map((t) => {
              const activa = filtros.tallas.includes(t);
              return (
                <button key={t} onClick={() => setFiltro("tallas", toggleTalla(filtros.tallas, t))}
                  className={`min-w-[40px] h-9 px-2 rounded-md text-xs font-bold border transition-colors ${
                    activa ? "bg-lila text-oscuro border-lila" : "text-lila-soft border-lila/20 hover:border-lila"
                  }`}
                >{t}</button>
              );
            })}
          </div>
        </SeccionFiltro>

        {/* Solo en stock */}
        <SeccionFiltro titulo="Disponibilidad" ultima>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-blanco">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              filtros.soloEnStock ? "bg-lila border-lila" : "border-lila/30"
            }`}>
              {filtros.soloEnStock && <i className="bi bi-check text-oscuro text-sm leading-none" />}
            </span>
            <input type="checkbox" checked={filtros.soloEnStock}
              onChange={(e) => setFiltro("soloEnStock", e.target.checked)}
              className="sr-only"
            />
            Solo productos en stock
          </label>
        </SeccionFiltro>

    </div>
  );
}

export function DrawerFiltros({ filtros, setFiltro, onLimpiar, abierto, onCerrar }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel deslizante desde abajo */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[61] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-oscuro p-4 transition-transform duration-300 ${
          abierto ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-lila/30 rounded-full mx-auto mb-4" />
        <ContenidoFiltros filtros={filtros} setFiltro={setFiltro} onLimpiar={onLimpiar} onCerrar={onCerrar} />
      </div>
    </>
  );
}

export default function FiltrosSidebar({ filtros, setFiltro, onLimpiar }) {
  return (
    <aside className="sticky top-32 self-start hidden lg:block w-[260px] shrink-0">
      <ContenidoFiltros filtros={filtros} setFiltro={setFiltro} onLimpiar={onLimpiar} />
    </aside>
  );
}
