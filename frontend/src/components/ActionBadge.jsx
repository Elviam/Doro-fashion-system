// Componente y configuración compartida para renderizar acciones de auditoría
// (CREATE / UPDATE / DELETE / TOGGLE_ACTIVE) con colores consistentes en todo el sistema.
// Usado por: Auditoria.jsx e Inventario.jsx (vista Kardex).

export const ACTION_CFG = {
  CREATE:        { label: "Creación",       colorClass: "bg-verde/10 border-verde/35 text-verde-dark dark:text-verde"       },
  UPDATE:        { label: "Actualización",  colorClass: "bg-amarillo/10 border-amarillo/35 text-amarillo-dark dark:text-amarillo" },
  DELETE:        { label: "Eliminación",    colorClass: "bg-rojo/10 border-rojo/35 text-rojo-dark dark:text-rojo"           },
  TOGGLE_ACTIVE: { label: "Cambio de estado", colorClass: "bg-azul/10 border-azul/35 text-azul-dark dark:text-azul"         },
  ADJUST:        { label: "Ajuste",         colorClass: "bg-azul/10 border-azul/35 text-azul-dark dark:text-azul"           },
  SEND:          { label: "Envío",          colorClass: "bg-azul/10 border-azul/35 text-azul-dark dark:text-azul"           },
  CONFIRM:       { label: "Confirmación",   colorClass: "bg-verde/10 border-verde/35 text-verde-dark dark:text-verde"       },
  CANCEL:        { label: "Cancelación",    colorClass: "bg-rojo/10 border-rojo/35 text-rojo-dark dark:text-rojo"           },
  CHANGE_PASSWORD: { label: "Cambio de contraseña", colorClass: "bg-amarillo/10 border-amarillo/35 text-amarillo-dark dark:text-amarillo" },
  SEED:          { label: "Inicialización", colorClass: "bg-gold/10 border-gold/35 text-gold-dark dark:text-gold-light" },
  RESET_PASSWORD: { label: "Restablecimiento de contraseña", colorClass: "bg-amarillo/10 border-amarillo/35 text-amarillo-dark dark:text-amarillo" },
};

const DEFAULT_CFG = {
  colorClass: "bg-gold/10 border-gold/35 text-gold-dark dark:text-gold-light",
};

export const RESOURCE_LABELS = {
  users: "Usuarios", clients: "Clientes", suppliers: "Proveedores", products: "Productos",
  recepciones: "Recepciones", inventory: "Inventario", roles: "Roles", permissions: "Permisos",
  ventas: "Ventas", fulfillment: "Preparaci\u00f3n de pedidos", auth: "Autenticaci\u00f3n",
};

export function getResourceLabel(resource, action) {
  if (resource === "auth" && ["CHANGE_PASSWORD", "RESET_PASSWORD"].includes(action)) return "Seguridad de cuenta";
  return RESOURCE_LABELS[resource] || resource || "Sin m\u00f3dulo";
}

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

export function ResourceBadge({ resource, action }) {
  const labels = { users: "Usuarios", clients: "Clientes", suppliers: "Proveedores", products: "Productos", recepciones: "Recepciones", inventory: "Inventario", roles: "Roles", permissions: "Permisos", ventas: "Ventas", fulfillment: "Preparación", auth: "Autenticación" };
  return (
    <span className="inline-block px-2 py-0.5 rounded-[2px] border text-xs font-tag font-medium bg-gold/10 border-gold/30 text-gold-dark dark:text-gold-light">
      {getResourceLabel(resource, action)}
    </span>
  );
}
