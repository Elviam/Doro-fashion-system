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
        return "bg-[var(--gold-08)] text-[var(--gold-dark)] border-[var(--border-gold-55)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-40)]";
      
      case "GERENTE":
        return "bg-azul/20 text-blue-700 border-azul/50 dark:bg-azul/20 dark:text-azul dark:border-azul/30";
      
      case "BODEGUERO":
        return "bg-amarillo/25 text-yellow-700 border-amarillo/60 dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30";
      
      case "VENDEDOR":
        return "bg-naranja/20 text-orange-700 border-naranja/50 dark:bg-naranja/20 dark:text-naranja dark:border-naranja/30";
      
      case "CLIENTE":
        return "bg-rosa/20 text-pink-700 border-rosa/50 dark:bg-rosa/20 dark:text-rosa dark:border-rosa/30";
      
      default:
        return "bg-[var(--gold-08)] text-[var(--gold-dark)] border-[var(--border-gold-40)] dark:bg-[var(--gold-08)] dark:text-[var(--ash)] dark:border-[var(--border-gold-20)]";
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs lg:text-sm",
    md: "w-10 h-10 text-sm lg:text-base",
    xl: "w-24 h-24 text-3xl lg:text-4xl" 
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