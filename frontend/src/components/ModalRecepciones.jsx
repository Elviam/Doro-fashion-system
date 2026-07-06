import { Calendar, User, Package } from "lucide-react";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import Modal from "./Modal";
import AccionesTabla from "./AccionesTabla";

const ESTADO_LABELS = { BORRADOR: "Borrador", CONFIRMADA: "Confirmada", CANCELADA: "Cancelada" };

function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-MX")}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  if (iso.includes("-")) {
    const [year, month, day] = iso.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }
  if (iso.includes("/")) {
    const [dia, mes, anio] = iso.split("/");
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
  }
  return iso;
}

export default function ModalRecepciones({ row, onClose, onConfirmar, onCancelar, onEditar, onEliminar, isOpen }) {
  if (!row) return null;

  const esBorrador = row.status === "BORRADOR";
  const esConfirmada = row.status === "CONFIRMADA";

  const tituloPersonalizado = (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="px-4 py-1.5 rounded-[2px] text-xs lg:text-sm font-tag uppercase transition-colors bg-[var(--gold-dark)] text-[var(--snow)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)]">
        {row.folio}
      </span>
      <Etiquetas contenido={ESTADO_LABELS[row.status] || row.status} />
    </div>
  );

  const footerContenido = (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
      <div className="flex gap-6 w-full sm:w-auto">
        <div>
          <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">Creado</p>
          <p className="text-xs lg:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">{formatDate(row.createdAt)}</p>
        </div>
        {esConfirmada && (
          <div>
            <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">Confirmado</p>
            <p className="text-xs lg:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">{formatDate(row.confirmedAt)}</p>
          </div>
        )}
      </div>

      {esBorrador && (
        <div className="flex items-center justify-end gap-6 w-full sm:w-auto">
          <AccionesTabla onEliminar={() => onEliminar(row.id)} onEditar={() => onEditar(row)} />
          <div className="hidden sm:block w-px h-8 bg-[var(--border-gold-40)] dark:bg-[var(--border-gold-20)]" />
          <Boton variante="oscuro" onClick={() => onConfirmar(row.id)} className="w-full sm:w-36 flex justify-center shadow-md hover:shadow-lg transition-shadow">
            <i className="bi bi-check-circle" /> Confirmar
          </Boton>
        </div>
      )}

      {esConfirmada && (
        <button
          onClick={() => onCancelar(row)}
          className="font-tag rounded-[2px] px-4 py-2 text-sm font-bold transition-colors cursor-pointer border text-red-700 dark:text-rojo border-red-700/30 dark:border-rojo/30 bg-red-700/10 dark:bg-rojo/10 hover:bg-red-700 dark:hover:bg-rojo hover:text-[var(--snow)]"
        >
          <i className="bi bi-slash-circle mr-1" /> Cancelar recepción
        </button>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={tituloPersonalizado} ancho="max-w-3xl" footer={footerContenido}>
      <div className="font-body pt-2">

        {/* Datos generales — encabezado tipo documento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Proveedor", value: row.supplierNombre },
            { label: "Factura proveedor", value: row.facturaProveedor || "—" },
            { label: "Fecha", value: formatDate(row.fecha) },
            { label: esConfirmada ? "Recibido por" : "Creado por", value: row.recibidoPor || row.createdBy || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[2px] border p-3 bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] shadow-sm">
              <p className="font-tag text-[10px] uppercase tracking-widest mb-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">{label}</p>
              <p className="font-body text-sm font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{value}</p>
            </div>
          ))}
        </div>

        {row.comentarios && (
          <p className="mb-6 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] italic border-l-4 border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] pl-3">
            "{row.comentarios}"
          </p>
        )}

        {/* Tabla de productos */}
        <div className="mb-6">
          <p className="text-xs lg:text-sm font-tag font-bold uppercase tracking-widest mb-3 text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Productos ({row.items.length})
          </p>
          <div className="flex flex-col gap-2">
            {row.items.map((item, i) => (
              <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-4 rounded-[2px] px-4 py-3 border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] shadow-sm">
                <div className="w-11 h-11 rounded-[2px] flex items-center justify-center shrink-0 overflow-hidden border bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)]">
                  {item.imagen ? <img src={item.imagen} alt={item.productNombre} className="w-full h-full object-cover" /> : <Package size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-[var(--noir)] dark:text-[var(--snow)]">{item.sku}</p>
                  <p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] truncate">{item.productNombre}</p>
                  {item.talla && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border bg-[var(--gold-08)] text-[var(--gold-dark)] border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                      Talla {item.talla}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                  {[
                    { label: "Cant.", value: item.cantidad },
                    { label: "Costo un.", value: formatMoney(item.costoUnitario) },
                    { label: "Subtotal", value: formatMoney(item.subtotal) },
                  ].map((col) => (
                    <div key={col.label} className="text-center md:text-right">
                      <p className="text-[10px] font-tag font-bold uppercase tracking-wider mb-0.5 text-[var(--gold-dark)] dark:text-[var(--ash)]">{col.label}</p>
                      <p className="text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">{col.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="rounded-[2px] overflow-hidden border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] shadow-sm">
          <div className="grid grid-cols-3">
            {[
              { label: "Productos", value: row.items.length },
              { label: "Piezas", value: row.piezasTotales },
              { label: "Costo total", value: formatMoney(row.total), color: "text-green-700 dark:text-verde font-extrabold" },
            ].map((stat, i) => (
              <div key={i} className={`px-4 py-3 text-center ${i < 2 ? "border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]" : ""}`}>
                <p className="text-[10px] font-tag font-bold uppercase tracking-wider mb-1 text-[var(--gold-dark)] dark:text-[var(--ash)]">{stat.label}</p>
                <p className={`text-xl lg:text-2xl font-bold ${stat.color || "text-[var(--noir)] dark:text-[var(--snow)]"}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}