import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import Modal from "./Modal";
import { generarTicket } from "../utils/generarTicket";

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const formatMoney = (n) => `$${Number(n).toLocaleString("es-MX")}`;

export default function ModalDetalleVenta({ venta, puedeActualizar, onClose, onCambiarEstado, onCancelar, isOpen = true }) {
  if (!venta) return null;

  // Header
  const tituloPersonalizado = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`
        px-3 py-1 rounded-[2px] text-xs lg:text-sm font-bold border font-tag transition-colors
        bg-[var(--gold-08)] text-[var(--gold-dark)] border-[var(--border-gold-40)]
        dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)]
      `}>
        {venta.numeroPedido || `#${venta.id.slice(0, 8).toUpperCase()}`}
      </span>
      <Etiquetas contenido={venta.estado} />
      <span className={`
        font-tag text-xs lg:text-sm capitalize border px-3 py-1 rounded-[2px] transition-colors
        text-[var(--noir-soft)] border-[var(--border-gold-40)]
        dark:text-[var(--ash)] dark:border-[var(--border-gold-20)]
      `}>
        {venta.metodoPago}
      </span>
    </div>
  );

  // Footer
  const footerContenido = (
    <div className="flex justify-between items-center gap-3 w-full">
      <button
        onClick={() => generarTicket(venta)}
        className={`
          rounded-[2px] px-4 py-2 text-sm lg:text-base font-tag font-bold transition-colors cursor-pointer border
          text-[var(--gold-dark)] border-[var(--border-gold-40)] bg-[var(--gold-08)] hover:bg-[var(--gold)] hover:text-[var(--snow)]
          dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:bg-[var(--gold-08)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]
        `}
      >
        <i className="bi bi-download mr-1" />Descargar ticket
      </button>

    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titulo={tituloPersonalizado}
      ancho="max-w-2xl"
      footer={footerContenido}
    >
      <div className="font-body pt-2 flex flex-col gap-6">

        {/* Cliente */}
        <div>
          <p className="font-tag text-[11px] lg:text-xs tracking-[2px] uppercase font-bold mb-3 transition-colors text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
            Cliente
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Nombre", value: venta.cliente?.nombre },
              { label: "Email",  value: venta.cliente?.email },
              { label: "Ciudad", value: venta.cliente?.ciudad },
              { label: "Calle",  value: venta.cliente?.calle },
              { label: "C.P.",   value: venta.cliente?.cp },
              { label: "Fecha",  value: formatFecha(venta.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className={`
                rounded-[2px] border p-3 transition-colors shadow-sm
                bg-[var(--snow)] border-[var(--border-gold-40)]
                dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
              `}>
                <p className="font-tag text-[10px] lg:text-xs uppercase tracking-widest mb-1 transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  {label}
                </p>
                <p className="font-body text-sm lg:text-base font-semibold truncate transition-colors text-[var(--noir)] dark:text-[var(--snow)]">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="font-tag text-[11px] lg:text-xs tracking-[2px] uppercase font-bold mb-3 transition-colors text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
            Artículos ({venta.items?.length ?? 0})
          </p>
          <div className="flex flex-col gap-2">
            {(venta.items ?? []).map((item, i) => (
              <div key={i} className={`
                flex flex-wrap sm:flex-nowrap items-center gap-4 rounded-[2px] border px-4 py-3 transition-colors shadow-sm
                bg-[var(--snow)] border-[var(--border-gold-40)]
                dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
              `}>
                
                <div className={`
                  w-9 h-9 rounded-[2px] shrink-0 overflow-hidden border transition-colors
                  bg-[var(--gold-08)] border-[var(--border-gold-40)]
                  dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]
                `}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      <i className="bi bi-box" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm lg:text-base font-semibold truncate transition-colors text-[var(--noir)] dark:text-[var(--snow)]">
                    {item.nombre}
                  </p>
                  <p className="font-body text-xs lg:text-sm transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    Talla {item.talla}
                  </p>
                </div>
                
                <div className="flex gap-4 sm:gap-6 w-full sm:w-auto justify-between mt-2 sm:mt-0">
                  <div className="text-center min-w-12">
                    <p className="font-tag text-[10px] lg:text-xs transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">Cant.</p>
                    <p className="font-body text-sm lg:text-base font-bold transition-colors text-[var(--noir)] dark:text-[var(--snow)]">{item.cantidad}</p>
                  </div>
                  <div className="text-center min-w-16">
                    <p className="font-tag text-[10px] lg:text-xs transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">P. unit.</p>
                    <p className="font-body text-sm lg:text-base font-bold tabular-nums transition-colors text-[var(--noir)] dark:text-[var(--snow)]">
                      {formatMoney(item.precioUnitario)}
                    </p>
                  </div>
                  <div className="text-center min-w-18">
                    <p className="font-tag text-[10px] lg:text-xs transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">Subtotal</p>
                    <p className="font-body text-sm lg:text-base font-bold tabular-nums transition-colors text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      {formatMoney(item.cantidad * item.precioUnitario)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className={`
          border rounded-[2px] p-4 flex flex-col gap-1.5 transition-colors shadow-sm
          bg-[var(--snow)] border-[var(--border-gold-40)]
          dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
        `}>
          <div className="flex justify-between font-body text-sm lg:text-base transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
            <span>Subtotal</span>
            <b className="tabular-nums transition-colors text-[var(--noir)] dark:text-[var(--snow)]">{formatMoney(venta.subtotal)}</b>
          </div>
          <div className="flex justify-between font-body text-sm lg:text-base transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
            <span>Envío</span>
            <b className={`
              tabular-nums transition-colors
              ${venta.envio === 0 ? "text-green-700 dark:text-verde font-extrabold" : "text-[var(--noir)] dark:text-[var(--snow)]"}
            `}>
              {venta.envio === 0 ? "GRATIS" : formatMoney(venta.envio)}
            </b>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t transition-colors border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
            <span className="font-body text-base lg:text-lg font-semibold transition-colors text-[var(--noir)] dark:text-[var(--snow)]">Total</span>
            <b className="text-2xl lg:text-3xl font-extrabold text-green-700 dark:text-verde tabular-nums">{formatMoney(venta.total)}</b>
          </div>
        </div>

        {/* Acciones de estado */}
        {puedeActualizar && !["CANCELADO", "ENVIADO"].includes(venta.estado) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {venta.estado === "PENDIENTE" && (
              <Boton
                variante="claro"
                onClick={() => onCambiarEstado(venta.id, "PAGADO")}
                tipo="button"
              >
                <i className="bi bi-check-circle mr-1" /> Marcar como pagado
              </Boton>
            )}
            {venta.estado === "PAGADO" && (
              <Boton
                variante="claro"
                onClick={() => onCambiarEstado(venta.id, "ENVIADO")}
                tipo="button"
              >
                <i className="bi bi-truck mr-1" /> Marcar como enviado
              </Boton>
            )}
            <button
              onClick={() => onCancelar(venta)}
              className="font-tag rounded-[2px] px-4 py-2 text-sm lg:text-base font-bold transition-colors cursor-pointer border text-red-700 dark:text-rojo border-red-700/30 dark:border-rojo/30 bg-red-700/10 dark:bg-rojo/10 hover:bg-red-700 dark:hover:bg-rojo hover:text-[var(--snow)] hover:border-red-700 dark:hover:border-rojo"
            >
              <i className="bi bi-slash-circle mr-1" /> Cancelar venta
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}
