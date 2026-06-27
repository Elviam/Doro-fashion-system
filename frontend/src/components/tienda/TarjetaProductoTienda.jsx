import { useState } from 'react';

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

function ImagenProducto({ producto, className = "" }) {
  if (producto.imagen) {
    return (
      <img
        src={producto.imagen}
        alt={producto.nombre}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  const [c0, c1, c2] = paletasPorCategoria[producto.categoria] || ["#A68DC8", "#E7D6FF", "#2C2A48"];

  return (
    <div
      className={`w-full h-full ${className}`}
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
        <span className="text-white/40 text-xs tracking-widest uppercase font-mono text-center px-2">
          {producto.nombre.split(" ").slice(0, 2).join(" ")}
        </span>
      </div>
    </div>
  );
}

function TarjetaLista({ producto, onVistaRapida, onFavoritoChange, favoritos }) {
  const todasLasTallas = producto.inventario ?? [];
  const agotado = producto.stock === 0;
  const esFavorito = favoritos.includes(producto.id);

  const toggleFavorito = (e) => {
    e.stopPropagation();
    onFavoritoChange?.(producto.id, esFavorito ? "quitado" : "agregado");
  };

  return (
    <div className="flex gap-4 bg-bg-card border border-lila/10 rounded-2xl overflow-hidden hover:border-lila/30 transition-all">
      <div className="w-44 shrink-0 relative">
        <ImagenProducto producto={producto} />

        {/* Corazón — esquina superior derecha */}
        <button
          onClick={toggleFavorito}
          title={esFavorito ? "Remover de favoritos" : "Agregar a favoritos"}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blanco/30 backdrop-blur flex items-center justify-center hover:bg-blanco/50 transition-all duration-200 hover:scale-110 z-10"
        >
          <i className={`bi text-sm transition-all duration-200 ${
            esFavorito ? "bi-heart-fill text-rojo" : "bi-heart text-rojo"
          }`} />
        </button>

        {agotado && (
          <div className="absolute inset-0 bg-oscuro/70 flex items-center justify-center">
            <span className="text-xs tracking-[3px] uppercase font-bold text-blanco bg-rojo/80 px-3 py-1 rounded">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 py-4 pr-4 flex flex-col gap-1">
        <p className="text-[11px] text-lila-mid uppercase tracking-widest font-bold">
          {producto.categoria} · {producto.departamento}
        </p>
        <h3 className="text-base font-semibold text-blanco leading-tight">
          {producto.nombre}
        </h3>
        <p className="text-xl font-extrabold text-lila tabular-nums">
          ${Number(producto.precioVenta).toLocaleString("es-MX")}
        </p>
        {todasLasTallas.length > 0 && (
          <p className="text-xs text-lila-soft flex flex-wrap gap-x-1.5">
            Tallas:{" "}
            {todasLasTallas.map((item) => (
              <span
                key={item.talla}
                className={item.stock === 0 ? "line-through opacity-30" : ""}
              >
                {item.talla}
              </span>
            ))}
          </p>
        )}
        <div className="mt-auto pt-3">
          <button
            onClick={() => onVistaRapida(producto)}
            className="px-5 py-2 rounded-lg border border-lila/20 text-lila-soft text-xs font-bold hover:bg-lila/10 transition"
          >
            <i className="bi bi-eye mr-1" />
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TarjetaGrid ──────────────────────────────────────────────────────────────
// Ahora recibe `favoritos` (array de IDs) desde Tienda.jsx como fuente de verdad
function TarjetaGrid({ producto, onVistaRapida, onFavoritoChange, favoritos }) {
  const todasLasTallas = producto.inventario ?? [];
  const agotado = producto.stock === 0;

  // esFavorito se deriva de la prop, no de localStorage directamente
  const esFavorito = favoritos.includes(producto.id);

  const toggleFavorito = (e) => {
    e.stopPropagation();
    onFavoritoChange?.(producto.id, esFavorito ? "quitado" : "agregado");
  };

  return (
    <div className="group relative bg-bg-card border border-lila/10 rounded-2xl overflow-hidden hover:border-lila/40 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.35)] transition-all">

      {/* Imagen */}
      <div className="relative aspect-[4/5]">
        <ImagenProducto producto={producto} className="absolute inset-0" />

        {/* Botón favorito */}
        <button
          onClick={toggleFavorito}
          title={esFavorito ? "Remover de favoritos" : "Agregar a favoritos"}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-blanco/30 backdrop-blur flex items-center justify-center hover:bg-blanco/50 transition-all duration-200 hover:scale-110 z-10"
        >
          <i className={`bi text-sm transition-all duration-200 ${
            esFavorito ? "bi-heart-fill text-rojo" : "bi-heart text-rojo"
          }`} />
        </button>

        {/* Badge agotado */}
        {agotado && (
          <div className="absolute inset-0 bg-oscuro/70 flex items-center justify-center">
            <span className="text-xs tracking-[3px] uppercase font-bold text-blanco bg-rojo/80 px-3 py-1 rounded">
              Agotado
            </span>
          </div>
        )}

        {/* Botón ver detalle */}
        <div className="absolute left-3 right-3 bottom-3 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all">
          <button
            onClick={() => onVistaRapida(producto)}
            className="w-full bg-oscuro/90 backdrop-blur text-blanco text-xs font-bold py-2 rounded-lg hover:bg-oscuro transition"
          >
            <i className="bi bi-eye mr-1" />
            Ver detalle
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-[10px] text-lila-mid uppercase tracking-widest font-bold mb-1">
          {producto.categoria}
        </p>
        <h3 className="text-[13px] font-semibold text-blanco line-clamp-2 min-h-[2.5em] leading-tight">
          {producto.nombre}
        </h3>
        <p className="text-base font-extrabold text-lila tabular-nums mt-1">
          ${Number(producto.precioVenta).toLocaleString("es-MX")}
        </p>
        {todasLasTallas.length > 0 && (
          <p className="text-[10px] text-lila-soft mt-1 flex flex-wrap gap-x-1.5">
            {todasLasTallas.map((item) => (
              <span
                key={item.talla}
                className={item.stock === 0 ? "line-through opacity-30" : ""}
              >
                {item.talla}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TarjetaProductoTienda({ producto, vista, onVistaRapida, onFavoritoChange, favoritos }) {
  if (vista === "lista") return (
    <TarjetaLista
      producto={producto}
      onVistaRapida={onVistaRapida}
      onFavoritoChange={onFavoritoChange}
      favoritos={favoritos}
    />
  );
  return (
    <TarjetaGrid
      producto={producto}
      onVistaRapida={onVistaRapida}
      onFavoritoChange={onFavoritoChange}
      favoritos={favoritos}
    />
  );
}