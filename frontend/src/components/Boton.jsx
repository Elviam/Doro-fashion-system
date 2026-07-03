export default function Boton({ 
  children, 
  onClick, 
  variante = "claro", 
  className = "",
  tipo = "button" 
}) {
  
  const baseClasses = "px-6 py-2 rounded-[2px] text-sm font-tag font-semibold uppercase tracking-[0.06em] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer";

  const estilos = {
    // Guardar, Aceptar, Nuevo, Exportar
    claro: "bg-[var(--snow)] text-[var(--gold-dark)] border border-[var(--border-gold-40)] hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:bg-[var(--gold)] dark:text-[var(--noir)] dark:border-[var(--gold)] dark:hover:bg-[var(--gold-light)] dark:hover:text-[var(--noir)]",
    
    // Eliminar, Cancelar
    oscuro: "bg-[var(--noir)] text-[var(--snow)] border border-[var(--noir)] hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-25)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]",
    
    // Para acciones secundarias (Cerrar, Ver detalles)
    secundario: "bg-[var(--gold-08)] text-[var(--gold-dark)] border border-[var(--border-gold-40)] hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold-15)]",
    
    // Sin fondo, solo texto 
    fantasma: "text-[var(--gold-dark)] hover:text-[var(--noir)] hover:bg-[var(--gold-08)] bg-transparent dark:text-[var(--ash)] dark:hover:text-[var(--gold-light)] dark:hover:bg-[var(--gold-08)]"
  };

  const estiloSeleccionado = estilos[variante] || estilos.claro;

  return (
    <button 
      type={tipo}
      onClick={onClick} 
      className={`${baseClasses} ${estiloSeleccionado} ${className}`}
    >
      {children}
    </button>
  );
}