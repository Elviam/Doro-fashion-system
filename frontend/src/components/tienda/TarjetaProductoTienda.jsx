import { useState } from "react";

function ImagenProducto({ producto, className = "" }) {
  const [cargada, setCargada] = useState(false);
  const portada = producto.imagenes?.[0];

  if (!portada) {
    return <div className={`w-full h-full bg-[var(--ivory)] ${className}`} />;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {!cargada && (
        <div
          className="absolute inset-0"
          style={{ animation: "shimmerGris 1.4s ease-in-out infinite" }}
        />
      )}
      <img
        src={portada}
        alt={producto.nombre}
        loading="lazy"
        onLoad={() => setCargada(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${cargada ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function BotonFavorito({ esFavorito, onToggle, size = "w-8 h-8" }) {
  return (
    <button
      onClick={onToggle}
      title={esFavorito ? "Remover de favoritos" : "Agregar a favoritos"}
      aria-label={esFavorito ? "Remover de favoritos" : "Agregar a favoritos"}
      className={`absolute top-2 right-2 ${size} rounded-full backdrop-blur flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-10`}
      style={{ background: "rgba(10,10,10,0.45)" }}
    >
      <i
        className={`bi text-sm transition-all duration-200 ${esFavorito ? "bi-heart-fill" : "bi-heart"}`}
        style={{ color: esFavorito ? "var(--rojo, #e53935)" : "var(--gold-light)" }}
      />
    </button>
  );
}

function EtiquetaAgotado() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.7)" }}>
      <span
        className="text-xs tracking-[3px] uppercase font-bold px-3 py-1 rounded-[2px]"
        style={{ color: "var(--snow)", background: "rgba(229,57,53,0.8)" }}
      >
        Agotado
      </span>
    </div>
  );
}

function useTarjetaClickeable(onVistaRapida, producto) {
  const handleClick = () => onVistaRapida(producto);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onVistaRapida(producto);
    }
  };
  return { handleClick, handleKeyDown };
}

function InfoProducto({ producto, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <h3
        className="min-w-0 w-full line-clamp-2 min-h-[2.5em] text-[15px] sm:text-base font-semibold leading-tight"
        style={{ fontFamily: "var(--font-body)", color: "var(--snow)" }}
      >
        {producto.nombre}
      </h3>
      <p
        className="text-base sm:text-lg font-extrabold tabular-nums"
        style={{ color: "var(--gold-light)" }}
      >
        ${Number(producto.precioVenta).toLocaleString("es-MX")}
      </p>
    </div>
  );
}

function TarjetaLista({ producto, onVistaRapida, onFavoritoChange, favoritos, onPrecargarDetalle }) {
  const agotado = producto.stock === 0;
  const esFavorito = favoritos.includes(producto.id);
  const { handleClick, handleKeyDown } = useTarjetaClickeable(onVistaRapida, producto);

  const toggleFavorito = (e) => {
    e.stopPropagation();
    onFavoritoChange?.(producto.id, esFavorito ? "quitado" : "agregado");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => onPrecargarDetalle?.(producto)}
      className="flex gap-4 min-h-[150px] rounded-[2px] overflow-hidden transition-all cursor-pointer outline-none focus-visible:ring-2"
      style={{ background: "var(--noir-soft)", border: "1px solid var(--border-gold-20)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold-40)"; onPrecargarDetalle?.(producto); }}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-20)")}
    >
      <div className="w-32 sm:w-44 aspect-[3/4] shrink-0 relative">
        <ImagenProducto producto={producto} />
        <BotonFavorito esFavorito={esFavorito} onToggle={toggleFavorito} />
        {agotado && <EtiquetaAgotado />}
      </div>
      <InfoProducto producto={producto} className="flex-1 justify-center py-4 pr-4" />
    </div>
  );
}

function TarjetaGrid({ producto, onVistaRapida, onFavoritoChange, favoritos, onPrecargarDetalle }) {
  const agotado = producto.stock === 0;
  const esFavorito = favoritos.includes(producto.id);
  const { handleClick, handleKeyDown } = useTarjetaClickeable(onVistaRapida, producto);

  const toggleFavorito = (e) => {
    e.stopPropagation();
    onFavoritoChange?.(producto.id, esFavorito ? "quitado" : "agregado");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => onPrecargarDetalle?.(producto)}
      className="group relative min-h-0 flex flex-col rounded-[2px] overflow-hidden transition-all hover:-translate-y-1 cursor-pointer outline-none focus-visible:ring-2"
      style={{
        background: "var(--noir-soft)",
        border: "1px solid var(--border-gold-20)",
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-gold-40)";
        e.currentTarget.style.boxShadow = "0 18px 38px rgba(0,0,0,0.35)";
        onPrecargarDetalle?.(producto);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-gold-20)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="relative aspect-[3/4] shrink-0">
        <ImagenProducto producto={producto} className="absolute inset-0" />
        <BotonFavorito esFavorito={esFavorito} onToggle={toggleFavorito} />
        {agotado && <EtiquetaAgotado />}
      </div>

      <InfoProducto producto={producto} className="min-h-[82px] justify-start p-3.5 sm:p-4" />

      <div className="pointer-events-none absolute inset-0 ring-0 group-hover:ring-1 transition-all" style={{ boxShadow: "inset 0 0 0 1px var(--border-gold-40)" }} />
    </div>
  );
}

export default function TarjetaProductoTienda({ producto, vista, onVistaRapida, onFavoritoChange, favoritos, onPrecargarDetalle }) {
  if (vista === "lista") return (
    <TarjetaLista
      producto={producto}
      onVistaRapida={onVistaRapida}
      onFavoritoChange={onFavoritoChange}
      favoritos={favoritos}
      onPrecargarDetalle={onPrecargarDetalle}
    />
  );
  return (
    <TarjetaGrid
      producto={producto}
      onVistaRapida={onVistaRapida}
      onFavoritoChange={onFavoritoChange}
      favoritos={favoritos}
      onPrecargarDetalle={onPrecargarDetalle}
    />
  );
}
