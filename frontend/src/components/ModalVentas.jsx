import { useState } from "react";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import Modal from "./Modal";

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const formatMoney = (n) => `$${Number(n).toLocaleString("es-MX")}`;
const estadoLegible = (value = "PENDIENTE") => value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
const estadoVisual = (value = "PENDIENTE") => {
  const estado = value.toUpperCase();
  if (estado === "CANCELADO" || estado === "INCIDENCIA") return { icon: "bi-x-circle-fill", color: "text-rojo" };
  if (["PAGADO", "ENVIADO", "ENTREGADO", "PREPARADO", "COMPLETADO"].includes(estado)) return { icon: "bi-check-circle-fill", color: "text-verde-dark dark:text-verde" };
  if (estado === "EN_TRANSITO") return { icon: "bi-truck", color: "text-azul-dark dark:text-azul" };
  return { icon: "bi-hourglass-split", color: "text-amarillo-dark dark:text-amarillo" };
};

export default function ModalDetalleVenta({ venta, puedeActualizar, onClose, onCancelar, isOpen = true }) {
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
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
    <div className="flex w-full justify-end gap-3">
      {puedeActualizar && !["CANCELADO", "ENVIADO"].includes(venta.estado) && (
        <button onClick={() => onCancelar(venta)} className="font-tag rounded-[2px] px-4 py-2 text-sm lg:text-base font-bold transition-colors cursor-pointer border text-red-700 dark:text-rojo border-red-700/30 dark:border-rojo/30 bg-red-700/10 dark:bg-rojo/10 hover:bg-red-700 dark:hover:bg-rojo hover:text-[var(--snow)] hover:border-red-700 dark:hover:border-rojo"><i className="bi bi-slash-circle mr-1" />Cancelar venta</button>
      )}
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

        {/* Estados del pedido */}
        <div className="rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--gold-08)] p-4">
          <p className="font-tag text-[11px] uppercase tracking-[2px] font-bold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Seguimiento del pedido</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[['Estado del pedido', venta.estado], ['Estado de preparación', venta.estadoPreparacion], ['Estado del envío', venta.estadoEnvio]].map(([label, value]) => { const visual = estadoVisual(value); return <div key={label}><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{label}</p><p className="flex items-center gap-1.5 font-semibold text-[var(--noir)] dark:text-[var(--snow)]"><i className={`bi ${visual.icon} ${visual.color}`} aria-hidden="true" />{estadoLegible(value)}</p></div>; })}
          </div>
          {venta.estado === "CANCELADO" && venta.motivoCancelacion && (
            <div className="mt-4 border-t border-[var(--border-gold-25)] pt-3">
              <button type="button" onClick={() => setMostrarMotivo((visible) => !visible)} className="text-sm font-semibold text-[var(--gold-dark)] underline-offset-2 hover:underline dark:text-[var(--gold-light)]">
                {mostrarMotivo ? "Ocultar motivo" : "Ver motivo"}
              </button>
              {mostrarMotivo && <p className="mt-2 rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 text-sm text-[var(--noir)] dark:bg-[var(--noir)] dark:text-[var(--snow)]">{venta.motivoCancelacion}</p>}
            </div>
          )}
        </div>

        {/* Cliente */}
        <div>
          <p className="font-tag text-[11px] lg:text-xs tracking-[2px] uppercase font-bold mb-3 transition-colors text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
            Cliente
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Nombre", value: venta.cliente?.nombre },
              { label: "Email",  value: venta.cliente?.email },
              { label: "Ciudad", value: venta.direccionEntrega?.ciudad },
              { label: "Calle",  value: [venta.direccionEntrega?.calle, venta.direccionEntrega?.numeroExterior].filter(Boolean).join(" ") },
              { label: "C.P.",   value: venta.direccionEntrega?.cp },
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
        {venta.estado === "ENVIADO" && (
          <div className="rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--gold-08)] p-4">
            <p className="font-tag text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Envío simulado</p>
            <p className="mt-1 text-sm text-[var(--noir)] dark:text-[var(--snow)]">{venta.paqueteria || "D'ORO Envíos (simulado)"} · Guía {venta.guiaEnvio || "—"}</p>
            <p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Estado: {(venta.estadoEnvio || "ENVIADO_PAQUETERIA").replaceAll("_", " ")}</p>
            {false && venta.estadoEnvio !== "ENTREGADO" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {venta.estadoEnvio !== "EN_TRANSITO" && <Boton variante="claro" disabled={actualizandoEnvio} onClick={() => onActualizarEnvio(venta.id, "EN_TRANSITO")}>{actualizandoEnvio && <i className="bi bi-arrow-repeat mr-1 animate-spin" />}{actualizandoEnvio ? "Actualizando..." : "En tránsito"}</Boton>}
                <Boton variante="oscuro" disabled={actualizandoEnvio} onClick={() => onActualizarEnvio(venta.id, "ENTREGADO")}>{actualizandoEnvio && <i className="bi bi-arrow-repeat mr-1 animate-spin" />}{actualizandoEnvio ? "Actualizando..." : "Marcar entregado"}</Boton>
              </div>
            )}
            <p className="mt-3 flex items-start gap-2 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]"><i className="bi bi-info-circle mt-0.5 text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />{venta.estadoEnvio === "ENTREGADO" ? "Entrega registrada automáticamente por el simulador de paquetería." : "El seguimiento es una simulación. La entrega se actualizará automáticamente después de un minuto en tránsito."}</p>
          </div>
        )}

        {false && puedeActualizar && !["CANCELADO", "ENVIADO"].includes(venta.estado) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {false && venta.estado === "PAGADO" && (
              venta.estadoPreparacion === "PREPARADO" ? (
                <Boton
                  variante="claro"
                  onClick={() => {}}
                  tipo="button"
                >
                  <i className="bi bi-truck mr-1" /> Marcar como enviado
                </Boton>
              ) : (
                <p className="self-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  <i className="bi bi-box-seam mr-1" /> Esperando preparación de bodega.
                </p>
              )
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
