import { useState } from 'react';

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

// Botón de favorito reutilizable — separado para no repetir el stopPropagation
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

// Maneja click y teclado (Enter/Espacio) para que la tarjeta sea accesible como botón
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

function TarjetaLista({ producto, onVistaRapida, onFavoritoChange, favoritos }) {
  const todasLasTallas = producto.inventario ?? [];
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
      className="flex gap-4 rounded-[2px] overflow-hidden transition-all cursor-pointer outline-none focus-visible:ring-2"
      style={{ background: "var(--noir-soft)", border: "1px solid var(--border-gold-20)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-40)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-20)")}
    >
      <div className="w-32 sm:w-44 shrink-0 relative">
        <ImagenProducto producto={producto} />
        <BotonFavorito esFavorito={esFavorito} onToggle={toggleFavorito} />
        {agotado && <EtiquetaAgotado />}
      </div>
      <div className="flex-1 py-4 pr-4 flex flex-col gap-1 min-w-0">
        <p
          className="text-[11px] uppercase tracking-widest font-bold truncate"
          style={{ fontFamily: "var(--font-tag)", color: "var(--gold)" }}
        >
          {producto.categoria} · {producto.departamento}
        </p>
        <h3
          className="text-sm sm:text-base font-semibold leading-tight"
          style={{ fontFamily: "var(--font-body)", color: "var(--snow)" }}
        >
          {producto.nombre}
        </h3>
        <p
          className="text-lg sm:text-xl font-extrabold tabular-nums"
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
        <span
          className="mt-auto pt-3 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
          style={{ fontFamily: "var(--font-tag)", color: "var(--gold)" }}
        >
          <i className="bi bi-eye" /> Ver detalle
        </span>
      </div>
    </div>
  );
}

function TarjetaGrid({ producto, onVistaRapida, onFavoritoChange, favoritos }) {
  const todasLasTallas = producto.inventario ?? [];
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
      className="group relative rounded-[2px] overflow-hidden transition-all hover:-translate-y-1 cursor-pointer outline-none focus-visible:ring-2"
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
        <BotonFavorito esFavorito={esFavorito} onToggle={toggleFavorito} />
        {agotado && <EtiquetaAgotado />}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-3.5">
        <p
          className="text-[10px] uppercase tracking-widest font-bold mb-1 truncate"
          style={{ fontFamily: "var(--font-tag)", color: "var(--gold)" }}
        >
          {producto.categoria}
        </p>
        <h3
          className="text-[12px] sm:text-[13px] font-semibold line-clamp-2 min-h-[2.5em] leading-tight"
          style={{ fontFamily: "var(--font-body)", color: "var(--snow)" }}
        >
          {producto.nombre}
        </h3>
        <p
          className="text-sm sm:text-base font-extrabold tabular-nums mt-1"
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

      {/* Indicador sutil de "ver detalle", no bloquea nada */}
      <div className="pointer-events-none absolute inset-0 ring-0 group-hover:ring-1 transition-all" style={{ boxShadow: "inset 0 0 0 1px var(--border-gold-40)" }} />
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