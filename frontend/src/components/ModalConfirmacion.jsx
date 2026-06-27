import { useEffect } from "react";
import Boton from "./Boton";

/**
 * Props:
 * - isOpen: boolean
 * - tipo: 'exito' | 'confirmar' | 'eliminar'
 * - titulo: string
 * - mensaje: string (opcional)
 * - textoConfirmar: string
 * - textoCancelar: string (default 'Cancelar')
 * - onConfirmar: () => void
 * - onCancelar: () => void
 * - cargando: boolean
 */
export default function ModalConfirmacion({
  isOpen = false,
  tipo = "confirmar",
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const h = (e) => {
      if (e.key === "Escape") onCancelar?.();
    };

    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onCancelar]);

  if (!isOpen) return null;

  const config = {
    exito: {
      iconClass: "bi bi-check-lg",
      borderColor: "border-verde/40",
      iconBorder: "border-verde",
      iconColor: "text-verde",
      titleColor: "text-verde",
    },
    confirmar: {
      iconClass:   "bi bi-exclamation",
      borderColor: "border-morado/30 dark:border-lila/30",
      iconBorder:  "border-morado dark:border-lila",
      iconColor:   "text-morado dark:text-lila",
      titleColor:  "text-morado dark:text-lila",
    },
    eliminar: {
      iconClass:   "bi bi-trash",
      borderColor: "border-rojo/40",
      iconBorder:  "border-rojo",
      iconColor:   "text-rojo",
      titleColor:  "text-rojo",
    },
  }[tipo] || {
    iconClass: "bi bi-exclamation",
    borderColor: "border-lila/30",
    iconBorder: "border-lila",
    iconColor: "text-lila",
    titleColor: "text-lila",
  };

  const esExito = tipo === "exito";

  return (
    <div
      className={`
        fixed inset-0 z-120 flex items-center justify-center p-4 backdrop-blur-sm transition-colors duration-300
        bg-oscuro/40
        dark:bg-black/60
      `}
      onClick={onCancelar}
    >
      <div
        className={`
          relative w-full max-w-sm border shadow-2xl p-8 sm:p-10 transition-colors duration-300
          bg-blanco/90 ${config.borderColor}
          dark:bg-oscuro/80 dark:${config.borderColor}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancelar}
          className={`
            absolute right-6 top-6 transition-colors text-xl cursor-pointer
            text-morado/60 hover:text-morado
            dark:text-lila/60 dark:hover:text-lila
          `}
          aria-label="Cerrar modal"
          disabled={cargando}
        >
          <i className="bi bi-x-lg text-lg"></i>
        </button>

        <div
          className={`w-14 h-14 rounded-full border flex items-center justify-center mb-4 ${config.iconBorder} ${config.iconColor}`}
        >
          <i className={`${config.iconClass} text-2xl`}></i>
        </div>

        {/* Título */}
        <h2 className={`
          font-poppins text-2xl tracking-widest border-b pb-4 mb-6 leading-snug uppercase transition-colors
          border-morado/30 ${config.titleColor}
          dark:border-lila/30 dark:${config.titleColor}
        `}>
          {titulo}
        </h2>

        {mensaje && (
          <p className={`
            font-poppins text-md leading-relaxed mb-6 transition-colors
            text-morado/80
            dark:text-lila/80
          `}>
            {mensaje}
          </p>
        )}

        {!esExito && (
          <div className="flex gap-3 mt-8">
            <Boton
              variante="secundario"
              onClick={onCancelar}
              className="flex-1 font-poppins h-11 uppercase tracking-widest text-xs transition-colors"
            >
              {textoCancelar}
            </Boton>
            
            {tipo === "eliminar" ? (
              <button
                onClick={onConfirmar}
                className={`
                  flex-1 h-11 bg-transparent font-poppins text-xs tracking-widest uppercase transition-colors rounded-lg cursor-pointer
                  border border-rojo/60 text-rojo hover:bg-rojo hover:text-blanco
                `}
              >
                {textoConfirmar}
              </button>
            ) : (
              <Boton
                variante="claro"
                onClick={onConfirmar}
                className="flex-1 font-poppins h-11 uppercase tracking-widest text-xs"
              >
                {textoConfirmar}
              </Boton>
            )}
          </div>
        )}

        {/* Firma AURA */}
        <div className={`
          mt-10 font-cinzel tracking-widest text-xl transition-colors
          text-morado/90
          dark:text-lila/90
        `}>
          A U R A
        </div>
      </div>
    </div>
  );
}