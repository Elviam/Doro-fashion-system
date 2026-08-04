export default function Etiquetas({ contenido }) {
  
  const estilos = {
    // --- ESTADOS ---
    Activo: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

    Confirmado: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

    Enviado: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

    Enviada: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

    "Por confirmar": `
      bg-amarillo/40 text-[var(--gold-dark)] border-[var(--gold-dark)]/50
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    Cancelada: `
      bg-red-600/15 text-red-700 border-red-600/60
      dark:bg-rojo/20 dark:text-rojo dark:border-rojo/30
    `,
    
    Inactivo: `
      bg-red-600/15 text-red-700 border-red-600/60
      dark:bg-rojo/20 dark:text-rojo dark:border-rojo/30
    `,

    Cancelado: `
      bg-red-600/15 text-red-700 border-red-600/60
      dark:bg-rojo/20 dark:text-rojo dark:border-rojo/30
    `,
    
    Pendiente: `
      bg-amarillo/40 text-[var(--color-amarillo-dark)] border-[var(--color-amarillo-dark)]/60
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    Draft: `
      bg-amarillo/40 text-amarillo border-amarillo/60 
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    "En borrador": `
      bg-amarillo/40 text-[var(--color-amarillo-dark)] border-[var(--color-amarillo-dark)]/60
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    Recibido: `
      bg-azul/10 text-[var(--color-azul-dark)] border-[var(--color-azul-dark)]/40
      dark:bg-azul/20 dark:text-azul dark:border-azul/30
    `,

    // --- ESTADOS VENTAS ---
    pendiente: `
      bg-amarillo/40 text-[var(--color-amarillo-dark)] border-[var(--color-amarillo-dark)]/60
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    PENDIENTE: `
      bg-amarillo/40 text-[var(--color-amarillo-dark)] border-[var(--color-amarillo-dark)]/60
      dark:bg-amarillo/20 dark:text-amarillo dark:border-amarillo/30
    `,

    pagado: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

    PAGADO: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

   enviado: `
    bg-azul/20 text-azul-dark border-azul-dark
    dark:bg-azul/20 dark:text-azul dark:border-azul/40
  `,

  ENVIADO: `
    bg-azul/20 text-azul-dark border-azul-dark
    dark:bg-azul/20 dark:text-azul dark:border-azul/40
  `,

    entregado: `
      bg-green-600/15 text-green-700 border-green-600/60
      dark:bg-verde/20 dark:text-verde dark:border-verde/30
    `,

    cancelado: `
      bg-red-600/15 text-red-700 border-red-600/60
      dark:bg-rojo/20 dark:text-rojo dark:border-rojo/30
    `,

    CANCELADO: `
      bg-red-600/15 text-red-700 border-red-600/60
      dark:bg-rojo/20 dark:text-rojo dark:border-rojo/30
    `,

    // --- ROLES ---
    Admin: `
      bg-amarillo/60 text-[var(--gold-dark)] border-[var(--gold)] font-bold
      dark:bg-amarillo/30 dark:text-white dark:border-[var(--gold)]
    `,
    ADMIN: `
      bg-amarillo/60 text-negro border-[var(--gold)] font-bold
      dark:bg-amarillo/30 dark:text-white dark:border-[var(--gold)]
    `,

    GERENTE: `
      bg-blue-700/20 text-blue-800 border-blue-700/60
      dark:bg-azul/20 dark:text-azul dark:border-azul/30
    `,

    BODEGUERO: `
      bg-gris/20 text-gris/100 border-gris/60 
      dark:bg-gris/20 dark:text-negro dark:border-gris/30
    `,

    VENDEDOR: `
      bg-orange-300/25 text-orange-800 border-orange-700/60
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
      bg-[var(--gold)]/15 text-[var(--gold-dark)] border-[var(--border-gold-40)] 
      dark:bg-[var(--gold-08)] dark:text-[var(--ash)] dark:border-[var(--border-gold-20)]
    `
  };

  const clasesActuales = estilos[contenido] || estilos.Default;

  return (
    <span
      className={`
        inline-block w-28 lg:w-32 text-center py-1 lg:py-1.5 rounded-[2px] text-xs lg:text-sm uppercase tracking-wider border shadow-sm transition-colors duration-300
        font-tag font-semibold
        ${clasesActuales}
      `}
    >
      {contenido}
    </span>
  );
}
