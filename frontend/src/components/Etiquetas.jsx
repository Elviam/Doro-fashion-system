export default function Etiquetas({ contenido }) {
  
  const estilos = {
    // --- ESTADOS ---
    Activo: `
      bg-verde/30 text-verde border-verde/50 
      dark:bg-verde/20 dark:border-verde/30
    `,

    Confirmado: `
      bg-verde/30 text-verde border-verde/50 
      dark:bg-verde/20 dark:border-verde/30
    `,
    
    Inactivo: `
      bg-rojo/30 text-rojo border-rojo/50 
      dark:bg-rojo/20 dark:border-rojo/30
    `,

    Cancelado: `
      bg-rojo/30 text-rojo border-rojo/50 
      dark:bg-rojo/20 dark:border-rojo/30
    `,
    
    Pendiente: `
      bg-amarillo/40 text-amarillo border-amarillo/60 
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    Draft: `
      bg-amarillo/40 text-amarillo border-amarillo/60 
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    // --- ESTADOS VENTAS ---
    pendiente: `
      bg-amarillo/40 text-amarillo border-amarillo/60 
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    pagado: `
      bg-verde/30 text-verde border-verde/50 
      dark:bg-verde/20 dark:border-verde/30
    `,

    enviado: `
      bg-azul/30 text-azul border-azul/50 
      dark:bg-azul/20 dark:border-azul/30
    `,

    entregado: `
      bg-verde/30 text-verde border-verde/50 
      dark:bg-verde/20 dark:border-verde/30
    `,

    cancelado: `
      bg-rojo/30 text-rojo border-rojo/50 
      dark:bg-rojo/20 dark:border-rojo/30
    `,

    // --- ROLES ---
    Admin: `
      bg-morado/20 text-morado border-morado/40 
      dark:bg-morado/30 dark:text-lila-soft dark:border-morado/50
    `,

    GERENTE: `
      bg-azul/30 text-azul border-azul/50 
      dark:bg-azul/20 dark:border-azul/30
    `,

    BODEGUERO: `
      bg-amarillo/40 text-amarillo border-amarillo/60 
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    VENDEDOR: `
      bg-naranja/30 text-naranja border-naranja/50 
      dark:bg-naranja/20 dark:text-naranja dark:border-naranja/30
    `,

    CLIENTE: `
      bg-rosa/30 text-rosa border-rosa/50 
      dark:bg-rosa/20 dark:text-rosa dark:border-rosa/30
    `,

    Cliente: `
      bg-rosa/30 text-rosa border-rosa/50 
      dark:bg-rosa/20 dark:text-rosa dark:border-rosa/30
    `,

    // --- DEFAULT ---
    Default: `
      bg-lila-soft/40 text-morado border-lila-soft/60 
      dark:bg-lila-soft/20 dark:text-lila-soft dark:border-lila-soft/30
    `
  };

  const clasesActuales = estilos[contenido] || estilos.Default;

  return (
    <span
      className={`
        inline-block w-28 text-center py-1 rounded-full text-xs uppercase tracking-wider border shadow-sm transition-colors duration-300
        font-semibold 
        dark:font-normal 
        ${clasesActuales}
      `}
    >
      {contenido}
    </span>
  );
}