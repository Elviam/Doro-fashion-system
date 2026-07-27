// Ver detalles de un producto registrado en Inventario.
import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (item.stock || 0), 0);
}

export default function ModalDetalleProducto({ isOpen, onClose, producto, onEditar }) {
  if (!isOpen || !producto) return null;

  const stockTotal = calcularStockTotal(producto.inventario);
  const stockMinimo = Number(producto.stockMinimo ?? 0);
  const tallasCategoria = TALLAS_POR_CATEGORIA[producto.categoria] || ["Unitalla"];

  const footerAcciones = onEditar ? (
    <div className="w-full flex flex-wrap items-center justify-end gap-3">
      <Boton variante="claro" onClick={() => { onClose(); onEditar(producto); }} className="shrink-0">
        <i className="bi bi-pencil-square"></i> Ajustar inventario
      </Boton>
    </div>
  ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={producto.nombre || "Detalle de Producto"} ancho="max-w-3xl" footer={footerAcciones}>
      <div className="flex flex-col md:flex-row gap-6 font-body">
        <div className="w-full md:w-4/12 flex flex-col gap-3">
          {producto.imagenes?.[0] ? (
            <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full max-w-[220px] h-[220px] mx-auto md:mx-0 object-contain" />
          ) : (
            <div className="w-full max-w-[220px] h-[220px] mx-auto md:mx-0 flex items-center justify-center">
              <i className="bi bi-image text-4xl text-ash" />
            </div>
          )}
          <div className="text-center">
            <span className="text-xs px-2 py-1 rounded-[2px] bg-[var(--gold-08)] text-[var(--noir)] dark:text-[var(--gold-light)]">{producto.sku}</span>
          </div>
        </div>

        <div className="w-full md:w-8/12 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2"><Etiquetas contenido={producto.categoria} /></div>
          {producto.descripcion && <p className="text-sm leading-relaxed text-[var(--noir)] dark:text-[var(--snow)]">{producto.descripcion}</p>}

          <div className="grid grid-cols-2 gap-4 p-4 rounded-[2px] bg-gold/8 border border-gold/40 dark:bg-noir/40 dark:border-gold/20">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock Total</p>
              <p className="text-2xl font-semibold text-noir dark:text-snow">{stockTotal}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock Mínimo</p>
              <p className={`text-2xl font-semibold ${stockTotal <= stockMinimo ? "text-rojo" : "text-noir dark:text-snow"}`}>{stockMinimo}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock Ideal</p>
              <p className="text-xl font-semibold text-noir dark:text-snow">{Number(producto.stockIdeal) || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock Máximo</p>
              <p className="text-xl font-semibold text-noir dark:text-snow">{Number(producto.stockMaximo) || 0}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-ash mb-2"><i className="bi bi-box-seam mr-1"></i> Existencias por Talla</p>
            <div className="flex flex-wrap gap-2">
              {tallasCategoria.map((talla) => {
                const cantidad = producto.inventario?.find((i) => i.talla === talla)?.stock || 0;
                return (
                  <div key={talla} className={`flex flex-col items-center justify-center w-16 h-14 rounded-[2px] border ${cantidad > 0 ? "bg-[var(--snow)] border-[var(--border-gold-55)] text-[var(--noir)] dark:border-[var(--border-gold-40)] dark:bg-[var(--gold-08)] dark:text-[var(--snow)]" : "bg-[var(--gold-08)] border-[var(--border-gold-25)] opacity-40 text-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:bg-[var(--gold-08)] dark:text-[var(--ash)]"}`}>
                    <span className="text-xs font-bold uppercase">{talla === "Unitalla" ? "UNI" : talla}</span>
                    <span className="text-base font-bold leading-none">{cantidad} <span className="text-[10px] font-medium">pz</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
