export default function Modal({ isOpen, onClose, titulo, footer, children, ancho = "max-w-md" }) {
  if (!isOpen) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-colors duration-300 font-poppins
        bg-oscuro/40
        dark:bg-black/60
      `}
      onClick={onClose}
    >
      <div 
        className={`
          rounded-3xl shadow-2xl w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300
          bg-lila-pastel border border-morado/20
          dark:bg-bg-card dark:border-lila/20
        `}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`
          shrink-0 flex items-center justify-between px-6 py-5 border-b transition-colors
          border-morado/10
          dark:border-lila/10
        `}>
          <h2 className="text-xl font-bold uppercase tracking-widest text-morado dark:text-blanco m-0">
            {titulo}
          </h2>
          <button 
            onClick={onClose} 
            className={`
              w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer
              text-morado/60 hover:text-morado hover:bg-morado/10
              dark:text-lila-soft dark:hover:text-blanco dark:hover:bg-lila/10
            `}
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Contenido */}
        <div className={`
          flex-1 overflow-y-auto overscroll-contain p-6
          [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-morado/20 hover:[&::-webkit-scrollbar-thumb]:bg-morado/50
          dark:[&::-webkit-scrollbar-thumb]:bg-lila/30 dark:hover:[&::-webkit-scrollbar-thumb]:bg-lila
        `}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`
            shrink-0 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 border-t transition-colors
            border-morado/10 bg-blanco/30
            dark:border-lila/10 dark:bg-transparent
          `}>
            {footer}
          </div>
        )}

      </div>
    </div>
  );
}