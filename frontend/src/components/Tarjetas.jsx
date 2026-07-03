export default function Tarjetas({ label, value, sub, accent = "#C9A84C", icon, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 rounded-[2px] p-5 shadow-lg hover:-translate-y-1 transition-all duration-300 w-full border font-body
        ${onClick ? "cursor-pointer hover:bg-[var(--gold-08)] dark:hover:bg-[var(--gold-08)]" : ""} 
        ${isActive
          ? "bg-[var(--gold-15)] border-[var(--border-gold-55)] shadow-xl shadow-[var(--gold-15)] text-[var(--noir)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-40)] dark:shadow-[var(--gold-15)] dark:text-[var(--snow)]"
          : "bg-[var(--snow)] border-[var(--border-gold-20)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]"}
      `}
      style={{ borderLeft: `7px solid ${accent}` }}
    >
      {/* Etiqueta e Ícono  */}
      <div className="flex justify-between items-center mb-2">
        <p className="m-0 text-xs lg:text-sm font-tag font-medium uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--gold-light)]">
          {label}
        </p>
        
        {icon && (
          typeof icon === "string" ? (
            <i className={`${icon} text-lg lg:text-xl text-[var(--gold-dark)] dark:text-[var(--gold)]`}></i>
          ) : (
            icon
          )
        )}
      </div>
      
      {/* Valor principal */}
      <p className="my-1.5 text-3xl lg:text-4xl font-display font-medium text-[var(--noir)] dark:text-[var(--snow)] tracking-tight">
        {value}
      </p>
      
      {/* Subtexto */}
      <p className="m-0 text-sm lg:text-xs font-medium text-[var(--noir-soft)] dark:text-[var(--ash)]">
        {sub}
      </p>
    </div>
  );
}