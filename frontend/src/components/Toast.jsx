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
          flex items-center gap-4 px-4 md:px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border pointer-events-auto
          font-poppins font-bold backdrop-blur-md w-11/12 md:w-auto md:min-w-[320px] md:max-w-md
          ${isError 
            ? 'bg-lila/40 border-morado text-rojo' 
            : 'bg-oscuro-card border-morado/30 text-blanco' 
          }
        `}
      >
        {/* Círculo del Icono */}
        <div className={`
          flex items-center justify-center w-11 h-11 rounded-full shrink-0
          ${isError 
            ? 'bg-rojo text-blanco' 
            : 'bg-morado/20 text-lila'
          }
        `}>
          <i className={`text-xl bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-stars'}`}></i>
        </div>
        
        {/* Texto informativo */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-xs uppercase tracking-[0.25em] font-bold ${isError ? 'text-blanco' : 'text-lila'}`}>
            {isError ? 'Atención' : 'Aura System'}
          </span>
          <p className="text-[13px] font-medium leading-snug mt-0.5 text-blanco/90">
            {message}
          </p>
        </div>

        {/* Botón X para cerrar */}
        <button 
          onClick={onClose}
          className="ml-2 p-1.5 rounded-xl transition-all hover:bg-white/10 text-white/40 hover:text-white"
        >
          <i className="bi bi-x-lg text-xs"></i>
        </button>
      </div>
    </div>
  );
}