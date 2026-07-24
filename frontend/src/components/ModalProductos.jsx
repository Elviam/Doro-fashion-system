import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";

function fmtCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-MX")}`;
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })} · ${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
}

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (Number(item.stock) || 0), 0);
}

function Dato({ etiqueta, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">{etiqueta}</p>
      <p className="text-sm font-semibold text-noir dark:text-snow">{children}</p>
    </div>
  );
}

function ExistenciasPorTalla({ inventario, categoria, className = "" }) {
  if (!Array.isArray(inventario) || inventario.length === 0) return null;

  const ordenTallas = TALLAS_POR_CATEGORIA[categoria] || [];
  const tallasOrdenadas = [...inventario].sort((a, b) => {
    const tallaA = String(a.talla || "");
    const tallaB = String(b.talla || "");
    const indiceA = ordenTallas.indexOf(tallaA);
    const indiceB = ordenTallas.indexOf(tallaB);

    if (indiceA !== -1 || indiceB !== -1) {
      return (indiceA === -1 ? Number.MAX_SAFE_INTEGER : indiceA)
        - (indiceB === -1 ? Number.MAX_SAFE_INTEGER : indiceB);
    }

    return tallaA.localeCompare(tallaB, "es-MX", { numeric: true });
  });

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-ash mb-2"><i className="bi bi-box-seam mr-1"></i> Existencias por talla</p>
      <div className="flex flex-wrap gap-2">
        {tallasOrdenadas.map((item, index) => (
          <div key={`${item.talla || "uni"}-${index}`} className="flex flex-col items-center justify-center w-16 h-14 rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:border-[var(--border-gold-20)] dark:bg-[var(--gold-08)] dark:text-[var(--snow)]">
            <span className="text-xs font-bold uppercase">{item.talla || "UNI"}</span>
            <span className="text-base font-bold leading-none">{item.stock || 0} <span className="text-[10px] font-medium">pz</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModalProductos({ isOpen, onClose, data, onEdit, onDelete }) {
  if (!isOpen || !data) return null;

  const stockTotal = calcularStockTotal(data.inventario);
  const stockMinimo = Number(data.stockMinimo ?? 0);
  const precioCompra = Number(data.precioCompra || data.pCompra || 0);
  const precioVenta = Number(data.precioVenta || data.pVenta || 0);
  const precioCompraAnterior = Number(data.precioCompraAnterior || 0);
  const variacionCosto = precioCompraAnterior === 0
    ? null
    : ((precioCompra - precioCompraAnterior) / precioCompraAnterior) * 100;

  const footerAcciones = (
    <div className="flex w-full flex-nowrap items-center justify-between gap-3">
      {onDelete && (
        <button type="button" onClick={() => { onClose?.(); onDelete(data.id); }} aria-label="Eliminar producto" title="Eliminar producto" className="font-tag shrink-0 rounded-[2px] border px-3 py-2 text-sm font-bold transition-colors cursor-pointer text-red-700 dark:text-rojo border-red-700/30 dark:border-rojo/30 bg-red-700/10 dark:bg-rojo/10 hover:bg-red-700 dark:hover:bg-rojo hover:text-[var(--snow)] sm:px-4">
          <i className="bi bi-trash3 sm:mr-1"></i><span className="hidden sm:inline"> Eliminar</span>
        </button>
      )}
      <Boton variante="oscuro" onClick={() => { onClose?.(); onEdit?.(data); }} className="ml-auto min-w-[168px] shrink-0"><i className="bi bi-pencil-square"></i> Editar Producto</Boton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={data.nombre || "Detalle de Producto"} ancho="max-w-3xl" footer={footerAcciones}>
      <div className="flex flex-col md:flex-row gap-6 font-body">
        <div className="w-full md:w-4/12 flex flex-col gap-3">
          {data.imagenes?.[0] ? (
            <img src={data.imagenes[0]} alt={data.nombre} className="w-full max-w-[220px] h-[220px] mx-auto md:mx-0 object-contain" />
          ) : (
            <div className="w-full max-w-[220px] h-[220px] mx-auto md:mx-0 flex items-center justify-center"><i className="bi bi-image text-4xl text-ash" /></div>
          )}
          <div className="text-center"><span className="text-xs px-2 py-1 rounded-[2px] bg-[var(--gold-08)] text-[var(--noir)] dark:text-[var(--gold-light)]">{data.sku || "Sin SKU"}</span></div>
          <ExistenciasPorTalla inventario={data.inventario} categoria={data.categoria} className="hidden md:block" />
        </div>

        <div className="w-full md:w-8/12 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Etiquetas contenido={data.categoria} />
            <Etiquetas contenido={data.activo === false ? "Inactivo" : "Activo"} />
          </div>
          {data.descripcion ? <p className="text-sm leading-relaxed text-[var(--noir)] dark:text-[var(--snow)]">{data.descripcion}</p> : <p className="text-sm text-noir-soft dark:text-ash">Sin descripción registrada.</p>}

          {data.pendingPriceReview && (
            <section className="rounded-[2px] border border-amber-500/40 bg-amber-500/10 p-4 text-[var(--noir)] dark:text-[var(--snow)]">
              <div className="flex items-start gap-3">
                <i className="bi bi-exclamation-triangle-fill mt-0.5 text-lg text-amber-600 dark:text-amber-400" />
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-sm font-bold">Cambio reciente en el costo de compra</h3>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <p className="m-0"><span className="block text-xs text-noir-soft dark:text-ash">Costo anterior</span><strong>{fmtCurrency(precioCompraAnterior)}</strong></p>
                    <p className="m-0"><span className="block text-xs text-noir-soft dark:text-ash">Costo actual</span><strong>{fmtCurrency(precioCompra)}</strong></p>
                    <p className="m-0"><span className="block text-xs text-noir-soft dark:text-ash">Variación</span><strong className={variacionCosto !== null && variacionCosto < 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>{variacionCosto === null ? "N/A" : `${variacionCosto >= 0 ? "+" : ""}${variacionCosto.toFixed(1)}%`}</strong></p>
                  </div>
                  <p className="mb-3 mt-3 text-xs leading-relaxed text-noir-soft dark:text-ash">El costo de compra fue actualizado durante una recepción reciente. Revisa si deseas ajustar el precio de venta.</p>
                  <Boton variante="oscuro" onClick={() => { onClose?.(); onEdit?.(data); }} className="text-xs"><i className="bi bi-pencil-square" /> Actualizar precio de venta</Boton>
                </div>
              </div>
            </section>
          )}

          <div className="grid grid-cols-2 gap-4 p-4 rounded-[2px] bg-[var(--snow)] border border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
            <Dato etiqueta="Departamento">{data.departamento || "—"}</Dato>
            <Dato etiqueta="Proveedor">{data.supplierNombre || "Sin proveedor"}</Dato>
            <Dato etiqueta="Precio de compra">{fmtCurrency(precioCompra)}</Dato>
            <Dato etiqueta="Precio de venta">{fmtCurrency(precioVenta)}</Dato>
            <Dato etiqueta="Estado en tienda">{data.activo === false ? "Inactivo" : "Activo"}</Dato>
            <Dato etiqueta="Unidad">{data.unidad || "Pieza"}</Dato>
            <Dato etiqueta="Fecha de registro">{fmtDateTime(data.createdAt)}</Dato>
            <Dato etiqueta="Última actualización">{fmtDateTime(data.updatedAt)}</Dato>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-[2px] bg-gold/8 border border-gold/40 dark:bg-noir/40 dark:border-gold/20">
            <Dato etiqueta="Stock total"><span className="text-xl">{stockTotal}</span></Dato>
            <Dato etiqueta="Stock mínimo"><span className={`text-xl ${stockTotal <= stockMinimo ? "text-rojo" : "text-noir dark:text-snow"}`}>{stockMinimo}</span></Dato>
            <Dato etiqueta="Stock ideal"><span className="text-xl">{Number(data.stockIdeal) || 0}</span></Dato>
            <Dato etiqueta="Stock máximo"><span className="text-xl">{Number(data.stockMaximo) || 0}</span></Dato>
          </div>

          <ExistenciasPorTalla inventario={data.inventario} categoria={data.categoria} className="md:hidden" />
        </div>
      </div>
    </Modal>
  );
}
