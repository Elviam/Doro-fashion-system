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
      <h2 className="text-xl sm:text-2xl font-bold mb-1 uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0">
        Detalle de Proveedor
      </h2>
      <p className="text-xs sm:text-sm text-gris dark:text-lila-soft transition-colors font-poppins font-normal tracking-normal normal-case">
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-morado dark:text-lila-soft/50 mb-0.5">Creado</p>
            <p className="text-xs font-semibold text-gris dark:text-lila-mid">{proveedor.creado}</p>
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
      <div className="font-poppins pt-2 pb-2">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Columna Izquierda: Tarjeta de Perfil y Avatar */}
          <div className="w-full md:w-1/3 rounded-3xl p-6 flex flex-col items-center justify-center text-center border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 transition-colors font-bold text-3xl bg-lila-pastel border-morado/20 text-morado dark:bg-lila/10 dark:border-lila/30 dark:text-lila">
              {getIniciales(proveedor.nombre)}
            </div>
            <h3 className="text-lg font-bold mb-1 text-oscuro dark:text-blanco">{proveedor.nombre || "—"}</h3>
            <p className="text-xs uppercase tracking-widest text-gris dark:text-lila-soft mb-4">
              {proveedor.giro || "Proveedor"}
            </p>
            <Etiquetas contenido={proveedor.estado} />
          </div>

          {/* Columna Derecha: Datos */}
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">RFC</p>
              <p className="text-sm font-semibold truncate text-oscuro dark:text-blanco">{proveedor.rfc || "—"}</p>
            </div>

            <div className="rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Contacto Principal</p>
              <p className="text-sm font-semibold truncate text-oscuro dark:text-blanco">{proveedor.contacto || "—"}</p>
            </div>

            <div className="rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Teléfono</p>
              <p className="text-sm font-semibold truncate text-oscuro dark:text-blanco">{proveedor.telefono || "—"}</p>
            </div>

            <div className="rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Correo Electrónico</p>
              <p className="text-sm font-semibold truncate text-oscuro dark:text-blanco">{proveedor.email || "—"}</p>
            </div>

            <div className="sm:col-span-2 rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Dirección</p>
              <p className="text-sm font-semibold text-oscuro dark:text-blanco">{proveedor.direccion || "—"}</p>
            </div>

            {proveedor.notas && (
              <div className="sm:col-span-2 rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Notas</p>
                <p className="text-sm font-semibold leading-relaxed text-oscuro dark:text-blanco">{proveedor.notas}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </Modal>
  );
}