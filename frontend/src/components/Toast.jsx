import { useEffect } from 'react';

export default function Toast({ message, type = 'exito', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <div className="fixed inset-x-0 top-4 flex justify-center z-200 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div 
        className={`
          flex items-center gap-3.5 px-4 md:px-4.5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border pointer-events-auto
          font-poppins font-bold backdrop-blur-md w-11/12 md:w-auto md:min-w-[280px] md:max-w-md
          transition-colors duration-300
          bg-ivory dark:bg-noir
          ${isError 
            ? 'border-rojo text-noir dark:text-ivory'
            : 'border-gold text-noir dark:text-ivory'
          }
        `}
      >
        {/* Círculo del Icono */}
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full shrink-0
          ${isError 
            ? 'bg-rojo-dark text-snow'
            : 'bg-gold/15 text-gold'
          }
        `}>
          <i className={`text-lg bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-stars'}`}></i>
        </div>
        
        {/* Texto informativo */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-[11px] uppercase tracking-[0.22em] font-bold ${isError ? 'text-rojo-dark dark:text-snow' : 'text-gold-dark dark:text-gold'}`}>
            {isError ? 'Atención' : "D'ORO System"}
          </span>
          <p className="text-[12px] font-medium leading-snug mt-0.5 text-noir/90 dark:text-blanco/90">
            {message}
          </p>
        </div>

        {/* Botón X para cerrar */}
        <button 
          onClick={onClose}
          className="ml-1.5 p-1.5 rounded-xl transition-all hover:bg-black/10 dark:hover:bg-white/10 text-noir/40 hover:text-noir dark:text-white/40 dark:hover:text-white"
        >
          <i className="bi bi-x-lg text-xs"></i>
        </button>
      </div>
    </div>
  );
}