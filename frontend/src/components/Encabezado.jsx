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
        <h1 className="text-2xl font-extrabold tracking-widest text-oscuro dark:text-blanco uppercase m-0 transition-colors duration-300">
          {titulo}
        </h1>
        <p className="text-xs text-gris mt-1 m-0 capitalize transition-colors duration-300 dark:text-text-gris">
          {fechaActual}
        </p>
      </div>

      {/* Lado Derecho: Botón de Actualizar*/}
      {onActualizar && (
        <button
          onClick={onActualizar}
          className="flex items-center justify-center gap-2 bg-transparent text-morado border border-morado/20 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer hover:bg-morado hover:text-blanco dark:text-lila-soft dark:border-lila/20 dark:hover:bg-lila dark:hover:text-oscuro shrink-0"
        >
          <i className="bi bi-arrow-clockwise" /> Actualizar
        </button>
      )}
    </div>
  );
}