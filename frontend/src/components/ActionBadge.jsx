// Componente y configuración compartida para renderizar acciones de auditoría
// (CREATE / UPDATE / DELETE / TOGGLE_ACTIVE) con colores consistentes en todo el sistema.
// Usado por: Auditoria.jsx e Inventario.jsx (vista Kardex).

export const ACTION_CFG = {
  CREATE:        { label: "CREATE",  colorClass: "bg-verde/10 border-verde/35 text-verde-dark dark:text-verde"       },
  UPDATE:        { label: "UPDATE",  colorClass: "bg-amarillo/10 border-amarillo/35 text-amarillo-dark dark:text-amarillo" },
  DELETE:        { label: "DELETE",  colorClass: "bg-rojo/10 border-rojo/35 text-rojo-dark dark:text-rojo"           },
  TOGGLE_ACTIVE: { label: "TOGGLE",  colorClass: "bg-azul/10 border-azul/35 text-azul-dark dark:text-azul"           },
};

const DEFAULT_CFG = {
  colorClass: "bg-gold/10 border-gold/35 text-gold-dark dark:text-gold-light",
};

// Términos de negocio para contextos de inventario (Kardex)
export const ACTION_TO_TEXT = {
  CREATE:        "Entrada",
  UPDATE:        "Ajuste",
  DELETE:        "Salida",
  TOGGLE_ACTIVE: "Cambio de estado",
};

export function ActionBadge({ action, className = "" }) {
  const cfg = ACTION_CFG[action] || { label: action, ...DEFAULT_CFG };
  const colorClass = cfg.colorClass || DEFAULT_CFG.colorClass;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] border text-xs font-tag font-semibold ${colorClass} ${className}`}>
      {cfg.label}
    </span>
  );
}

export function ResourceBadge({ resource }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-[2px] border text-xs font-tag font-medium bg-gold/10 border-gold/30 text-gold-dark dark:text-gold-light">
      {resource}
    </span>
  );
}