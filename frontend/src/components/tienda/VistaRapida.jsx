import { useState } from "react";

const beneficios = [
  { icono: "bi-truck",        texto: "Envío 24h CDMX"       },
  { icono: "bi-arrow-repeat", texto: "30 días de devolución"   },
  { icono: "bi-shield-check", texto: "Pago seguro"          },
  { icono: "bi-gift",         texto: "Empaque eco"          },
];

const paletasPorCategoria = {
  "Playeras":   ["#9F86C0", "#E7D6FF", "#2C2A48"],
  "Blusas":     ["#ED8ABA", "#E7D6FF", "#C9B8E8"],
  "Camisas":    ["#7EC9ED", "#E7D6FF", "#A68DC8"],
  "Suéteres":   ["#C9B8E8", "#A68DC8", "#E7D6FF"],
  "Sudaderas":  ["#A68DC8", "#2C2A48", "#E7D6FF"],
  "Chamarras":  ["#F7CB57", "#FAA86B", "#2C2A48"],
  "Abrigos":    ["#7EC9ED", "#2C2A48", "#A68DC8"],
  "Vestidos":   ["#ED8ABA", "#C9B8E8", "#E7D6FF"],
  "Faldas":     ["#FAA86B", "#ED8ABA", "#E7D6FF"],
  "Shorts":     ["#A3E378", "#7EC9ED", "#E7D6FF"],
  "Pantalones": ["#7EC9ED", "#2C2A48", "#A68DC8"],
  "Calzado":    ["#FAA86B", "#F7CB57", "#E7D6FF"],
  "Accesorios": ["#C9B8E8", "#ED8ABA", "#E7D6FF"],
};

function ImagenVistaRapida({ producto }) {
  if (producto.imagen) {
    return (
      <img
        src={producto.imagen}
        alt={producto.nombre}
        className="w-full h-full object-cover"
      />
    );
  }

  const [c0, c1, c2] = paletasPorCategoria[producto.categoria] || ["#A68DC8", "#E7D6FF", "#2C2A48"];

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `radial-gradient(120% 100% at 20% 0%, ${c1}, transparent 55%),
                     radial-gradient(120% 100% at 90% 100%, ${c2}aa, transparent 60%),
                     linear-gradient(140deg, ${c0}, ${c0}cc 60%, ${c2})`,
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0 14px, rgba(255,255,255,0.08) 14px 15px)",
        }}
      >
        <span className="text-white/40 text-sm tracking-widest uppercase font-mono text-center px-4">
          {producto.nombre}
        </span>
      </div>
    </div>
  );
}

export default function VistaRapida({ producto, onCerrar, onAgregarAlCarrito }) {
  const todasLasTallas    = producto.inventario ?? [];
  const tallasDisponibles = todasLasTallas.filter((i) => i.stock > 0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(
    tallasDisponibles[0]?.talla || ""
  );
  const [cantidad, setCantidad] = useState(1);

  const agotado = producto.stock === 0;

  const stockTallaActual = todasLasTallas.find((i) => i.talla === tallaSeleccionada)?.stock ?? 0;

  const handleSeleccionarTalla = (talla) => {
    setTallaSeleccionada(talla);
    setCantidad(1);
  };

  const handleAgregar = () => {
    onAgregarAlCarrito(producto, { talla: tallaSeleccionada, cantidad });
    onCerrar();
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCerrar}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-oscuro border border-lila/20 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2"
      >
        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-oscuro/80 backdrop-blur text-blanco flex items-center justify-center hover:bg-rojo transition"
        >
          <i className="bi bi-x-lg" />
        </button>

        {/* Imagen */}
        <div className="relative min-h-[220px] sm:min-h-[320px] md:min-h-[480px] rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
          <ImagenVistaRapida producto={producto} />
        </div>

        {/* Información */}
        <div className="p-6 md:p-8 flex flex-col">
          <p className="text-[11px] tracking-[3px] text-lila-mid uppercase font-bold">
            AURA · {producto.categoria} · {producto.departamento}
          </p>
          <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-blanco leading-tight">
            {producto.nombre}
          </h2>
          <p className="mt-1 text-xs text-text-muted">SKU: {producto.sku}</p>

          {/* Precio */}
          <p className="mt-4 text-2xl md:text-3xl font-extrabold text-lila tabular-nums">
            ${Number(producto.precioVenta).toLocaleString("es-MX")}
          </p>

          {/* Selector de talla */}
          {todasLasTallas.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] tracking-[2px] text-lila-soft uppercase font-bold mb-2">
                Talla
              </p>
              <div className="flex flex-wrap gap-1.5">
                {todasLasTallas.map((item) => {
                  const sinStock = item.stock === 0;
                  const seleccionada = tallaSeleccionada === item.talla;
                  return (
                    <button
                      key={item.talla}
                      onClick={() => !sinStock && handleSeleccionarTalla(item.talla)}
                      disabled={sinStock}
                      title={sinStock ? "Sin stock" : undefined}
                      className={`relative min-w-[44px] h-10 px-3 rounded-lg text-sm font-bold border-2 transition-all
                        ${sinStock
                          ? "border-lila/10 text-lila/25 cursor-not-allowed bg-transparent"
                          : seleccionada
                            ? "bg-lila text-oscuro border-lila"
                            : "bg-transparent text-blanco border-lila/20 hover:border-lila"
                        }`}
                    >
                      {item.talla}
                      {sinStock && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-full h-px bg-lila/25 absolute rotate-45" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selector de cantidad */}
          {!agotado && (
            <div className="mt-5 flex items-center gap-3">
              <p className="text-[11px] tracking-[2px] text-lila-soft uppercase font-bold">
                Cantidad
              </p>
              <div className="flex items-center bg-bg-card border border-lila/20 rounded-lg">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-10 h-10 text-lila-soft hover:bg-lila/10 rounded-l-lg transition"
                >
                  <i className="bi bi-dash text-lg" />
                </button>
                <span className="w-10 text-center text-base font-bold tabular-nums text-blanco">
                  {cantidad}
                </span>
                <button
                  onClick={() => setCantidad((c) => Math.min(c + 1, stockTallaActual))}
                  disabled={cantidad >= stockTallaActual}
                  className="w-10 h-10 text-lila-soft hover:bg-lila/10 rounded-r-lg transition disabled:opacity-30"
                >
                  <i className="bi bi-plus text-lg" />
                </button>
              </div>
            </div>
          )}

          {/* Botón agregar */}
          <button
            onClick={handleAgregar}
            disabled={agotado}
            className="mt-5 w-full bg-lila text-oscuro font-bold py-3 rounded-xl hover:bg-lila-soft transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <i className="bi bi-bag-plus" />
            {agotado ? "Agotado" : "Agregar al carrito"}
          </button>

          {/* Beneficios */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {beneficios.map((b) => (
              <div key={b.texto} className="flex items-center gap-2 text-xs text-lila-soft">
                <i className={`bi ${b.icono} text-lila`} />
                {b.texto}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
