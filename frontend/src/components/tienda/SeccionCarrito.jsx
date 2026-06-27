const ENVIO_GRATIS_DESDE = 999;
const COSTO_ENVIO = 99;

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
  const subtotal       = carrito.reduce((acc, item) => acc + item.producto.precioVenta * item.cantidad, 0);
  const envio          = subtotal === 0 ? 0 : subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
  const total          = subtotal + envio;
  const totalArticulos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const faltaParaEnvio = ENVIO_GRATIS_DESDE - subtotal;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel deslizante */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[60] w-full max-w-[440px] bg-oscuro border-l border-lila/20 shadow-2xl flex flex-col transition-transform duration-300 ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Encabezado */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-lila/10">
          <div className="flex items-center gap-3">
            <i className="bi bi-bag text-2xl text-lila" />
            <div>
              <p className="text-[10px] tracking-[3px] text-lila-mid uppercase font-bold">
                Tu bolsa
              </p>
              <p className="text-lg font-bold text-blanco">
                {totalArticulos} {totalArticulos === 1 ? "artículo" : "artículos"}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-9 h-9 rounded-full bg-lila/10 text-lila flex items-center justify-center hover:bg-lila/20 transition"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Barra de progreso envío gratis */}
        <div className="px-6 py-3 border-b border-lila/10 bg-bg-card/40">
          {subtotal >= ENVIO_GRATIS_DESDE ? (
            <p className="text-xs text-verde font-semibold flex items-center gap-2">
              <i className="bi bi-check-circle-fill" />
              ¡Felicidades! Tu pedido tiene envío gratis
            </p>
          ) : (
            <>
              <p className="text-xs text-lila-soft">
                Te faltan{" "}
                <b className="text-blanco">
                  ${Number(faltaParaEnvio).toLocaleString("es-MX")}
                </b>{" "}
                para envío gratis
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-lila/15 overflow-hidden">
                <div
                  className="h-full bg-lila rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subtotal / ENVIO_GRATIS_DESDE) * 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 rounded-full bg-lila/10 flex items-center justify-center mb-4">
                <i className="bi bi-bag text-3xl text-lila" />
              </div>
              <p className="text-base font-bold text-blanco">Tu bolsa está vacía</p>
              <p className="text-sm text-text-muted mt-1">
                Agrega productos y vuelve aquí
              </p>
              <button
                onClick={onCerrar}
                className="mt-5 bg-lila text-oscuro font-bold px-6 py-2.5 rounded-lg hover:bg-lila-soft transition"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            carrito.map((item) => (
              <div
                key={`${item.producto.id}-${item.talla}`}
                onClick={() => onVerDetalle(item.producto)}
                className="flex gap-3 bg-bg-card border border-lila/10 rounded-xl p-3 cursor-pointer hover:border-lila/30 transition"
              >
                {/* Miniatura */}
                <div className="w-20 h-24 shrink-0 rounded-lg overflow-hidden border border-lila/15">
                  <ImagenMiniatura producto={item.producto} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-sm font-semibold text-blanco leading-tight line-clamp-2">
                    {item.producto.nombre}
                  </p>

                  {/* Talla seleccionada */}
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[11px] text-lila-mid uppercase tracking-widest font-bold">Talla:</span>
                    <span className="min-w-[34px] h-7 px-2 rounded-md text-[11px] font-bold border bg-lila text-oscuro border-lila flex items-center justify-center">
                      {item.talla}
                    </span>
                  </div>

                  <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                    {/* Selector de cantidad */}
                    <div className="flex items-center bg-oscuro rounded-md border border-lila/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); onCambiarCantidad(item.producto.id, item.talla, item.cantidad - 1); }}
                        className="w-7 h-7 text-lila-soft hover:bg-lila/10 rounded-l-md transition"
                      >
                        <i className="bi bi-dash" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-blanco">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCambiarCantidad(item.producto.id, item.talla, item.cantidad + 1); }}
                        disabled={item.cantidad >= (item.producto.inventario?.find((i) => i.talla === item.talla)?.stock ?? 0)}
                        className="w-7 h-7 text-lila-soft hover:bg-lila/10 rounded-r-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-plus" />
                      </button>
                    </div>

                    {/* Precio y eliminar */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-base font-bold text-lila tabular-nums">
                        ${Number(item.producto.precioVenta * item.cantidad).toLocaleString("es-MX")}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEliminar(item.producto.id, item.talla); }}
                        className="border border-rojo/30 text-rojo/70 font-bold px-3 py-1.5 rounded-lg hover:bg-rojo/10 hover:text-rojo hover:border-rojo/50 transition flex items-center gap-1.5 text-[11px] shrink-0"
                      >
                        <i className="bi bi-trash text-xs" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen y botón de pago */}
        {carrito.length > 0 && (
          <div className="border-t border-lila/10 px-6 py-4 bg-oscuro-card">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-lila-soft">Subtotal</span>
              <b className="text-blanco tabular-nums">
                ${Number(subtotal).toLocaleString("es-MX")}
              </b>
            </div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-lila-soft">Envío</span>
              <b className={`tabular-nums ${envio === 0 ? "text-verde" : "text-blanco"}`}>
                {envio === 0 ? "GRATIS" : `$${Number(envio).toLocaleString("es-MX")}`}
              </b>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-lila/15">
              <span className="text-base font-semibold text-blanco">Total</span>
              <b className="text-2xl font-extrabold text-lila tabular-nums">
                ${Number(total).toLocaleString("es-MX")}
              </b>
            </div>

            <button
              onClick={onCheckout}
              className="w-full mt-3 bg-lila text-oscuro font-bold py-3.5 rounded-xl hover:bg-lila-soft transition flex items-center justify-center gap-2"
            >
              <i className="bi bi-lock-fill" />
              Ir a pagar · ${Number(total).toLocaleString("es-MX")}
            </button>

            {/* Métodos de pago */}
            <div className="flex justify-center gap-3 mt-3 text-text-muted">
              <i className="bi bi-credit-card-2-front text-xl" title="Tarjeta" />
              <i className="bi bi-paypal text-xl" title="PayPal" />
              <i className="bi bi-apple text-xl" title="Apple Pay" />
              <i className="bi bi-shop text-xl" title="OXXO" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}