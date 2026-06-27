import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { generarTicket } from "../../utils/generarTicket";

const fmt = (n) => `$${Number(n).toLocaleString("es-MX")}`;

const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

const colorEstado = {
  pendiente: "bg-amarillo/20 text-amarillo border-amarillo/30",
  pagado:    "bg-verde/20 text-verde border-verde/30",
  enviado:   "bg-azul/20 text-azul border-azul/30",
  entregado: "bg-verde/20 text-verde border-verde/30",
  cancelado: "bg-rojo/20 text-rojo border-rojo/30",
};

function DetalleVenta({ venta, onCerrar }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCerrar}>
      <div
        className="w-full max-w-md bg-oscuro border border-lila/20 rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-lila/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[3px] text-lila-mid uppercase font-bold">Detalle</p>
            <p className="text-lg font-extrabold text-blanco">{venta.numeroPedido || `#${venta.id.slice(0,8).toUpperCase()}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generarTicket(venta)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-lila/30 text-lila bg-lila/10 hover:bg-lila/20 transition"
            >
              <i className="bi bi-download text-sm" /> Ticket
            </button>
            <button onClick={onCerrar} className="w-9 h-9 rounded-full bg-lila/10 text-lila hover:bg-lila/20 flex items-center justify-center transition">
              <i className="bi bi-x-lg text-sm" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Estado y fecha */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colorEstado[venta.estado] ?? colorEstado.pendiente}`}>
              {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
            </span>
            <span className="text-xs text-lila-soft">{fmtFecha(venta.createdAt)}</span>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            {(venta.items ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-bg-card border border-lila/10 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-lila/15 bg-lila/10">
                  {item.imagen
                    ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lila"><i className="bi bi-box" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blanco truncate">{item.nombre}</p>
                  <p className="text-xs text-lila-soft">Talla {item.talla} · x{item.cantidad}</p>
                </div>
                <span className="text-sm font-bold text-lila tabular-nums shrink-0">
                  {fmt(item.precioUnitario * item.cantidad)}
                </span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="border-t border-lila/10 pt-3 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-lila-soft">
              <span>Subtotal</span>
              <b className="text-blanco">{fmt(venta.subtotal)}</b>
            </div>
            <div className="flex justify-between text-xs text-lila-soft">
              <span>Envío</span>
              <b className={venta.envio === 0 ? "text-verde" : "text-blanco"}>
                {venta.envio === 0 ? "GRATIS" : fmt(venta.envio)}
              </b>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-lila/15">
              <span className="text-sm font-semibold text-blanco">Total</span>
              <b className="text-xl font-extrabold text-lila tabular-nums">{fmt(venta.total)}</b>
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-bg-card border border-lila/10 rounded-xl px-4 py-3">
            <p className="text-[10px] text-lila-soft uppercase tracking-widest mb-1">Dirección de envío</p>
            <p className="text-sm text-blanco">{venta.cliente?.calle}</p>
            <p className="text-xs text-lila-soft">{venta.cliente?.ciudad} · C.P. {venta.cliente?.cp}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistorialPedidos({ abierto, onCerrar, email, clienteId }) {
  const [pedidos, setPedidos]             = useState([]);
  const [cargando, setCargando]           = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    const params = new URLSearchParams({ limit: 50 });
    if (clienteId) params.set("clienteId", clienteId);
    if (email)     params.set("email", email);
    api.get(`/ventas?${params}`)
      .then((data) => setPedidos(data.items ?? []))
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, [abierto, email, clienteId]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        className={`fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          abierto ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside className={`fixed top-0 right-0 bottom-0 z-[75] w-full max-w-[420px] bg-oscuro border-l border-lila/20 shadow-2xl flex flex-col transition-transform duration-300 ${
        abierto ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-lila/10">
          <div className="flex items-center gap-3">
            <i className="bi bi-clock-history text-2xl text-lila" />
            <div>
              <p className="text-[10px] tracking-[3px] text-lila-mid uppercase font-bold">Mis pedidos</p>
              <p className="text-lg font-bold text-blanco">{pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="w-9 h-9 rounded-full bg-lila/10 text-lila flex items-center justify-center hover:bg-lila/20 transition">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {cargando ? (
            <div className="flex flex-col items-center justify-center h-full">
              <i className="bi bi-arrow-repeat text-3xl text-lila animate-spin" />
              <p className="text-sm text-lila-soft mt-3">Cargando pedidos…</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 rounded-full bg-lila/10 flex items-center justify-center mb-4">
                <i className="bi bi-bag text-3xl text-lila" />
              </div>
              <p className="text-base font-bold text-blanco">Sin pedidos aún</p>
              <p className="text-sm text-lila-soft mt-1">Tus compras aparecerán aquí</p>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <button
                key={pedido.id}
                onClick={() => setPedidoDetalle(pedido)}
                className="w-full text-left flex gap-3 bg-bg-card border border-lila/10 rounded-xl p-4 hover:border-lila/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-blanco font-mono">
                      {pedido.numeroPedido || `#${pedido.id.slice(0,8).toUpperCase()}`}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorEstado[pedido.estado] ?? colorEstado.pendiente}`}>
                      {pedido.estado}
                    </span>
                  </div>
                  <p className="text-xs text-lila-soft">{fmtFecha(pedido.createdAt)}</p>
                  <p className="text-xs text-lila-soft mt-0.5">
                    {pedido.items?.reduce((a, i) => a + i.cantidad, 0)} artículos
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold text-lila tabular-nums">{fmt(pedido.total)}</p>
                  <i className="bi bi-chevron-right text-lila/40 text-xs mt-1 block" />
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {pedidoDetalle && (
        <DetalleVenta venta={pedidoDetalle} onCerrar={() => setPedidoDetalle(null)} />
      )}
    </>
  );
}
