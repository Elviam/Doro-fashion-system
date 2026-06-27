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
        px-3 py-1 rounded-full text-xs font-bold border font-mono transition-colors
        bg-morado/10 text-morado border-morado/20
        dark:bg-lila/10 dark:text-lila dark:border-lila/20
      `}>
        {venta.numeroPedido || `#${venta.id.slice(0, 8).toUpperCase()}`}
      </span>
      <Etiquetas contenido={venta.estado} />
      <span className={`
        text-xs capitalize border px-3 py-1 rounded-full transition-colors
        text-gris border-morado/20
        dark:text-lila-soft dark:border-lila/20
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
          rounded-lg px-4 py-2 text-sm font-bold transition-colors cursor-pointer border
          text-morado border-morado/30 bg-morado/10 hover:bg-morado hover:text-blanco
          dark:text-lila dark:border-lila/30 dark:bg-lila/10 dark:hover:bg-lila dark:hover:text-oscuro
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
      <div className="font-poppins pt-2 flex flex-col gap-6">

        {/* Cliente */}
        <div>
          <p className="text-[11px] tracking-[2px] uppercase font-bold mb-3 transition-colors text-morado dark:text-lila-soft">
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
                rounded-xl border p-3 transition-colors shadow-sm
                bg-blanco border-morado/20
                dark:bg-bg-card dark:border-lila/15 dark:shadow-none
              `}>
                <p className="text-[10px] uppercase tracking-widest mb-1 transition-colors text-gris dark:text-lila-soft">
                  {label}
                </p>
                <p className="text-sm font-semibold truncate transition-colors text-oscuro dark:text-blanco">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-[11px] tracking-[2px] uppercase font-bold mb-3 transition-colors text-morado dark:text-lila-soft">
            Artículos ({venta.items?.length ?? 0})
          </p>
          <div className="flex flex-col gap-2">
            {(venta.items ?? []).map((item, i) => (
              <div key={i} className={`
                flex flex-wrap sm:flex-nowrap items-center gap-4 rounded-xl border px-4 py-3 transition-colors shadow-sm
                bg-blanco border-morado/20
                dark:bg-bg-card dark:border-lila/10 dark:shadow-none
              `}>
                
                <div className={`
                  w-9 h-9 rounded-lg shrink-0 overflow-hidden border transition-colors
                  bg-lila-pastel border-morado/20
                  dark:bg-lila/10 dark:border-lila/20
                `}>
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-morado dark:text-lila">
                      <i className="bi bi-box" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate transition-colors text-oscuro dark:text-blanco">
                    {item.nombre}
                  </p>
                  <p className="text-xs transition-colors text-gris dark:text-text-muted">
                    Talla {item.talla}
                  </p>
                </div>
                
                <div className="flex gap-4 sm:gap-6 w-full sm:w-auto justify-between mt-2 sm:mt-0">
                  <div className="text-center min-w-12">
                    <p className="text-[10px] transition-colors text-gris dark:text-lila-soft">Cant.</p>
                    <p className="text-sm font-bold transition-colors text-oscuro dark:text-blanco">{item.cantidad}</p>
                  </div>
                  <div className="text-center min-w-16">
                    <p className="text-[10px] transition-colors text-gris dark:text-lila-soft">P. unit.</p>
                    <p className="text-sm font-bold tabular-nums transition-colors text-oscuro dark:text-blanco">
                      {formatMoney(item.precioUnitario)}
                    </p>
                  </div>
                  <div className="text-center min-w-18">
                    <p className="text-[10px] transition-colors text-gris dark:text-lila-soft">Subtotal</p>
                    <p className="text-sm font-bold tabular-nums transition-colors text-morado dark:text-lila">
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
          border rounded-xl p-4 flex flex-col gap-1.5 transition-colors shadow-sm
          bg-blanco border-morado/20
          dark:bg-bg-card dark:border-lila/10 dark:shadow-none
        `}>
          <div className="flex justify-between text-sm transition-colors text-gris dark:text-lila-soft">
            <span>Subtotal</span>
            <b className="tabular-nums transition-colors text-oscuro dark:text-blanco">{formatMoney(venta.subtotal)}</b>
          </div>
          <div className="flex justify-between text-sm transition-colors text-gris dark:text-lila-soft">
            <span>Envío</span>
            <b className={`
              tabular-nums transition-colors
              ${venta.envio === 0 ? "text-verde font-extrabold" : "text-oscuro dark:text-blanco"}
            `}>
              {venta.envio === 0 ? "GRATIS" : formatMoney(venta.envio)}
            </b>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t transition-colors border-morado/15 dark:border-lila/15">
            <span className="text-base font-semibold transition-colors text-oscuro dark:text-blanco">Total</span>
            <b className="text-2xl font-extrabold text-verde tabular-nums">{formatMoney(venta.total)}</b>
          </div>
        </div>

        {/* Acciones de estado */}
        {puedeActualizar && venta.estado !== "cancelado" && (
          <div className="flex flex-wrap gap-2 mb-2">
            {venta.estado === "pendiente" && (
              <Boton
                variante="claro"
                onClick={() => onCambiarEstado(venta.id, "pagado")}
                tipo="button"
              >
                <i className="bi bi-check-circle mr-1" /> Marcar como pagado
              </Boton>
            )}
            <button
              onClick={() => onCancelar(venta)}
              className="rounded-lg px-4 py-2 text-sm font-bold transition-colors cursor-pointer border text-rojo border-rojo/30 bg-rojo/10 hover:bg-rojo hover:text-blanco hover:border-rojo"
            >
              <i className="bi bi-slash-circle mr-1" /> Cancelar venta
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}