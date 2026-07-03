import { useState } from 'react';

// Paleta placeholder (cuando el producto no tiene imagen) — tonos oro/noir/ivory
const paletasPorCategoria = {
  "Playeras":   ["#D6AB34", "#F7F0E6", "#0A0A0A"],
  "Blusas":     ["#E8C468", "#F7F0E6", "#B8923D"],
  "Camisas":    ["#C9A227", "#F7F0E6", "#8A7028"],
  "Suéteres":   ["#B8923D", "#8A7028", "#F7F0E6"],
  "Sudaderas":  ["#8A7028", "#0A0A0A", "#F7F0E6"],
  "Chamarras":  ["#D6AB34", "#B8923D", "#0A0A0A"],
  "Abrigos":    ["#8A7028", "#0A0A0A", "#B8923D"],
  "Vestidos":   ["#E8C468", "#B8923D", "#F7F0E6"],
  "Faldas":     ["#D6AB34", "#E8C468", "#F7F0E6"],
  "Shorts":     ["#C9A227", "#8A7028", "#F7F0E6"],
  "Pantalones": ["#8A7028", "#0A0A0A", "#B8923D"],
  "Calzado":    ["#D6AB34", "#C9A227", "#F7F0E6"],
  "Accesorios": ["#B8923D", "#E8C468", "#F7F0E6"],
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

  const [c0, c1, c2] = paletasPorCategoria[producto.categoria] || ["#B8923D", "#F7F0E6", "#0A0A0A"];

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
        <span
          className="text-xs tracking-widest uppercase text-center px-2"
          style={{ fontFamily: "var(--font-tag)", color: "rgba(247,240,230,0.5)" }}
        >
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
    <div
      className="flex gap-4 rounded-[2px] overflow-hidden transition-all"
      style={{ background: "var(--noir-soft)", border: "1px solid var(--border-gold-20)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-40)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-20)")}
    >
      <div className="w-44 shrink-0 relative">
        <ImagenProducto producto={producto} />

        <button
          onClick={toggleFavorito}
          title={esFavorito ? "Remover de favoritos" : "Agregar a favoritos"}
          className="absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
          style={{ background: "rgba(10,10,10,0.4)" }}
        >
          <i
            className={`bi text-sm transition-all duration-200 ${esFavorito ? "bi-heart-fill" : "bi-heart"}`}
            style={{ color: esFavorito ? "var(--rojo, #e53935)" : "var(--gold-light)" }}
          />
        </button>

        {agotado && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.7)" }}>
            <span
              className="text-xs tracking-[3px] uppercase font-bold px-3 py-1 rounded-[2px]"
              style={{ color: "var(--snow)", background: "rgba(229,57,53,0.8)" }}
            >
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 py-4 pr-4 flex flex-col gap-1">
        <p
          className="text-[11px] uppercase tracking-widest font-bold"
          style={{ fontFamily: "var(--font-tag)", color: "var(--gold)" }}
        >
          {producto.categoria} · {producto.departamento}
        </p>
        <h3
          className="text-base font-semibold leading-tight"
          style={{ fontFamily: "var(--font-body)", color: "var(--snow)" }}
        >
          {producto.nombre}
        </h3>
        <p
          className="text-xl font-extrabold tabular-nums"
          style={{ color: "var(--gold-light)" }}
        >
          ${Number(producto.precioVenta).toLocaleString("es-MX")}
        </p>
        {todasLasTallas.length > 0 && (
          <p
            className="text-xs flex flex-wrap gap-x-1.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--ash)" }}
          >
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
            className="px-5 py-2 rounded-[2px] text-xs font-bold transition"
            style={{
              fontFamily: "var(--font-tag)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1px solid var(--border-gold-40)",
              color: "var(--gold-light)",
              background: "transparent",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold-08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <i className="bi bi-eye mr-1" />
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  );
}

function TarjetaGrid({ producto, onVistaRapida, onFavoritoChange, favoritos }) {
  const todasLasTallas = producto.inventario ?? [];
  const agotado = producto.stock === 0;
  const esFavorito = favoritos.includes(producto.id);

  const toggleFavorito = (e) => {
    e.stopPropagation();
    onFavoritoChange?.(producto.id, esFavorito ? "quitado" : "agregado");
  };

  return (
    <div
      className="group relative rounded-[2px] overflow-hidden transition-all hover:-translate-y-1"
      style={{
        background: "var(--noir-soft)",
        border: "1px solid var(--border-gold-20)",
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-gold-40)";
        e.currentTarget.style.boxShadow = "0 18px 38px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-gold-20)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >

      {/* Imagen */}
      <div className="relative aspect-[4/5]">
        <ImagenProducto producto={producto} className="absolute inset-0" />

        <button
          onClick={toggleFavorito}
          title={esFavorito ? "Remover de favoritos" : "Agregar a favoritos"}
          className="absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
          style={{ background: "rgba(10,10,10,0.4)" }}
        >
          <i
            className={`bi text-sm transition-all duration-200 ${esFavorito ? "bi-heart-fill" : "bi-heart"}`}
            style={{ color: esFavorito ? "var(--rojo, #e53935)" : "var(--gold-light)" }}
          />
        </button>

        {agotado && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.7)" }}>
            <span
              className="text-xs tracking-[3px] uppercase font-bold px-3 py-1 rounded-[2px]"
              style={{ color: "var(--snow)", background: "rgba(229,57,53,0.8)" }}
            >
              Agotado
            </span>
          </div>
        )}

        <div className="absolute left-3 right-3 bottom-3 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all">
          <button
            onClick={() => onVistaRapida(producto)}
            className="w-full backdrop-blur text-xs font-bold py-2 rounded-[2px] transition"
            style={{
              fontFamily: "var(--font-tag)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "rgba(10,10,10,0.9)",
              color: "var(--gold-light)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--noir)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(10,10,10,0.9)")}
          >
            <i className="bi bi-eye mr-1" />
            Ver detalle
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p
          className="text-[10px] uppercase tracking-widest font-bold mb-1"
          style={{ fontFamily: "var(--font-tag)", color: "var(--gold)" }}
        >
          {producto.categoria}
        </p>
        <h3
          className="text-[13px] font-semibold line-clamp-2 min-h-[2.5em] leading-tight"
          style={{ fontFamily: "var(--font-body)", color: "var(--snow)" }}
        >
          {producto.nombre}
        </h3>
        <p
          className="text-base font-extrabold tabular-nums mt-1"
          style={{ color: "var(--gold-light)" }}
        >
          ${Number(producto.precioVenta).toLocaleString("es-MX")}
        </p>
        {todasLasTallas.length > 0 && (
          <p
            className="text-[10px] mt-1 flex flex-wrap gap-x-1.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--ash)" }}
          >
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