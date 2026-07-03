import { Calendar, User, Package } from "lucide-react";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import Modal from "./Modal";
import AccionesTabla from "./AccionesTabla";

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

export default function ModalRecepciones({ 
  row, 
  onClose, 
  onConfirmar, 
  onEditar, 
  onEliminar,
  isOpen 
}) {
  if (!row) return null;

  const unidadesTotales = row.items.reduce((acc, i) => acc + i.cantidad, 0);
  const esDraft = row.status === "DRAFT";
  const estadoLabel = row.status === "CONFIRMED" ? "Confirmado" : "Draft";

  // Header
  const tituloPersonalizado = (
    <div className="flex items-center gap-3">
      <span className="px-4 py-1.5 rounded-[2px] text-xs lg:text-sm font-tag uppercase transition-colors bg-[var(--gold-dark)] text-[var(--snow)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)]">
        {row.folio}
      </span>
      <Etiquetas contenido={estadoLabel} />
    </div>
  );

  // Footer
  const footerContenido = (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
      
      {/* Fechas */}
      <div className="flex gap-6 w-full sm:w-auto">
        <div>
          <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider transition-colors text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Creado
          </p>
          <p className="text-xs lg:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors">
            {formatDate(row.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider transition-colors text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Editado
          </p>
          <p className="text-xs lg:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors">
            {formatDate(row.updatedAt)}
          </p>
        </div>
      </div>
      
      {/* Acciones */}
      {esDraft && (
        <div className="flex items-center justify-end gap-6 w-full sm:w-auto">
          
          <AccionesTabla
            onEliminar={() => onEliminar(row.id)}
            onEditar={() => onEditar(row)}
          />
          
          <div className="hidden sm:block w-px h-8 bg-[var(--border-gold-40)] dark:bg-[var(--border-gold-20)]"></div>

          <Boton 
            variante="oscuro" 
            onClick={() => onConfirmar(row.id)} 
            className="w-full sm:w-36 flex justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <i className="bi bi-check-circle"></i> Confirmar
          </Boton>
          
        </div>
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
      <div className="font-body pt-2">
        
        {/* Información Principal */}
        <h2 className="text-xl lg:text-2xl font-display font-extrabold mb-2 text-[var(--noir)] dark:text-[var(--snow)]">{row.supplierNombre}</h2>
        
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-sm lg:text-base transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
            <Calendar size={13} className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
            {formatDate(row.fecha)}
          </span>
          <span className="flex items-center gap-1.5 text-sm lg:text-base transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
            <User size={13} className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
            {row.createdBy || "—"}
          </span>
        </div>
        
        {row.comentarios && (
          <p className="mt-4 text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors italic border-l-4 border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] pl-3">
            "{row.comentarios}"
          </p>
        )}

        {/* Resumen */}
        <div className={`
          mt-6 mb-6 rounded-[2px] overflow-hidden border transition-colors shadow-sm
          bg-[var(--snow)] border-[var(--border-gold-40)]
          dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none
        `}>
          <div className="grid grid-cols-3">
            {[
              { label: "Items distintos",  value: row.items.length, color: "text-[var(--noir)] dark:text-[var(--snow)]" },
              { label: "Unidades totales", value: unidadesTotales,  color: "text-[var(--noir)] dark:text-[var(--snow)]" },
              { label: "Total",            value: formatMoney(row.total), color: "text-green-700 dark:text-verde font-extrabold" },
            ].map((stat, i) => (
              <div 
                key={i} 
                className={`
                  px-4 py-3 text-center 
                  ${i < 2 ? 'border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]' : ''}
                `}
              >
                <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider mb-1 transition-colors text-[var(--gold-dark)] dark:text-[var(--ash)]">
                  {stat.label}
                </p>
                <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Items */}
        <div className="mb-2">
          <p className="text-xs lg:text-sm font-tag font-bold uppercase tracking-widest mb-3 transition-colors text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Detalles de Items
          </p>
          <div className="flex flex-col gap-3">
            {row.items.map((item, i) => (
              <div 
                key={i} 
                className={`
                  flex flex-wrap md:flex-nowrap items-center gap-4 rounded-[2px] px-4 py-3 border transition-colors shadow-sm
                  bg-[var(--snow)] border-[var(--border-gold-40)]
                  dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none
                `}
              >
                <div className={`
                  w-11 h-11 rounded-[2px] flex items-center justify-center shrink-0 overflow-hidden border transition-colors
                  bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)]
                  dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]
                `}>
                  {item.imagen
                    ? <img src={item.imagen} alt={item.productNombre} className="w-full h-full object-cover" />
                    : <Package size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm lg:text-base font-bold truncate text-[var(--noir)] dark:text-[var(--snow)]">{item.sku}</p>
                  <p className="text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors truncate">
                    {item.productNombre}
                  </p>
                  {item.talla && (
                    <span className={`
                      inline-block mt-1 px-2 py-0.5 rounded-[2px] text-[10px] lg:text-[11px] font-bold border transition-colors
                      bg-[var(--gold-08)] text-[var(--gold-dark)] border-[var(--border-gold-40)]
                      dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)]
                    `}>
                      Talla {item.talla}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                  {[
                    { label: "Cant.",     value: item.cantidad },
                    { label: "Costo un.", value: formatMoney(item.costoUnitario) },
                    { label: "Subtotal",  value: formatMoney(item.subtotal) },
                  ].map((col) => (
                    <div key={col.label} className="text-center md:text-right">
                      <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider mb-0.5 transition-colors text-[var(--gold-dark)] dark:text-[var(--ash)]">
                        {col.label}
                      </p>
                      <p className="text-sm lg:text-base font-bold opacity-90 text-[var(--noir)] dark:text-[var(--snow)]">{col.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}