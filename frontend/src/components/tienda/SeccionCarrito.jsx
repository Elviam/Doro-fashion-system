import { useNavigate } from 'react-router-dom';

// Palette for placeholder gradients when product has no image
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

const ENVIO_GRATIS_DESDE = 799;
const COSTO_ENVIO        = 99;

function ImagenMiniatura({ producto }) {
  if (producto.imagenes?.[0]) {
    return (
      <img
        src={producto.imagenes[0]}
        alt={producto.nombre}
        className="w-full h-full object-cover"
      />
    );
  }
  const [c0, c1] = paletasPorCategoria[producto.categoria] || ["#A68DC8", "#E7D6FF"];
  return (
    <div
      className="w-full h-full"
      style={{ background: `linear-gradient(135deg, ${c0}, ${c1})` }}
    />
  );
}

export default function SeccionCarrito({
  
  abierto,
  onCerrar,
  carrito,
  onCambiarCantidad,
  onEliminar,
  onCheckout,
  onVerDetalle,
}) {
  const subtotal        = carrito.reduce((acc, i) => acc + i.producto.precioVenta * i.cantidad, 0);
  const envio           = subtotal === 0 ? 0 : subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
  const total           = subtotal + envio;
  const totalArticulos  = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const faltaParaEnvio  = ENVIO_GRATIS_DESDE - subtotal;
  const navigate = useNavigate();
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
          background:  "var(--noir)",
          borderLeft:  "1px solid var(--border-gold-20)",
          boxShadow:   "0 0 48px rgba(13,13,13,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-gold-20)" }}
        >
          <div className="flex items-center gap-3">
            <i className="bi bi-bag text-2xl" style={{ color: "var(--gold)" }} />
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
                Tu bolsa
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
                {totalArticulos} {totalArticulos === 1 ? "artículo" : "artículos"}
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

        {/* Shipping progress bar */}
        <div
          className="px-6 py-3"
          style={{ borderBottom: "1px solid var(--border-gold-20)", background: "var(--noir-soft)" }}
        >
          {subtotal >= ENVIO_GRATIS_DESDE ? (
            <p
              className="flex items-center gap-2 text-verde"
              style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600 }}
            >
              <i className="bi bi-check-circle-fill" />
              Tu pedido tiene envío gratis
            </p>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--ash)", margin: 0 }}>
                Te faltan{" "}
                <b style={{ color: "var(--snow)" }}>
                  ${Number(faltaParaEnvio).toLocaleString("es-MX")}
                </b>{" "}
                para envío gratis
              </p>
              <div
                className="mt-2 h-[2px] overflow-hidden"
                style={{ background: "var(--border-gold-20)" }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width:      `${Math.min(100, (subtotal / ENVIO_GRATIS_DESDE) * 100)}%`,
                    background: "var(--gold)",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div
                className="w-20 h-20 rounded-[2px] flex items-center justify-center mb-4"
                style={{ background: "var(--gold-08)", border: "1px solid var(--border-gold-20)" }}
              >
                <i className="bi bi-bag text-3xl" style={{ color: "var(--gold)" }} />
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
                Tu bolsa está vacía
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ash)", marginTop: "6px" }}>
                Agrega productos y vuelve aquí
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
            carrito.map((item) => (
              <div
                key={`${item.producto.id}-${item.talla}`}
                onClick={() => onVerDetalle(item.producto)}
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
                  <ImagenMiniatura producto={item.producto} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <p
                    className="leading-tight line-clamp-2"
                    style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--snow)" }}
                  >
                    {item.producto.nombre}
                  </p>

                  {/* Size badge */}
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      style={{
                        fontFamily:    "var(--font-tag)",
                        fontSize:      "9px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color:         "var(--ash)",
                      }}
                    >
                      Talla:
                    </span>
                    <span
                      className="min-w-[34px] h-7 px-2 flex items-center justify-center rounded-[2px]"
                      style={{
                        fontFamily: "var(--font-tag)",
                        fontSize:   "11px",
                        fontWeight: 600,
                        background: "var(--gold)",
                        color:      "var(--noir)",
                        border:     "1px solid var(--gold)",
                      }}
                    >
                      {item.talla}
                    </span>
                  </div>

                  <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                    {/* Quantity selector */}
                    <div
                      className="flex items-center rounded-[2px]"
                      style={{ border: "1px solid var(--border-gold-20)", background: "var(--noir)" }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); onCambiarCantidad(item.producto.id, item.talla, item.cantidad - 1); }}
                        className="w-7 h-7 flex items-center justify-center rounded-l-[2px] transition"
                        style={{ color: "var(--ash)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-08)", e.currentTarget.style.color = "var(--snow)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent",   e.currentTarget.style.color = "var(--ash)")}
                      >
                        <i className="bi bi-dash" />
                      </button>
                      <span
                        className="w-6 text-center tabular-nums"
                        style={{ fontFamily: "var(--font-tag)", fontSize: "12px", fontWeight: 600, color: "var(--snow)" }}
                      >
                        {item.cantidad}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCambiarCantidad(item.producto.id, item.talla, item.cantidad + 1); }}
                        disabled={item.cantidad >= (item.producto.inventario?.find((i) => i.talla === item.talla)?.stock ?? 0)}
                        className="w-7 h-7 flex items-center justify-center rounded-r-[2px] transition disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: "var(--ash)" }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "var(--gold-08)"; e.currentTarget.style.color = "var(--snow)"; }}}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ash)"; }}
                      >
                        <i className="bi bi-plus" />
                      </button>
                    </div>

                    {/* Price + remove */}
                    <div className="flex flex-col items-end gap-1.5">
                      <p
                        className="tabular-nums"
                        style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 300, color: "var(--gold-light)", margin: 0 }}
                      >
                        ${Number(item.producto.precioVenta * item.cantidad).toLocaleString("es-MX")}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEliminar(item.producto.id, item.talla); }}
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
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary + checkout */}
        {carrito.length > 0 && (
          <div
            className="px-6 py-4"
            style={{ borderTop: "1px solid var(--border-gold-20)", background: "var(--noir-soft)" }}
          >
            <div className="flex justify-between mb-1.5">
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ash)" }}>Subtotal</span>
              <b className="tabular-nums" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--snow)" }}>
                ${Number(subtotal).toLocaleString("es-MX")}
              </b>
            </div>
            <div className="flex justify-between mb-1.5">
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--ash)" }}>Envío</span>
              <b className={`tabular-nums ${envio === 0 ? "text-verde" : ""}`}
                style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: envio === 0 ? undefined : "var(--snow)" }}>
                {envio === 0 ? "GRATIS" : `$${Number(envio).toLocaleString("es-MX")}`}
              </b>
            </div>
            <div
              className="flex justify-between items-baseline pt-2"
              style={{ borderTop: "1px solid var(--border-gold-20)" }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, color: "var(--snow)" }}>
                Total
              </span>
              <b
                className="tabular-nums"
                style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 300, fontStyle: "italic", color: "var(--gold-light)" }}
              >
                ${Number(total).toLocaleString("es-MX")}
              </b>
            </div>

            <button
               onClick={onCheckout}
              className="w-full mt-4 rounded-[2px] flex items-center justify-center gap-2 transition"
              style={{
                fontFamily:    "var(--font-tag)",
                fontSize:      "11px",
                fontWeight:    600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding:       "14px",
                background:    "var(--gold)",
                color:         "var(--noir)",
                border:        "none",
                cursor:        "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
            >
               <i className="bi bi-lock-fill" />
              Ir a pagar · ${Number(total).toLocaleString("es-MX")}
            </button>

            {/* Payment methods */}
            <div className="flex justify-center gap-4 mt-3">
              {[
                { icono: "bi-credit-card-2-front", label: "Tarjeta" },
                { icono: "bi-paypal",              label: "PayPal"  },
                { icono: "bi-apple",               label: "Apple Pay" },
                { icono: "bi-shop",                label: "OXXO"    },
              ].map(({ icono, label }) => (
                <i
                  key={label}
                  className={`bi ${icono} text-xl`}
                  title={label}
                  style={{ color: "var(--ash)" }}
                />
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
