export default function Modal({ isOpen, onClose, titulo, footer, children, ancho = "max-w-md" }) {
  if (!isOpen) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-colors duration-300 font-body
        bg-[var(--noir)]/40
        dark:bg-black/60
      `}
      onClick={onClose}
    >
      <div 
        className={`
          rounded-[2px] shadow-2xl w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300
          bg-[var(--snow)] border border-[var(--border-gold-40)]
          dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]
        `}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`
          shrink-0 flex items-center justify-between px-6 py-5 border-b transition-colors
          border-[var(--border-gold-25)]
          dark:border-[var(--border-gold-20)]
        `}>
          <h2 className="text-xl lg:text-2xl font-display font-bold uppercase tracking-widest text-[var(--noir)] dark:text-[var(--snow)] m-0">
            {titulo}
          </h2>
          <button 
            onClick={onClose} 
            className={`
              w-8 h-8 flex items-center justify-center rounded-[2px] transition-all cursor-pointer
              text-[var(--gold-dark)] hover:bg-[var(--gold-08)]
              dark:text-[var(--ash)] dark:hover:text-[var(--snow)] dark:hover:bg-[var(--gold-08)]
            `}
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Contenido */}
        <div className={`
          flex-1 overflow-y-auto overscroll-contain p-6
          [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[2px]
          [&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/20 hover:[&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/50
          dark:[&::-webkit-scrollbar-thumb]:bg-[var(--gold-light)]/30 dark:hover:[&::-webkit-scrollbar-thumb]:bg-[var(--gold-light)]
        `}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`
            shrink-0 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 border-t transition-colors
            border-[var(--border-gold-25)] bg-[var(--gold-08)]
            dark:border-[var(--border-gold-20)] dark:bg-transparent
          `}>
            {footer}
          </div>
        )}

      </div>
    </div>
  );
}