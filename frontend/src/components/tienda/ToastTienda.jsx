import { useEffect } from "react";

const config = {
  error: {
    iconClass:   "bi bi-bag-x",
    borderColor: "border-rojo/40",
    iconBorder:  "border-rojo",
    iconColor:   "text-rojo",
    titleColor:  "text-rojo",
  },
  exito: {
    iconClass:   "bi bi-bag-check",
    borderColor: "border-verde/40",
    iconBorder:  "border-verde",
    iconColor:   "text-verde",
    titleColor:  "text-verde",
  },
  aviso: {
    iconClass:   "bi bi-exclamation",
    borderColor: "border-lila/40",
    iconBorder:  "border-lila",
    iconColor:   "text-lila",
    titleColor:  "text-lila",
  },
};

export default function ToastTienda({ toast, onCerrar }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onCerrar, 3500);
    return () => clearTimeout(t);
  }, [toast, onCerrar]);

  if (!toast) return null;

  const estilos = config[toast.tipo] ?? config.aviso;

  return (
    <div className="fixed bottom-6 right-6 z-[80] animate-fade-in-up">
      <div
        className={`relative w-72 bg-oscuro/95 border shadow-2xl backdrop-blur-sm p-6 ${estilos.borderColor}`}
      >
        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          className="absolute right-4 top-4 text-lila/50 hover:text-lila transition text-sm"
        >
          <i className="bi bi-x-lg" />
        </button>

        {/* Ícono */}
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-3 ${estilos.iconBorder} ${estilos.iconColor}`}>
          <i className={`${estilos.iconClass} text-lg`} />
        </div>

        {/* Título */}
        <h3 className={`font-poppins text-sm tracking-widest uppercase border-b pb-3 mb-3 leading-snug ${estilos.borderColor} ${estilos.titleColor}`}>
          {toast.titulo}
        </h3>

        {/* Mensaje */}
        {toast.mensaje && (
          <p className="font-poppins text-xs text-lila/70 leading-relaxed">
            {toast.mensaje}
          </p>
        )}

        {/* Botón de acción */}
        {toast.accion && (
          <button
            onClick={() => { toast.accion.onClick(); onCerrar(); }}
            className={`mt-4 text-xs font-bold tracking-widest uppercase border px-4 py-1.5 transition hover:bg-lila/10 ${estilos.borderColor} ${estilos.titleColor}`}
          >
            {toast.accion.label}
          </button>
        )}

        {/* Firma */}
        <div className="mt-5 font-cinzel tracking-widest text-base text-lila/60">
          A U R A
        </div>
      </div>
    </div>
  );
}
