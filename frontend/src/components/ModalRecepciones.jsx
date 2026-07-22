import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import Modal from "./Modal";
import AccionesTabla from "./AccionesTabla";
import { exportarExcel, exportarPDF } from "../services/exportService";
import { uploadFileToCloudinary } from "../services/cloudinaryClient";

const ESTADO_LABELS = { BORRADOR: "Borrador", ENVIADA: "Enviada", CONFIRMADA: "Recibido", CANCELADA: "Cancelada" };

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

export default function ModalRecepciones({ row, onClose, onConfirmar, onCancelar, onEditar, onEliminar, isOpen, soloLectura = false, modoChecklist = false, puedeEditar = false, puedeEliminar = false, puedeConfirmar = false, puedeCancelar = false }) {
  const [busquedaItems, setBusquedaItems] = useState("");
  const [itemsChecklist, setItemsChecklist] = useState([]);
  const [facturaProveedor, setFacturaProveedor] = useState("");
  const [archivoFactura, setArchivoFactura] = useState(null);
  const [subiendoFactura, setSubiendoFactura] = useState(false);

  useEffect(() => {
    if (!row) return;
    setBusquedaItems("");
    setFacturaProveedor(row.facturaProveedor || "");
    setArchivoFactura(null);
    setItemsChecklist((row.items || []).map((item) => ({
      id: item.id,
      cantidadRecibida: Number(item.cantidad || 0),
      costoUnitarioReal: Number(item.costoUnitarioReal ?? item.costoUnitario ?? 0),
    })));
  }, [row?.id, modoChecklist]);

  if (!row) return null;

  const esBorrador = row.status === "BORRADOR";
  const esEnviada = row.status === "ENVIADA";
  const esConfirmada = row.status === "CONFIRMADA";
  const columnasExportacion = [
    { header: "SKU", key: "sku", width: 18 },
    { header: "Producto", key: "producto", width: 32 },
    { header: "Talla", key: "talla", width: 14 },
    { header: "Cantidad (pz)", key: "cantidad", width: 16 },
    { header: "Costo unitario", key: "costoUnitario", width: 18 },
    { header: "Subtotal", key: "subtotal", width: 18 },
  ];
  const filasExportacion = row.items.map((item) => ({
    sku: item.sku || "—",
    producto: item.productNombre || "—",
    talla: item.talla || "—",
    cantidad: Number(item.cantidad || 0),
    costoUnitario: formatMoney(item.costoUnitario),
    subtotal: formatMoney(item.subtotal),
  }));
  const tituloExportacion = `Pedido ${row.folio || row.id}`;
  const terminoBusquedaItems = busquedaItems.trim().toLowerCase();
  const itemsVisibles = (row.items || []).filter((item) => !terminoBusquedaItems || item.productNombre?.toLowerCase().includes(terminoBusquedaItems) || item.sku?.toLowerCase().includes(terminoBusquedaItems));

  const actualizarCantidadRecibida = (id, valor) => {
    const itemPedido = row.items.find((item) => item.id === id);
    const cantidad = Math.min(Number(itemPedido?.cantidad || 0), Math.max(0, Number(valor) || 0));
    setItemsChecklist((prev) => prev.map((item) => item.id === id ? { ...item, cantidadRecibida: cantidad } : item));
  };

  const marcarItemRecibido = (id, recibido) => {
    const itemPedido = row.items.find((item) => item.id === id);
    actualizarCantidadRecibida(id, recibido ? itemPedido?.cantidad : 0);
  };

  const actualizarCostoReal = (id, valor) => {
    const costo = Math.max(0, Number(valor) || 0);
    setItemsChecklist((prev) => prev.map((item) => item.id === id ? { ...item, costoUnitarioReal: costo } : item));
  };

  const confirmarChecklist = async () => {
    let facturaUrl = row.facturaUrl || undefined;
    if (archivoFactura) {
      setSubiendoFactura(true);
      facturaUrl = await uploadFileToCloudinary(archivoFactura);
      setSubiendoFactura(false);
      if (!facturaUrl) {
        window.alert("No se pudo subir la evidencia de la factura. Intenta nuevamente o confirma sin adjunto.");
        return;
      }
    }
    await onConfirmar(row, { items: itemsChecklist, facturaProveedor, facturaUrl });
  };

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
      {soloLectura && (
        <div className="flex w-full sm:ml-auto sm:w-auto justify-end gap-3">
          <button type="button" onClick={() => exportarPDF(tituloExportacion, columnasExportacion, filasExportacion)} className="rounded-[2px] border border-red-700/40 bg-red-700/10 px-4 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-700 hover:text-[var(--snow)] dark:border-rojo/40 dark:text-rojo dark:hover:bg-rojo">
            <i className="bi bi-file-earmark-pdf mr-2" />Descargar PDF
          </button>
          <button type="button" onClick={() => exportarExcel(tituloExportacion, columnasExportacion, filasExportacion)} className="rounded-[2px] border border-green-700/40 bg-green-700/10 px-4 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-700 hover:text-[var(--snow)] dark:border-verde/40 dark:text-verde dark:hover:bg-verde">
            <i className="bi bi-file-earmark-excel mr-2" />Descargar Excel
          </button>
        </div>
      )}

      {!soloLectura && esBorrador && (puedeEditar || puedeEliminar) && (
        <div className="flex items-center justify-end gap-6 w-full sm:w-auto">
          <AccionesTabla
            onEliminar={puedeEliminar ? () => onEliminar(row.id) : undefined}
            onEditar={puedeEditar ? () => onEditar(row) : undefined}
          />
        </div>
      )}

      {!soloLectura && esEnviada && puedeConfirmar && (
        <Boton variante="oscuro" onClick={() => modoChecklist ? confirmarChecklist() : onConfirmar(row)} disabled={subiendoFactura} className="w-full sm:w-52 flex justify-center shadow-md hover:shadow-lg transition-shadow">
          <i className={`bi ${subiendoFactura ? "bi-arrow-repeat animate-spin" : "bi-check-circle"}`} /> {subiendoFactura ? "Subiendo factura..." : "Confirmar recepción"}
        </Boton>
      )}

      {!soloLectura && (esBorrador || esEnviada) && puedeCancelar && (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Proveedor", value: row.supplierNombre || "Sin proveedor asignado" },
            { label: "Factura proveedor", value: row.facturaProveedor || "—" },
            { label: "Creado", value: formatDateTime(row.createdAt) },
            { label: "Enviado", value: formatDateTime(row.sentAt) },
            { label: esConfirmada ? "Confirmado por" : "Creado por", value: esConfirmada ? `${row.confirmedByNombre || "Admin sistema"} a las ${formatHora(row.confirmedAt)}` : (row.createdBy || "—") },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[2px] border p-3 bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] shadow-sm">
              <p className={`font-tag text-[10px] uppercase tracking-widest mb-1 ${label === "Enviado" ? "text-green-700 dark:text-verde" : "text-[var(--noir-soft)] dark:text-[var(--ash)]"}`}>{label}</p>
              <p className="font-body text-sm font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{value}</p>
            </div>
          ))}
        </div>

        {row.facturaUrl && (
          <a href={row.facturaUrl} target="_blank" rel="noreferrer" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--gold-dark)] hover:underline dark:text-[var(--gold-light)]">
            <i className="bi bi-paperclip" />Ver evidencia de factura
          </a>
        )}

        {esConfirmada && row.items.some((item) => Number(item.cantidadRecibida ?? item.cantidad) < Number(item.cantidad)) && (
          <div className="mb-6 rounded-[2px] border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--noir)] dark:text-[var(--snow)]">
            <p className="font-tag font-bold uppercase tracking-wider text-xs mb-2">Productos no recibidos:</p>
            <ul className="space-y-1">
              {row.items
                .filter((item) => Number(item.cantidadRecibida ?? item.cantidad) < Number(item.cantidad))
                .map((item) => {
                  const faltante = Number(item.cantidad) - Number(item.cantidadRecibida ?? item.cantidad);
                  return <li key={item.id || `${item.productId}-${item.talla}`}>{item.productNombre} · {item.talla || "Sin talla"} · Faltan {faltante}</li>;
                })}
            </ul>
          </div>
        )}

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
          {modoChecklist && esEnviada && (
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              <div className="relative"><i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]" /><input
                type="search"
                value={busquedaItems}
                onChange={(event) => setBusquedaItems(event.target.value)}
                placeholder="Buscar por producto o SKU..."
                className="h-10 w-full rounded-[2px] border py-2 pl-9 pr-3 text-sm outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
              /></div>
              <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                Factura del proveedor
                <input
                  type="text"
                  value={facturaProveedor}
                  onChange={(event) => setFacturaProveedor(event.target.value)}
                  placeholder="Opcional"
                  className="mt-1 h-10 w-full rounded-[2px] border px-3 text-sm normal-case font-body outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                />
              </label>
              <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                Evidencia de factura
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(event) => setArchivoFactura(event.target.files?.[0] || null)}
                  className="mt-1 block h-10 w-full cursor-pointer rounded-[2px] border px-2 text-xs normal-case font-body file:mr-2 file:border-0 file:bg-transparent file:font-semibold bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                />
              </label>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {itemsVisibles.map((item, i) => (
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
                    { label: <><span className="lg:hidden">Cant.</span><span className="hidden lg:inline">Cantidad (pz)</span></>, value: item.cantidad, key: "cantidad" },
                    { label: <><span className="lg:hidden">Costo un.</span><span className="hidden lg:inline">Costo unitario</span></>, value: formatMoney(item.costoUnitario), key: "costo" },
                    ...(item.costoUnitarioReal !== null && item.costoUnitarioReal !== undefined ? [{ label: "Costo real", value: formatMoney(item.costoUnitarioReal), key: "costo-real" }] : []),
                    { label: "Subtotal", value: formatMoney(item.subtotal), key: "subtotal" },
                  ].map((col) => (
                    <div key={col.key} className="text-center md:text-right">
                      <p className="text-[10px] font-tag font-bold uppercase tracking-wider mb-0.5 text-[var(--gold-dark)] dark:text-[var(--ash)]">{col.label}</p>
                      <p className="text-sm font-bold text-[var(--noir)] dark:text-[var(--snow)]">{col.value}</p>
                    </div>
                  ))}
                </div>
                {modoChecklist && esEnviada && (
                  <div className="flex w-full flex-wrap items-end justify-between gap-3 rounded-[2px] border p-2.5 md:w-auto md:min-w-80 bg-[var(--gold-08)] border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--noir)] dark:text-[var(--snow)]">
                      <input
                        type="checkbox"
                        checked={Number(itemsChecklist.find((linea) => linea.id === item.id)?.cantidadRecibida || 0) > 0}
                        onChange={(event) => marcarItemRecibido(item.id, event.target.checked)}
                        className="h-4 w-4 accent-[var(--gold)]"
                      />
                      Llegó
                    </label>
                    <label className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      Recibidas
                      <input
                        type="number"
                        min="0"
                        max={item.cantidad}
                        value={itemsChecklist.find((linea) => linea.id === item.id)?.cantidadRecibida ?? item.cantidad}
                        onChange={(event) => actualizarCantidadRecibida(item.id, event.target.value)}
                        className="mt-1 h-8 w-20 rounded-[2px] border text-center text-sm font-body outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                      />
                    </label>
                    <label className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                      Costo real
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemsChecklist.find((linea) => linea.id === item.id)?.costoUnitarioReal ?? item.costoUnitario}
                        onChange={(event) => actualizarCostoReal(item.id, event.target.value)}
                        className="mt-1 h-8 w-24 rounded-[2px] border px-1 text-center text-sm font-body outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"
                      />
                    </label>
                  </div>
                )}
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

function formatDateTime(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatHora(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}
