import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";

export default function ModalProveedores({ proveedor, onClose, onEditar, onEliminar, isOpen = true }) {
  if (!proveedor) return null;

  const getIniciales = (nombre) => {
    if (!nombre) return "Pv";
    const words = nombre.trim().split(" ");
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Header
  const tituloPersonalizado = (
    <div>
      <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 uppercase tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0">
        Detalle de Proveedor
      </h2>
      <p className="text-xs sm:text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors font-body font-normal tracking-normal normal-case">
        Información de contacto y datos comerciales.
      </p>
    </div>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-between items-center w-full">
      <div className="flex gap-4">
        {proveedor.creado && (
          <div>
            <p className="text-[10px] lg:text-[11px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-0.5">Creado</p>
            <p className="text-xs lg:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">{proveedor.creado}</p>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Boton variante="secundario" onClick={() => onEliminar(proveedor.id)}>
          <i className="bi bi-trash"></i> Eliminar
        </Boton>
        <Boton variante="claro" onClick={() => onEditar(proveedor)}>
          <i className="bi bi-pencil-square"></i> Editar
        </Boton>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      ancho="max-w-4xl"
      titulo={tituloPersonalizado}
      footer={footerAcciones}
    >
      <div className="font-body pt-2 pb-2">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Columna Izquierda: Tarjeta de Perfil y Avatar */}
          <div className="w-full md:w-1/3 rounded-[2px] p-6 flex flex-col items-center justify-center text-center border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 transition-colors font-bold text-3xl bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">
              {getIniciales(proveedor.nombre)}
            </div>
            <h3 className="text-lg lg:text-xl font-display font-bold mb-1 text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.nombre || "—"}</h3>
            <p className="text-xs lg:text-sm font-tag uppercase tracking-widest text-[var(--noir-soft)] dark:text-[var(--ash)] mb-4">
              {proveedor.giro || "Proveedor"}
            </p>
            <Etiquetas contenido={proveedor.estado} />
          </div>

          {/* Columna Derecha: Datos */}
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">RFC</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.rfc || "—"}</p>
            </div>

            <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Contacto Principal</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.contacto || "—"}</p>
            </div>

            <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Teléfono</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.telefono || "—"}</p>
            </div>

            <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Correo Electrónico</p>
              <p className="text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.email || "—"}</p>
            </div>

            <div className="sm:col-span-2 rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
              <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Dirección</p>
              <p className="text-sm lg:text-base font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.direccion || "—"}</p>
            </div>

            {proveedor.notas && (
              <div className="sm:col-span-2 rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
                <p className="text-[10px] lg:text-[11px] font-tag uppercase tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Notas</p>
                <p className="text-sm lg:text-base font-semibold leading-relaxed text-[var(--noir)] dark:text-[var(--snow)]">{proveedor.notas}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </Modal>
  );
}