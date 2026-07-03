import { useState } from "react";

const paletasPorCategoria = {
  "Playeras":   ["#9F86C0", "#E7D6FF"],
  "Blusas":     ["#ED8ABA", "#E7D6FF"],
  "Camisas":    ["#7EC9ED", "#E7D6FF"],
  "Suéteres":   ["#C9B8E8", "#A68DC8"],
  "Sudaderas":  ["#A68DC8", "#2C2A48"],
  "Chamarras":  ["#F7CB57", "#FAA86B"],
  "Abrigos":    ["#7EC9ED", "#2C2A48"],
  "Vestidos":   ["#ED8ABA", "#C9B8E8"],
  "Faldas":     ["#FAA86B", "#ED8ABA"],
  "Shorts":     ["#A3E378", "#7EC9ED"],
  "Pantalones": ["#7EC9ED", "#2C2A48"],
  "Calzado":    ["#FAA86B", "#F7CB57"],
  "Accesorios": ["#C9B8E8", "#ED8ABA"],
};

function ImagenMiniatura({ producto }) {
  if (producto.imagen) {
    return (
      <img
        src={producto.imagen}
        alt={producto.nombre}
        className="w-full h-full object-cover"
      />
    );
  }
  const [c0, c1] = paletasPorCategoria[producto.categoria] || ["#A68DC8", "#E7D6FF"];
  return (
    <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${c0}, ${c1})` }} />
  );
}

function ItemWishlist({ producto, onQuitar, onVerDetalle }) {
  const agotado = producto.stock === 0;

  return (
    <div
      onClick={() => onVerDetalle(producto)}
      className="flex gap-3 p-3 cursor-pointer transition rounded-[2px]"
      style={{ background: "var(--noir-soft)", border: "1px solid var(--border-gold-20)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-40)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-gold-20)")}
    >
      {/* Thumbnail */}
      <div
        className="w-20 h-24 shrink-0 overflow-hidden rounded-[2px]"
        style={{ border: "1px solid var(--border-gold-20)" }}
      >
        <ImagenMiniatura producto={producto} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <p
          style={{
            fontFamily:    "var(--font-tag)",
            fontSize:      "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:         "var(--gold)",
            fontWeight:    600,
            margin:        0,
          }}
        >
          {producto.categoria}
        </p>
        <p
          className="leading-tight line-clamp-2 mt-1"
          style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--snow)" }}
        >
          {producto.nombre}
        </p>
        <p
          className="tabular-nums mt-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 300, color: "var(--gold-light)", margin: "4px 0 0" }}
        >
          ${Number(producto.precioVenta).toLocaleString("es-MX")}
        </p>

        {agotado && (
          <span
            className="mt-1 text-rojo"
            style={{ fontFamily: "var(--font-tag)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            Agotado
          </span>
        )}

        <div className="mt-auto pt-2 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onQuitar(producto.id); }}
            className="flex items-center gap-1.5 rounded-[2px] transition text-rojo"
            style={{
              fontFamily:    "var(--font-tag)",
              fontSize:      "10px",
              fontWeight:    600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding:       "5px 10px",
              border:        "1px solid rgba(244,63,94,0.3)",
              background:    "transparent",
              cursor:        "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,63,94,0.1)", e.currentTarget.style.borderColor = "rgba(244,63,94,0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent",         e.currentTarget.style.borderColor = "rgba(244,63,94,0.3)")}
          >
            <i className="bi bi-trash text-xs" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wishlist({
  abierto,
  onCerrar,
  favoritos,
  productos,
  onProductoClick,
  onQuitar,
}) {
  const productosEnWishlist = favoritos
    .map((id) => productos.find((p) => p.id === id))
    .filter(Boolean);

  const handleVerDetalle = (producto) => {
    onProductoClick(producto);
    onCerrar();
  };

  const handleVaciarLista = () => {
    productosEnWishlist.forEach((p) => onQuitar(p.id));
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(13,13,13,0.65)" }}
      />

      {/* Sliding panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[60] w-full max-w-[440px] flex flex-col transition-transform duration-300 ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--noir)",
          borderLeft: "1px solid var(--border-gold-20)",
          boxShadow:  "0 0 48px rgba(13,13,13,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-gold-20)" }}
        >
          <div className="flex items-center gap-3">
            <i className="bi bi-heart-fill text-2xl text-rojo" />
            <div>
              <p
                style={{
                  fontFamily:    "var(--font-tag)",
                  fontSize:      "9px",
                  letterSpacing: "0.3em",
                  color:         "var(--gold)",
                  textTransform: "uppercase",
                  fontWeight:    600,
                  margin:        0,
                }}
              >
                Mi wishlist
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize:   "18px",
                  fontWeight: 300,
                  fontStyle:  "italic",
                  color:      "var(--snow)",
                  margin:     0,
                }}
              >
                {productosEnWishlist.length}{" "}
                {productosEnWishlist.length === 1 ? "artículo" : "artículos"}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-9 h-9 rounded-[2px] flex items-center justify-center transition"
            style={{ background: "var(--gold-08)", color: "var(--gold)", border: "1px solid var(--border-gold-20)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-dark)", e.currentTarget.style.color = "var(--snow)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold-08)",   e.currentTarget.style.color = "var(--gold)")}
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {productosEnWishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div
                className="w-20 h-20 rounded-[2px] flex items-center justify-center mb-4"
                style={{ background: "var(--gold-08)", border: "1px solid var(--border-gold-20)" }}
              >
                <i className="bi bi-heart text-3xl" style={{ color: "var(--gold)" }} />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize:   "18px",
                  fontWeight: 300,
                  fontStyle:  "italic",
                  color:      "var(--snow)",
                  margin:     0,
                }}
              >
                Tu wishlist está vacía
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ash)", marginTop: "6px" }}>
                Toca el corazón en cualquier producto para guardarlo
              </p>
              <button
                onClick={onCerrar}
                className="mt-5 rounded-[2px] transition"
                style={{
                  fontFamily:    "var(--font-tag)",
                  fontSize:      "11px",
                  fontWeight:    600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding:       "10px 24px",
                  background:    "var(--gold)",
                  color:         "var(--noir)",
                  border:        "none",
                  cursor:        "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            productosEnWishlist.map((producto) => (
              <ItemWishlist
                key={producto.id}
                producto={producto}
                onQuitar={onQuitar}
                onVerDetalle={handleVerDetalle}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {productosEnWishlist.length > 0 && (
          <div
            className="px-6 py-4"
            style={{ borderTop: "1px solid var(--border-gold-20)", background: "var(--noir-soft)" }}
          >
            <button
              onClick={handleVaciarLista}
              className="w-full rounded-[2px] flex items-center justify-center gap-2 transition text-rojo"
              style={{
                fontFamily:    "var(--font-tag)",
                fontSize:      "11px",
                fontWeight:    600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding:       "11px",
                border:        "1px solid rgba(244,63,94,0.3)",
                background:    "transparent",
                cursor:        "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,63,94,0.1)", e.currentTarget.style.borderColor = "rgba(244,63,94,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent",         e.currentTarget.style.borderColor = "rgba(244,63,94,0.3)")}
            >
              <i className="bi bi-trash" />
              Vaciar lista
            </button>
          </div>
        )}
      </aside>
    </>
  );
}