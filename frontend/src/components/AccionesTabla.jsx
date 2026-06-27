export default function AccionesTabla({ onVer, onEditar, onEliminar, onPermisos }) {
  return (
    <div className="flex items-center justify-center gap-3">

      {/* Botón Ver */}
      {onVer && (
        <button
          onClick={onVer}
          className="relative group bg-transparent border-none cursor-pointer text-md outline-none transition-all
            opacity-70 hover:opacity-100
            text-lila-mid hover:text-verde
            dark:text-lila-soft dark:hover:text-verde"
        >
          <i className="bi bi-eye inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-poppins px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-oscuro text-blanco
            dark:bg-oscuro dark:text-blanco">
            Ver Detalles
          </span>
        </button>
      )}

      {/* Botón Permisos */}
      {onPermisos && (
        <button
          onClick={onPermisos}
          className="relative group bg-transparent border-none cursor-pointer text-md outline-none transition-all
            opacity-70 hover:opacity-100
            text-lila-mid hover:text-azul
            dark:text-lila-soft dark:hover:text-azul"
        >
          <i className="bi bi-shield-lock inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-poppins px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-oscuro text-blanco
            dark:bg-oscuro dark:text-blanco">
            Gestionar Permisos
          </span>
        </button>
      )}

      {/* Botón Editar */}
      {onEditar && (
        <button
          onClick={onEditar}
          className="relative group bg-transparent border-none cursor-pointer text-md outline-none transition-all
            opacity-70 hover:opacity-100
            text-lila-mid hover:text-amarillo
            dark:text-lila-soft dark:hover:text-amarillo"
        >
          <i className="bi bi-pencil inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-poppins px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-oscuro text-blanco
            dark:bg-oscuro dark:text-blanco">
            Editar
          </span>
        </button>
      )}

      {/* Botón Eliminar */}
      {onEliminar && (
        <button
          onClick={onEliminar}
          className="relative group bg-transparent border-none cursor-pointer text-md outline-none transition-all
            opacity-70 hover:opacity-100
            text-lila-mid hover:text-rojo
            dark:text-lila-soft dark:hover:text-rojo"
        >
          <i className="bi bi-trash inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-poppins px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-oscuro text-blanco
            dark:bg-oscuro dark:text-blanco">
            Eliminar
          </span>
        </button>
      )}

    </div>
  );
}