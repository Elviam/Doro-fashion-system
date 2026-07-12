export default function AccionesTabla({ onVer, onEditar, onEliminar, onPermisos, onRegistrarStock }) {
  return (
    <div className="flex items-center justify-center gap-3 lg:gap-4">

      {/* Botón Ver */}
      {onVer && (
        <button
          onClick={onVer}
          className="relative group bg-transparent border-none cursor-pointer text-lg lg:text-xl outline-none transition-all
            opacity-70 hover:opacity-100
            text-[var(--noir-soft)] hover:text-verde-dark
            dark:text-[var(--snow)] dark:hover:text-verde"
        >
          <i className="bi bi-eye inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs lg:text-sm font-body px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-[var(--noir)] text-[var(--snow)]
            dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border dark:border-[var(--border-gold-20)]">
            Ver Detalles
          </span>
        </button>
      )}

      {/* Botón Permisos */}
      {onPermisos && (
        <button
          onClick={onPermisos}
          className="relative group bg-transparent border-none cursor-pointer text-lg lg:text-xl outline-none transition-all
            opacity-70 hover:opacity-100
            text-[var(--noir-soft)] hover:text-azul-dark
            dark:text-[var(--snow)] dark:hover:text-azul"
        >
          <i className="bi bi-shield-lock inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs lg:text-sm font-body px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-[var(--noir)] text-[var(--snow)]
            dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border dark:border-[var(--border-gold-20)]">
            Gestionar Permisos
          </span>
        </button>
      )}

      {/* Botón Editar */}
      {onEditar && (
        <button
          onClick={onEditar}
          className="relative group bg-transparent border-none cursor-pointer text-lg lg:text-xl outline-none transition-all
            opacity-70 hover:opacity-100
            text-[var(--noir-soft)] hover:text-[var(--gold-dark)]
            dark:text-[var(--snow)] dark:hover:text-[var(--gold-light)]"
        >
          <i className="bi bi-pencil inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs lg:text-sm font-body px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-[var(--noir)] text-[var(--snow)]
            dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border dark:border-[var(--border-gold-20)]">
            Editar
          </span>
        </button>
      )}

      {/* Botón Registrar Stock (producto sin inventario) */}
      {onRegistrarStock && (
        <button
          onClick={onRegistrarStock}
          className="relative group bg-transparent border-none cursor-pointer text-lg lg:text-xl outline-none transition-all
            opacity-70 hover:opacity-100
            text-amarillo-dark hover:text-amarillo
            dark:text-amarillo dark:hover:text-amarillo"
        >
          <i className="bi bi-box-arrow-in-down inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs lg:text-sm font-body px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-[var(--noir)] text-[var(--snow)]
            dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border dark:border-[var(--border-gold-20)]">
            Registrar Stock
          </span>
        </button>
      )}

      {/* Botón Eliminar */}
      {onEliminar && (
        <button
          onClick={onEliminar}
          className="relative group bg-transparent border-none cursor-pointer text-lg lg:text-xl outline-none transition-all
            opacity-70 hover:opacity-100
            text-[var(--noir-soft)] hover:text-rojo-dark
            dark:text-[var(--snow)] dark:hover:text-rojo"
        >
          <i className="bi bi-trash inline-block transition-transform group-hover:scale-125"></i>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs lg:text-sm font-body px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none
            bg-[var(--noir)] text-[var(--snow)]
            dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border dark:border-[var(--border-gold-20)]">
            Eliminar
          </span>
        </button>
      )}

    </div>
  );
}