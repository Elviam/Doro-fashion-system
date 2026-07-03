export default function BarraCategorias({ productosDB }) {

  const totalProd = productosDB.length;

  const superioresCant = productosDB.filter(p => 
    ["Playeras", "Blusas", "Camisas", "Suéteres", "Sudaderas", "Chamarras", "Abrigos", "Vestidos"].includes(p.categoria)
  ).length;

  const inferioresCant = productosDB.filter(p => 
    ["Pantalones", "Faldas", "Shorts"].includes(p.categoria)
  ).length;

  const calzadoCant = productosDB.filter(p => p.categoria === "Calzado").length;
  const accesoriosCant = totalProd - (superioresCant + inferioresCant + calzadoCant);

  const superioresPorc = totalProd > 0 ? Math.round((superioresCant / totalProd) * 100) : 0;
  const inferioresPorc = totalProd > 0 ? Math.round((inferioresCant / totalProd) * 100) : 0;
  const calzadoPorc = totalProd > 0 ? Math.round((calzadoCant / totalProd) * 100) : 0;

  const accesoriosPorc = totalProd > 0 ? Math.max(0, 100 - (superioresPorc + inferioresPorc + calzadoPorc)) : 0;

  const tooltipBaseClasses = "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--gold-light)] text-[var(--noir)] dark:bg-[var(--noir)] dark:text-[var(--snow)] text-xs px-2.5 py-1 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none";
  
  const segmentos = [
    { width: superioresPorc, color: "bg-azul", label: `Superiores: ${superioresCant} (${superioresPorc}%)` },
    { width: inferioresPorc, color: "bg-rosa", label: `Inferiores: ${inferioresCant} (${inferioresPorc}%)` },
    { width: calzadoPorc, color: "bg-verde", label: `Calzado: ${calzadoCant} (${calzadoPorc}%)` },
    { width: accesoriosPorc, color: "bg-naranja", label: `Accesorios: ${accesoriosCant} (${accesoriosPorc}%)` }
  ];

  return (
    <div className="bg-[var(--snow)] rounded-[2px] p-5 border border-[var(--border-gold-40)] shadow-lg relative w-full text-[var(--noir)] flex flex-col justify-center transition-colors duration-300 dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]">
      <p className="m-0 text-xs lg:text-sm font-tag text-[var(--gold-dark)] dark:text-[var(--gold-light)] uppercase tracking-wide">Productos por Categoría</p>
      
      {/* Barra de colores */}
      <div className="flex h-6 mt-4 w-full overflow-visible font-medium text-white rounded-[2px]">
        {segmentos.map((segment, idx) => (
          segment.width > 0 && (
            <div 
              key={idx} 
              style={{ width: `${segment.width}%` }} 
              className={`${segment.color} group relative cursor-help transition-all duration-300 hover:opacity-80`}
            >
              <span className={tooltipBaseClasses}>{segment.label}</span>
            </div>
          )
        ))}
      </div>

      {/* Porcentajes inferiores */}
      <div className="flex justify-between text-[11px] lg:text-xs text-[var(--noir-soft)] mt-2.5 font-medium transition-colors duration-300 dark:text-[var(--ash)]">
        {segmentos.map((segment, idx) => (
          segment.width > 0 && (
            <span key={idx} style={{ width: `${segment.width}%` }} className="text-center truncate px-1">
              {segment.width}%
            </span>
          )
        ))}
      </div>
    </div>
  );
}