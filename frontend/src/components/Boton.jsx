export default function Boton({ 
  children, 
  onClick, 
  variante = "claro", 
  className = "",
  tipo = "button" 
}) {
  
  const baseClasses = "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer";

  const estilos = {
    // Guardar, Aceptar, Nuevo, Exportar
    claro: "bg-blanco text-oscuro border border-oscuro/20 hover:bg-oscuro hover:text-blanco dark:bg-lila dark:text-oscuro-card dark:border-lila dark:hover:bg-oscuro-card dark:hover:text-lila",
    
    // Eliminar, Cancelar
    oscuro: "bg-oscuro text-blanco border border-oscuro hover:bg-lila hover:text-oscuro dark:bg-oscuro-card dark:text-lila dark:border-lila dark:hover:bg-lila dark:hover:text-oscuro-card",
    
    // Para acciones secundarias (Cerrar, Ver detalles)
    secundario: "bg-lila text-morado border border-morado hover:bg-morado hover:text-blanco dark:bg-lila/10 dark:text-blanco dark:border-lila/20 dark:hover:bg-lila/30",
    
    // Sin fondo, solo texto 
    fantasma: "text-gris hover:text-oscuro hover:bg-gris/10 bg-transparent dark:text-lila-soft dark:hover:text-blanco dark:hover:bg-lila/10"
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