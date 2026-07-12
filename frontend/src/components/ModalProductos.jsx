//Ver detalles de un producto registrado

import { useState, useEffect } from "react";
import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import { useAuth } from "../hooks/useAuth";
import { obtenerUltimoLog } from "../services/auditService";

function formatearFecha(fechaStr) {
  if (!fechaStr) return "—";
  const fecha = new Date(fechaStr);
  if (isNaN(fecha)) return "—";
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ModalProductos({ data, onEdit, onDelete, onClose, isOpen }) {
  const { token } = useAuth();
  const [creadoPor, setCreadoPor] = useState(null);
  const [cargandoCreador, setCargandoCreador] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.id || !token) { setCreadoPor(null); return; }
    setCargandoCreador(true);
    obtenerUltimoLog({ token, resource: "products", resourceId: data.id, action: "CREATE" })
      .then((log) => setCreadoPor(log?.usuario || null))
      .finally(() => setCargandoCreador(false));
  }, [isOpen, data?.id, token]);

  if (!data) return null;

  const stockTotal = data.inventario?.reduce((acc, item) => acc + item.stock, 0) || 0;
  const textoEstado = data.activo !== false ? "Activo" : "Inactivo";

  const footerAcciones = (
    <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
      <Boton 
        variante="secundario" 
        onClick={onDelete} 
        className="w-full sm:w-auto text-rojo! border-rojo/30! hover:bg-rojo/10!"
      >
        <i className="bi bi-trash"></i> 
        <span>Eliminar</span>
      </Boton>
      <Boton 
        variante="claro" 
        onClick={onEdit} 
        className="w-full sm:w-auto"
      >
        <i className="bi bi-pencil-square"></i> 
        <span>Editar Producto</span>
      </Boton>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      titulo={data.nombre || "Detalle de Producto"} 
      ancho="max-w-4xl" 
      footer={footerAcciones} 
    >
      <div className="font-body">
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-stretch mt-4">
          
          <div className="w-full md:w-5/12 flex flex-col gap-4">
            
            <div className={`
              w-full aspect-square rounded-[2px] p-4 flex items-center justify-center shadow-md shrink-0 transition-colors
              bg-[var(--snow)] border border-[var(--border-gold-40)]
              dark:bg-[var(--snow)] dark:border-[var(--border-gold-20)]
            `}>
              {data.imagenes?.[0] ? (
                <img 
                  src={data.imagenes[0]} 
                  alt={data.nombre} 
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-ash">
                  <i className="bi bi-image text-4xl"></i>
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
            </div>

            {data.descripcion && (
              <div className={`
                rounded-[2px] p-4 border transition-colors shadow-sm
                bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)]
                dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)] dark:shadow-none
              `}>
                <p className="text-sm lg:text-base leading-relaxed text-justify italic opacity-90">
                  "{data.descripcion}"
                </p>
              </div>
            )}

            <div className={`
              rounded-[2px] p-3 border transition-colors shadow-sm text-xs lg:text-sm
              bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir-soft)]
              dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]
            `}>
              <p className="flex items-center gap-2"><i className="bi bi-calendar-event"></i> Creado el {formatearFecha(data.createdAt)}</p>
              <p className="flex items-center gap-2 mt-1">
                <i className="bi bi-person"></i>
                {cargandoCreador ? "Consultando..." : (creadoPor || "Sin registro de auditoría")}
              </p>
            </div>
          </div>

          <div className="w-full md:w-7/12 flex flex-col">
            
            <div className="hidden md:flex flex-wrap gap-2 mb-6">
              <Etiquetas contenido={textoEstado} />
              {data.departamento && <Etiquetas contenido={data.departamento} />}
            </div>

            <div className={`
              grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 rounded-[2px] p-4 border transition-colors shadow-sm
              bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)]
              dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)] dark:shadow-none
            `}>
              <div className="text-center pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] px-1">
                <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-1">STOCK TOTAL</p>
                <p className="font-bold text-xl lg:text-2xl">{stockTotal}</p>
              </div>
              <div className="text-center pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] px-1">
                <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-1">STOCK MÍN</p>
                <p className={`font-bold text-xl lg:text-2xl transition-colors ${stockTotal <= (data.stockMinimo || 0) ? 'text-rojo animate-pulse' : ''}`}>
                  {data.stockMinimo || 0}
                </p>
              </div>
              <div className="text-center pt-2 sm:pt-0 sm:border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] px-1">
                <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-1">P. COMPRA</p>
                <p className="font-bold text-xl lg:text-2xl text-blue-700 dark:text-azul">${data.precioCompra || '0'}</p>
              </div>
              <div className="text-center pt-2 sm:pt-0 px-1">
                <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-1">P. VENTA</p>
                <p className="font-bold text-xl lg:text-2xl text-green-700 dark:text-verde">${data.precioVenta || '0'}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs lg:text-sm font-tag font-bold mb-4 uppercase tracking-wider flex items-center gap-2 text-[var(--gold-dark)] dark:text-[var(--ash)]">
                <i className="bi bi-box-seam"></i> Existencias de Inventario
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {data.inventario?.map((item, index) => (
                  <div 
                    key={index}
                    className={`
                      flex flex-col items-center justify-center h-14 rounded-[2px] border transition-all
                      ${item.stock > 0 
                        ? `shadow-sm bg-[var(--snow)] border-[var(--border-gold-55)] text-[var(--noir)]
                           dark:border-[var(--border-gold-40)] dark:bg-[var(--gold-08)] dark:text-[var(--snow)]` 
                        : `bg-[var(--gold-08)] border-[var(--border-gold-25)] opacity-40 text-[var(--noir-soft)]
                           dark:border-[var(--border-gold-20)] dark:bg-[var(--gold-08)] dark:text-[var(--ash)]`}
                    `}
                  >
                    <span className="text-sm lg:text-base font-bold uppercase">{item.talla}</span>
                    <span className={`text-xs lg:text-sm font-medium ${item.stock <= 5 && item.stock > 0 ? 'text-yellow-700 dark:text-amarillo' : 'opacity-80'}`}>
                      {item.stock} pz
                    </span>
                  </div>
                ))}
                {(!data.inventario || data.inventario.length === 0) && (
                  <div className="col-span-full text-center text-sm lg:text-base italic py-2 opacity-60 text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    Sin registros de inventario
                  </div>
                )}
              </div>
            </div>

            <div className={`
              space-y-1 mt-auto rounded-[2px] p-4 border transition-colors shadow-sm
              bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)]
              dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)] dark:shadow-none
            `}>
              {[
                { label: "SKU", value: data.sku, mono: true },
                { label: "Proveedor", value: data.supplierNombre || "Sin asignar" },
                { label: "Categoría", value: data.categoria }
              ].map((item, idx, arr) => (
                <div 
                  key={item.label} 
                  className={`flex justify-between items-center py-2 ${idx !== arr.length - 1 ? 'border-b border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]' : ''}`}
                >
                  <span className="text-xs lg:text-sm font-tag font-bold uppercase tracking-wider w-1/3 text-[var(--gold-dark)] dark:text-[var(--ash)]">
                    {item.label}
                  </span>
                  <span className={`
                    text-sm lg:text-base text-right w-2/3 truncate 
                    ${item.mono 
                      ? `font-mono px-2 py-0.5 rounded-[2px] inline-block w-auto ml-auto 
                         bg-[var(--gold-08)] text-[var(--gold-dark)] 
                         dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)]` 
                      : 'font-medium'}
                  `}>
                    {item.value || 'N/A'}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </Modal>
  );
}