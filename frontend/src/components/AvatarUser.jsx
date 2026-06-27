export default function AvatarUser({ nombre = "", apellido = "", rol = "", size = "md" }) {
  // Generar iniciales
  const getInitials = () => {
    const n = (nombre || "").charAt(0).toUpperCase();
    const a = (apellido || "").charAt(0).toUpperCase();
    return `${n}${a}`.slice(0, 2) || "US";
  };

  // Colores según el rol
  const getColorClass = () => {
    const rolNormalizado = (rol || "").toUpperCase();

    switch (rolNormalizado) {
      case "ADMIN":
      case "ROLE_ADMIN":
        return "bg-morado/20 text-morado border-morado/40 dark:bg-morado/30 dark:text-lila-soft dark:border-morado/50";
      
      case "GERENTE":
        return "bg-azul/30 text-azul border-azul/50 dark:bg-azul/20 dark:border-azul/30";
      
      case "BODEGUERO":
        return "bg-amarillo/40 text-amarillo border-amarillo/60 dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30";
      
      case "VENDEDOR":
        return "bg-naranja/30 text-naranja border-naranja/50 dark:bg-naranja/20 dark:text-naranja dark:border-naranja/30";
      
      case "CLIENTE":
        return "bg-rosa/30 text-rosa border-rosa/50 dark:bg-rosa/20 dark:text-rosa dark:border-rosa/30";
      
      default:
        return "bg-lila-soft/40 text-morado border-lila-soft/60 dark:bg-lila-soft/20 dark:text-lila-soft dark:border-lila-soft/30";
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    xl: "w-24 h-24 text-3xl" 
  };

  return (
    <div 
      className={`
        flex items-center justify-center rounded-full font-bold transition-colors shrink-0 border
        ${sizeClasses[size] || sizeClasses.md} 
        ${getColorClass()}
      `}
    >
      {getInitials()}
    </div>
  );
}