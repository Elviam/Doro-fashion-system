//Ver detalles de un producto registrado
import { useState, useEffect } from "react";
import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import { useAuth } from "../hooks/useAuth";
import { obtenerUltimoLog } from "../services/auditService";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";

function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (item.stock || 0), 0);
}

export default function ModalDetalleProducto({ isOpen, onClose, producto, onEditar }) {
  const { token } = useAuth();
  const [ultimoMovimiento, setUltimoMovimiento] = useState(null);
  const [cargandoLog, setCargandoLog] = useState(false);

  useEffect(() => {
    if (!isOpen || !producto?.id || !token) { setUltimoMovimiento(null); return; }
    setCargandoLog(true);
    obtenerUltimoLog({ token, resource: "products", resourceId: producto.id, action: "UPDATE" })
      .then(setUltimoMovimiento)
      .finally(() => setCargandoLog(false));
  }, [isOpen, producto?.id, token]);

  if (!isOpen || !producto) return null;

  const stockTotal  = calcularStockTotal(producto.inventario);
  const stockMinimo = Number(producto.stockMinimo) || 5;
  const tallasCategoria = TALLAS_POR_CATEGORIA[producto.categoria] || ["Unitalla"];
  const ajuste = ultimoMovimiento?.details?._ajusteManual;

  const footerAcciones = (
    <div className="w-full flex flex-wrap items-center justify-end gap-3">
      <Boton variante="secundario" onClick={onClose} className="min-w-[110px]">
        Cerrar
      </Boton>
      <Boton variante="oscuro" onClick={() => { onClose(); onEditar(producto); }} className="min-w-[168px]">
        <i className="bi bi-pencil-square"></i> Editar Producto
      </Boton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo={producto.nombre || "Detalle de Producto"} ancho="max-w-3xl" footer={footerAcciones}>
      <div className="flex flex-col md:flex-row gap-6 font-body">

        <div className="w-full md:w-4/12 flex flex-col gap-3">
          <div className="w-full max-w-[220px] mx-auto md:mx-0 aspect-square rounded-[2px] p-3 flex items-center justify-center shadow-md bg-[var(--snow)] border border-[var(--border-gold-40)] dark:bg-[var(--snow)] dark:border-[var(--border-gold-20)]">
            {producto.imagenes?.[0] ? (
              <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-contain" />
            ) : (
              <i className="bi bi-image text-4xl text-ash" />
            )}
          </div>
          <div className="text-center">
            <span className="text-xs px-2 py-1 rounded-[2px] bg-[var(--gold-08)] text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{producto.sku}</span>
          </div>
        </div>

        <div className="w-full md:w-8/12 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Etiquetas contenido={producto.categoria} />
          </div>

          {producto.descripcion && (
            <p className="text-sm leading-relaxed text-[var(--noir)] dark:text-[var(--snow)]">{producto.descripcion}</p>
          )}

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
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-ash mb-2">
              <i className="bi bi-box-seam mr-1"></i> Existencias por Talla
            </p>
            <div className="flex flex-wrap gap-2">
              {tallasCategoria.map((talla) => {
                const cantidad = producto.inventario?.find((i) => i.talla === talla)?.stock || 0;
                return (
                  <div key={talla} className={`flex flex-col items-center justify-center w-14 h-12 rounded-[2px] border
                    ${cantidad > 0
                      ? "bg-[var(--snow)] border-[var(--border-gold-55)] text-[var(--noir)] dark:border-[var(--border-gold-40)] dark:bg-[var(--gold-08)] dark:text-[var(--snow)]"
                      : "bg-[var(--gold-08)] border-[var(--border-gold-25)] opacity-40 text-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:bg-[var(--gold-08)] dark:text-[var(--ash)]"}`}>
                    <span className="text-xs font-bold uppercase">{talla === "Unitalla" ? "UNI" : talla}</span>
                    <span className="text-[10px] opacity-80">{cantidad} pz</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2px] p-4 border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark dark:text-ash mb-2">
              <i className="bi bi-clock-history mr-1"></i> Último Movimiento
            </p>
            {cargandoLog ? (
              <p className="text-sm text-noir-soft dark:text-ash"><i className="bi bi-arrow-repeat animate-spin mr-1" />Consultando auditoría...</p>
            ) : ultimoMovimiento ? (
              <div className="flex flex-col gap-1.5 text-sm">
                <p><span className="font-bold text-noir dark:text-snow">{ultimoMovimiento.usuario || "—"}</span> · <span className="text-noir-soft dark:text-ash">{fmtDateTime(ultimoMovimiento.createdAt)}</span></p>
                {ajuste ? (
                  <>
                    <p className="text-noir-soft dark:text-ash">
                      Talla <strong>{ajuste.talla}</strong>: {ajuste.cantidadAnterior} → {ajuste.cantidadNueva} · Motivo: <strong>{ajuste.motivo}</strong>
                    </p>
                    {ajuste.notas && <p className="text-noir-soft dark:text-ash">"{ajuste.notas}"</p>}
                    {ajuste.evidencia?.length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {ajuste.evidencia.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-[2px] overflow-hidden border border-gold/30 block">
                            <img src={url} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-noir-soft dark:text-ash text-xsc">Sin detalle adicional disponible.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-noir-soft dark:text-ash">Sin movimientos registrados aún.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}