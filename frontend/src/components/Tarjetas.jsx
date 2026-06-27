export default function Tarjetas({ label, value, sub, accent = "#7C6AF7", icon, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 rounded-xl p-6 shadow-lg hover:-translate-y-1 transition-all duration-300 w-full border
        ${onClick ? "cursor-pointer hover:bg-lila/70 dark:hover:bg-oscuro/30" : ""} 
        ${isActive ? "bg-lila/70 border-lila-soft shadow-xl shadow-lila-soft/60 text-morado dark:bg-oscuro dark:border-lila/50 dark:shadow-lila/40 dark:text-blanco" : "bg-blanco border-gris/20 text-morado dark:bg-bg-card dark:border-lila/20 dark:text-blanco"}
      `}
      style={{ borderLeft: `8px solid ${accent}` }}
    >
      {/* Etiqueta e Ícono  */}
      <div className="flex justify-between items-center mb-2">
        <p className={`m-0 text-sm font-medium uppercase tracking-wider ${isActive ? "text-morado dark:text-lila-soft" : "text-morado dark:text-lila-soft"}`}>
          {label}
        </p>
        
        {icon && (
          typeof icon === "string" ? (
            <i className={`${icon} text-xl ${isActive ? "text-morado dark:text-lila-mid" : "text-morado dark:text-lila-mid"}`}></i>
          ) : (
            icon
          )
        )}
      </div>
      
      {/* Valor principal */}
      <p className={`my-2 text-3xl lg:text-4xl font-bold ${isActive ? "text-oscuro dark:text-blanco" : "text-oscuro dark:text-blanco"} tracking-tight`}>
        {value}
      </p>
      
      {/* Subtexto */}
      <p className={`m-0 text-xs font-medium ${isActive ? "text-gris dark:text-text-muted" : "text-gris dark:text-text-muted"}`}>
        {sub}
      </p>
    </div>
  );
}