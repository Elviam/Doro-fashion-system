import { useState, useEffect } from "react";
import { api } from "../services/api";

const formatMoney = (n) => `$${Number(n).toLocaleString("es-MX")}`;

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

// Solo mes y año, para "Miembro desde" — se ve más limpio que la fecha completa
const formatMesAnio = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    month: "long", year: "numeric",
  });
};

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: "border-gold text-gold",
    pagado: "bg-verde/12 border-verde/35 text-verde-dark dark:text-verde",
    enviado: "bg-azul/12 border-azul/35 text-azul-dark dark:text-azul",
    entregado: "bg-verde/12 border-verde/35 text-verde-dark dark:text-verde",
    cancelado: "bg-rojo/12 border-rojo/35 text-rojo-dark dark:text-rojo",
  };

  const key = estado?.toLowerCase();
  const clases = estilos[key] || estilos.pendiente;
  const label = estado ? estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase() : "—";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs lg:text-sm font-tag font-semibold whitespace-nowrap border ${clases}`}>
      {label}
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

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4">
      
      <div className="rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] shadow-lg p-4 sm:p-6 w-full bg-[var(--snow)] dark:bg-[var(--noir-soft)] backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] bg-gradient-to-br from-[var(--gold)] via-[var(--gold-dark)] to-[var(--gold-light)] flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--noir)]">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-[var(--noir)] dark:text-[var(--snow)] mb-2 break-words">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <div className="space-y-1.5 font-body text-sm lg:text-base break-all sm:break-normal">
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Email:</span> <span className="inline-block break-all">{usuario?.email}</span>
              </p>
              {usuario?.rfc && (
                <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">RFC:</span> {usuario?.rfc}
                </p>
              )}
              {usuario?.telefono && (
                <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Teléfono:</span> {usuario?.telefono}
                </p>
              )}
              {usuario?.direccion && (
                <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] break-words">
                  <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Dirección:</span> {usuario?.direccion}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] shadow-lg p-4 sm:p-6 bg-[var(--snow)] backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-tag text-[var(--noir-soft)] text-xs lg:text-sm mb-1 truncate">Total Compras</p>
            <p className="font-display text-xl lg:text-2xl font-bold text-[var(--noir)]">{compras.length}</p>
          </div>
          <i className="bi bi-bag-check text-2xl sm:text-4xl text-[var(--gold)]/100 shrink-0" />
        </div>

        {/* Antes: "Monto Total" gastado — se reemplazó por "Miembro desde".
            NOTA: ajusta `usuario?.createdAt` al campo real de tu modelo de usuario si es distinto. */}
        <div className="rounded-[2px] border border-[var(--border-gold-40)] shadow-lg p-4 sm:p-6 bg-[var(--snow)] backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-tag text-[var(--noir-soft)] text-xs lg:text-sm mb-1 truncate">Miembro desde</p>
            <p className="font-display text-lg lg:text-xl font-bold text-[var(--noir-soft)] capitalize truncate">
              {formatMesAnio(usuario?.createdAt)}
            </p>
          </div>
          <i className="bi bi-award text-2xl sm:text-4xl text-[var(--gold)]/100 shrink-0" />
        </div>
      </div>

      <div className="rounded-[2px] border border-[var(--border-gold-40)] shadow-lg p-4 sm:p-6 w-full bg-[var(--snow)] backdrop-blur-sm">
        <h3 className="font-display text-base lg:text-lg font-bold text-[var(--noir)] mb-4 flex items-center gap-2">
          <i className="bi bi-bag-check-fill text-[var(--gold)]" />
          Mis Compras
        </h3>

        {cargando ? (
          <div className="text-center py-8 font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm lg:text-base">
            <p>Cargando compras...</p>
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-8 font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm lg:text-base">
            <p>Aún no tienes compras</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {compras.map((compra) => (
              <div
                key={compra.id}
                onClick={() => setCompraSeleccionada(compra)}
                className="p-3 sm:p-4 rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-[var(--gold-08)] hover:bg-[var(--gold-08)]/70 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-tag text-xs lg:text-sm font-bold text-[var(--noir-soft)] truncate">Pedido #{compra.numeroPedido || compra.id}</span>
                      <EstadoBadge estado={compra.estado} />
                    </div>
                    <p className="font-body text-[11px] lg:text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] mb-2">
                      {formatFecha(compra.createdAt)}
                    </p>
                    
                    <div className="font-body text-xs lg:text-sm text-[var(--noir-soft)] space-y-1 bg-[var(--border-gold-55)] p-2 rounded-[2px] border border-[var(--border-gold-25)]">
                      {compra.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="truncate">
                          • {item.nombre || item.producto?.nombre} <span className="text-[var(--noir-soft)] font-bold">x{item.cantidad}</span>
                        </div>
                      ))}
                      {compra.items?.length > 2 && (
                        <div className="text-[11px] lg:text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] italic pl-2">
                          +{compra.items.length - 2} más...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end border-t border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] pt-2 sm:pt-0">
                    <p className="font-display text-base sm:text-lg font-bold text-[var(--noir)] dark:text-[var(--snow)]">{formatMoney(compra.total)}</p>
                    {compra.cantidad && (
                      <p className="font-body text-[11px] sm:text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{compra.cantidad} art.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {compraSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--noir)]/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[var(--snow)] rounded-[2px] border border-[var(--border-gold-40)] shadow-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[80vh] overflow-hidden flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border-gold-25)]">
                <h3 className="font-display text-lg lg:text-xl font-bold text-[var(--noir)] flex items-center gap-2">
                  <i className="bi bi-receipt text-[var(--gold)]" />
                  Detalles del Pedido
                </h3>
                <button
                  onClick={() => setCompraSeleccionada(null)}
                  className="text-[var(--noir-soft)] hover:text-[var(--gold-dark)] p-1 transition"
                >
                  <i className="bi bi-x-lg text-lg" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 custom-scrollbar">
              <div className="space-y-3 font-body text-xs sm:text-sm lg:text-base">
                <div className="grid grid-cols-2 gap-2 bg-[var(--gold-08)] p-2 rounded-[2px] border border-[var(--border-gold-25)]">
                  <div>
                    <p className="text-[11px] lg:text-xs text-[var(--noir-soft)]">ID Pedido</p>
                    <p className="font-mono text-xs lg:text-sm text-[var(--noir)] truncate">{compraSeleccionada.id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] lg:text-xs text-[var(--noir-soft)]">Fecha</p>
                    <p className="text-[var(--noir)] font-semibold">{formatFecha(compraSeleccionada.createdAt)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-[var(--noir-soft)]">Estado Actual:</span>
                  <EstadoBadge estado={compraSeleccionada.estado} />
                </div>

                {compraSeleccionada.metodoPago && (
                  <div className="flex justify-between items-center py-1 border-t border-[var(--border-gold-25)]">
                    <span className="text-[var(--noir-soft)]">Método de Pago:</span>
                    <span className="text-[var(--noir)] capitalize">{compraSeleccionada.metodoPago}</span>
                  </div>
                )}

                <div className="pt-2">
                  <p className="font-tag text-[11px] lg:text-xs text-[var(--noir-soft)] mb-2 font-bold uppercase tracking-wider">
                    Artículos ({compraSeleccionada.items?.length || 0})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {compraSeleccionada.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[var(--gold-08)] rounded-[2px] border border-[var(--border-gold-25)] gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm lg:text-base font-semibold text-[var(--noir)] truncate">{item.nombre || item.producto?.nombre}</p>
                          <p className="text-[11px] lg:text-xs text-[var(--noir-soft)] space-x-2">
                            {item.talla && <span>Talla: {item.talla}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Cant: {item.cantidad}</span>
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-base font-bold text-[var(--noir)] shrink-0">
                          {formatMoney((item.precioUnitario || item.precio || 0) * item.cantidad)}
                        </p>
                        <div className="w-12 h-16 shrink-0 overflow-hidden rounded-[2px] bg-[var(--ivory)] border border-[var(--border-gold-25)] flex items-center justify-center">
                          {item.imagen || item.producto?.imagen ? (
                            <img
                              src={item.imagen || item.producto.imagen}
                              alt={item.nombre || item.producto?.nombre || "Producto"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="bi bi-image text-lg text-[var(--gold)]/50" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* desglose de Totales */}
                <div className="bg-[var(--gold-08)] rounded-[2px] p-3 sm:p-4 space-y-1.5 mt-3">
                  {compraSeleccionada.subtotal > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                      <span className="text-[var(--noir-soft)]">Subtotal:</span>
                      <span className="text-[var(--noir)]">{formatMoney(compraSeleccionada.subtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm lg:text-base">
                    <span className="text-[var(--noir-soft)]">Envío:</span>
                    <span className="text-[var(--noir)]">
                      {Number(compraSeleccionada.envio) > 0 ? formatMoney(compraSeleccionada.envio) : "Gratis"}
                    </span>
                  </div>
                  <div className="flex justify-between text-base lg:text-lg font-bold pt-2 border-t border-[var(--border-gold-40)]">
                    <span className="text-[var(--noir)]">Total:</span>
                    <span className="text-[var(--noir)]">{formatMoney(compraSeleccionada.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-[var(--border-gold-25)]">
            <button
              onClick={() => setCompraSeleccionada(null)}
              className="font-tag w-full py-2.5 rounded-[2px] bg-[var(--gold)] text-[var(--noir)] font-bold hover:bg-[var(--gold-light)] transition shadow-md"
            >
              Cerrar Detalle
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
