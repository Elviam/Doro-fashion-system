import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";

function fmtCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-MX")}`;
}

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (Number(item.stock) || 0), 0);
}

export default function ModalProductos({ isOpen, onClose, data, onEdit, onDelete }) {
  if (!isOpen || !data) return null;

  const stockTotal = calcularStockTotal(data.inventario);
  const stockMinimo = Number(data.stockMinimo ?? 0);
  const precioVenta = Number(data.precioVenta || data.pVenta || 0);

  const footerAcciones = (
    <div className="w-full flex flex-wrap items-center justify-end gap-3">
      <Boton variante="secundario" onClick={onClose} className="min-w-[110px]">
        Cerrar
      </Boton>
      <Boton variante="oscuro" onClick={() => { onClose?.(); onEdit?.(data); }} className="min-w-[168px]">
        <i className="bi bi-pencil-square"></i> Editar Producto
      </Boton>
      {onDelete && (
        <button
          onClick={() => { onClose?.(); onDelete(data.id); }}
          className="font-tag rounded-[2px] px-4 py-2 text-sm font-bold transition-colors cursor-pointer border text-red-700 dark:text-rojo border-red-700/30 dark:border-rojo/30 bg-red-700/10 dark:bg-rojo/10 hover:bg-red-700 dark:hover:bg-rojo hover:text-[var(--snow)]"
        >
          <i className="bi bi-trash3 mr-1"></i> Eliminar
        </button>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={data.nombre || "Detalle de Producto"} ancho="max-w-3xl" footer={footerAcciones}>
      <div className="flex flex-col md:flex-row gap-6 font-body">
        <div className="w-full md:w-4/12 flex flex-col gap-3">
          <div className="w-full max-w-[220px] mx-auto md:mx-0 aspect-square rounded-[2px] p-3 flex items-center justify-center shadow-md bg-[var(--snow)] border border-[var(--border-gold-40)] dark:bg-[var(--snow)] dark:border-[var(--border-gold-20)]">
            {data.imagenes?.[0] ? (
              <img src={data.imagenes[0]} alt={data.nombre} className="w-full h-full object-contain" />
            ) : (
              <i className="bi bi-image text-4xl text-ash" />
            )}
          </div>
          <div className="text-center">
            <span className="text-xs px-2 py-1 rounded-[2px] bg-[var(--gold-08)] text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{data.sku}</span>
          </div>
        </div>

        <div className="w-full md:w-8/12 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Etiquetas contenido={data.categoria} />
            <Etiquetas contenido={data.activo === false ? "Inactivo" : "Activo"} />
          </div>

          {data.descripcion && (
            <p className="text-sm leading-relaxed text-[var(--noir)] dark:text-[var(--snow)]">{data.descripcion}</p>
          )}

          <div className="grid grid-cols-2 gap-4 p-4 rounded-[2px] bg-gold/8 border border-gold/40 dark:bg-noir/40 dark:border-gold/20">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Precio Venta</p>
              <p className="text-xl font-semibold text-noir dark:text-snow">{fmtCurrency(precioVenta)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock Total</p>
              <p className="text-xl font-semibold text-noir dark:text-snow">{stockTotal}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock Mínimo</p>
              <p className={`text-xl font-semibold ${stockTotal <= stockMinimo ? "text-rojo" : "text-noir dark:text-snow"}`}>{stockMinimo}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Departamento</p>
              <p className="text-xl font-semibold text-noir dark:text-snow">{data.departamento || "—"}</p>
            </div>
          </div>

          {Array.isArray(data.inventario) && data.inventario.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-ash mb-2">
                <i className="bi bi-box-seam mr-1"></i> Existencias
              </p>
              <div className="flex flex-wrap gap-2">
                {data.inventario.map((item, index) => (
                  <div key={`${item.talla || "uni"}-${index}`} className="flex flex-col items-center justify-center w-16 h-12 rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:border-[var(--border-gold-20)] dark:bg-[var(--gold-08)] dark:text-[var(--snow)]">
                    <span className="text-[10px] font-bold uppercase">{item.talla || "UNI"}</span>
                    <span className="text-[10px] opacity-80">{item.stock || 0} pz</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
