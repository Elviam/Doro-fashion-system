import { useState, useEffect } from "react";
import { api } from "../services/api";

const formatMoney = (n) => `$${Number(n).toLocaleString("es-MX")}`;

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: { bg: "rgba(247,203,87,0.12)", border: "rgba(247,203,87,0.35)", color: "#F7CB57" },
    pagado: { bg: "rgba(163,227,120,0.12)", border: "rgba(163,227,120,0.35)", color: "#A3E378" },
    enviado: { bg: "rgba(126,201,237,0.12)", border: "rgba(126,201,237,0.35)", color: "#7EC9ED" },
    entregado: { bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.35)", color: "#4ADE80" },
    cancelado: { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.35)", color: "#F43F5E" },
  };

  const cfg = estilos[estado] || estilos.pendiente;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize whitespace-nowrap"
      style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color }}
    >
      {estado}
    </span>
  );
}

export default function PerfilCliente({ usuario }) {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  useEffect(() => {
    const cargarCompras = async () => {
      try {
        const data = await api.get("/ventas/me");
        const todasLasVentas = data.items || data || [];
        
        const ventasArray = Array.isArray(todasLasVentas) ? todasLasVentas : [];
        const comprasDelCliente = ventasArray
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setCompras(comprasDelCliente);
      } catch (error) {
        console.error("Error cargando compras:", error);
        setCompras([]);
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.id || usuario?.email) {
      cargarCompras();
    }
  }, [usuario?.id, usuario?.email]);

  const totalCompras = compras.reduce((sum, c) => sum + (c.total || 0), 0);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4">
      
      <div className="rounded-2xl border border-lila/10 shadow-lg p-4 sm:p-6 w-full bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-lila via-lilaMid to-lilaSoft flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-3xl sm:text-4xl font-bold text-oscuro">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-lila mb-2 break-words">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <div className="space-y-1.5 text-sm break-all sm:break-normal">
              <p className="text-text-muted">
                <span className="font-semibold text-lila-soft">Email:</span> <span className="inline-block break-all">{usuario?.email}</span>
              </p>
              {usuario?.rfc && (
                <p className="text-text-muted">
                  <span className="font-semibold text-lila-soft">RFC:</span> {usuario?.rfc}
                </p>
              )}
              {usuario?.telefono && (
                <p className="text-text-muted">
                  <span className="font-semibold text-lila-soft">Teléfono:</span> {usuario?.telefono}
                </p>
              )}
              {usuario?.direccion && (
                <p className="text-text-muted break-words">
                  <span className="font-semibold text-lila-soft">Dirección:</span> {usuario?.direccion}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-lila/10 shadow-lg p-4 sm:p-6 bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-text-muted text-xs sm:text-sm mb-1 truncate">Total Compras</p>
            <p className="text-xl sm:text-2xl font-bold text-lila">{compras.length}</p>
          </div>
          <i className="bi bi-bag-check text-2xl sm:text-4xl text-lila/30 shrink-0" />
        </div>

        <div className="rounded-2xl border border-lila/10 shadow-lg p-4 sm:p-6 bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-text-muted text-xs sm:text-sm mb-1 truncate">Monto Total</p>
            <p className="text-xl sm:text-2xl font-bold text-lila truncate">{formatMoney(totalCompras)}</p>
          </div>
          <i className="bi bi-cash-coin text-2xl sm:text-4xl text-lila/30 shrink-0" />
        </div>
      </div>

      <div className="rounded-2xl border border-lila/10 shadow-lg p-4 sm:p-6 w-full bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-bold text-lila mb-4 flex items-center gap-2">
          <i className="bi bi-bag-check-fill text-lila-mid" />
          Mis Compras
        </h3>

        {cargando ? (
          <div className="text-center py-8 text-text-muted text-sm">
            <p>Cargando compras...</p>
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            <p>Aún no tienes compras</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {compras.map((compra) => (
              <div
                key={compra.id}
                onClick={() => setCompraSeleccionada(compra)}
                className="p-3 sm:p-4 rounded-lg border border-lila/10 bg-oscuro/40 hover:bg-oscuro/60 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs sm:text-sm font-bold text-lila truncate">Pedido #{compra.id}</span>
                      <EstadoBadge estado={compra.estado} />
                    </div>
                    <p className="text-[11px] text-text-muted mb-2">
                      {formatFecha(compra.createdAt)}
                    </p>
                    
                    <div className="text-xs text-lila/70 space-y-1 bg-oscuro/20 p-2 rounded border border-lila/5">
                      {compra.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="truncate">
                          • {item.nombre || item.producto?.nombre} <span className="text-lila-soft font-bold">x{item.cantidad}</span>
                        </div>
                      ))}
                      {compra.items?.length > 2 && (
                        <div className="text-[11px] text-lila/40 italic pl-2">
                          +{compra.items.length - 2} más...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end border-t border-lila/5 pt-2 sm:pt-0">
                    <p className="text-base sm:text-lg font-bold text-lila">{formatMoney(compra.total)}</p>
                    {compra.cantidad && (
                      <p className="text-[11px] sm:text-xs text-text-muted">{compra.cantidad} art.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {compraSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-oscuro/80 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
          <div className="bg-blanco dark:bg-[rgba(32,27,54,0.95)] rounded-t-2xl sm:rounded-2xl border border-lila/20 shadow-2xl p-4 sm:p-6 w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-lila/10">
                <h3 className="text-lg sm:text-xl font-bold text-lila flex items-center gap-2">
                  <i className="bi bi-receipt text-lila-mid" />
                  Detalles del Pedido
                </h3>
                <button
                  onClick={() => setCompraSeleccionada(null)}
                  className="text-text-muted hover:text-lila p-1 transition"
                >
                  <i className="bi bi-x-lg text-lg" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-2 bg-oscuro/20 p-2 rounded border border-lila/5">
                  <div>
                    <p className="text-[11px] text-text-muted">ID Pedido</p>
                    <p className="font-mono text-xs text-lila truncate">{compraSeleccionada.id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted">Fecha</p>
                    <p className="text-lila font-semibold">{formatFecha(compraSeleccionada.createdAt)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Estado Actual:</span>
                  <EstadoBadge estado={compraSeleccionada.estado} />
                </div>

                {compraSeleccionada.metodoPago && (
                  <div className="flex justify-between items-center py-1 border-t border-lila/5">
                    <span className="text-text-muted">Método de Pago:</span>
                    <span className="text-lila capitalize">{compraSeleccionada.metodoPago}</span>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-[11px] text-text-muted mb-2 font-bold uppercase tracking-wider">
                    Artículos ({compraSeleccionada.items?.length || 0})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {compraSeleccionada.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-oscuro/40 rounded border border-lila/5 gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-lila truncate">{item.nombre || item.producto?.nombre}</p>
                          <p className="text-[11px] text-text-muted space-x-2">
                            {item.talla && <span>Talla: {item.talla}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Cant: {item.cantidad}</span>
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-lila-soft shrink-0">
                          {formatMoney((item.precioUnitario || item.precio || 0) * item.cantidad)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* desglose de Totales */}
                <div className="bg-lila/10 rounded-lg p-3 sm:p-4 space-y-1.5 mt-3">
                  {compraSeleccionada.subtotal > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-text-muted">Subtotal:</span>
                      <span className="text-lila">{formatMoney(compraSeleccionada.subtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-text-muted">Envío:</span>
                    <span className="text-lila">
                      {Number(compraSeleccionada.envio) > 0 ? formatMoney(compraSeleccionada.envio) : "Gratis"}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-lila/20">
                    <span className="text-lila-soft">Total:</span>
                    <span className="text-lila">{formatMoney(compraSeleccionada.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCompraSeleccionada(null)}
              className="w-full py-2.5 rounded-lg bg-lila text-oscuro font-bold hover:bg-lila-soft transition mt-4 shadow-md"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}