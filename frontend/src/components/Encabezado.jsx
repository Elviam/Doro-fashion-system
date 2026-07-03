export default function Encabezado({ titulo, onActualizar }) {

  const fechaActual = new Date().toLocaleDateString("es-MX", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "2-digit" 
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 transition-colors duration-300">
      
      {/* Lado Izquierdo: Título y Fecha */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-extrabold tracking-widest text-[var(--noir)] dark:text-[var(--snow)] uppercase m-0 transition-colors duration-300">
          {titulo}
        </h1>
        <p className="text-xs lg:text-sm font-body text-[var(--noir-soft)] dark:text-[var(--ash)] mt-1 m-0 capitalize transition-colors duration-300">
          {fechaActual}
        </p>
      </div>

      {/* Lado Derecho: Botón de Actualizar*/}
      {onActualizar && (
        <button
          onClick={onActualizar}
          className="flex items-center justify-center gap-2 bg-transparent text-[var(--gold-dark)] border border-[var(--border-gold-40)] rounded-[2px] px-4 py-2 h-11 text-xs lg:text-sm font-bold font-body transition-all duration-300 active:scale-95 cursor-pointer hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)] shrink-0"
        >
          <i className="bi bi-arrow-clockwise" /> Actualizar
        </button>
      )}
    </div>
  );
}