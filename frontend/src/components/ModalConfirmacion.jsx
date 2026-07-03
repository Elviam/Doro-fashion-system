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
      borderColor: "border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]",
      iconBorder:  "border-[var(--gold)]",
      iconColor:   "text-[var(--gold-dark)] dark:text-[var(--gold-light)]",
      titleColor:  "text-[var(--gold-dark)] dark:text-[var(--gold-light)]",
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
    borderColor: "border-[var(--border-gold-40)]",
    iconBorder: "border-[var(--gold)]",
    iconColor: "text-[var(--gold-dark)]",
    titleColor: "text-[var(--gold-dark)]",
  };

  const esExito = tipo === "exito";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-sm transition-colors duration-300 bg-[var(--noir)]/40 dark:bg-black/60"
      onClick={onCancelar}
    >
      <div
        className={`relative w-full max-w-sm border shadow-2xl p-8 sm:p-10 transition-colors duration-300 rounded-[2px] bg-[var(--snow)]/95 dark:bg-[var(--noir)]/90 ${config.borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancelar}
          className="absolute right-6 top-6 transition-colors text-xl cursor-pointer text-[var(--noir-soft)]/70 hover:text-[var(--noir-soft)] dark:text-[var(--ash)] dark:hover:text-[var(--snow)]"
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
        <h2 className={`font-tag text-2xl lg:text-3xl tracking-widest border-b pb-4 mb-6 leading-snug uppercase transition-colors border-[var(--border-gold-25)] ${config.titleColor}`}>
          {titulo}
        </h2>

        {mensaje && (
          <p className="font-body text-base lg:text-lg leading-relaxed mb-6 transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]">
            {mensaje}
          </p>
        )}

        {!esExito && (
          <div className="flex gap-3 mt-8">
            <Boton
              variante="secundario"
              onClick={onCancelar}
              className="flex-1 font-tag h-11 uppercase tracking-widest text-xs lg:text-sm transition-colors"
            >
              {textoCancelar}
            </Boton>
            
            {tipo === "eliminar" ? (
              <button
                onClick={onConfirmar}
                className="flex-1 h-11 bg-transparent font-tag text-xs lg:text-sm tracking-widest uppercase transition-colors rounded-[2px] cursor-pointer border border-rojo/60 text-rojo hover:bg-rojo hover:text-[var(--snow)]"
              >
                {textoConfirmar}
              </button>
            ) : (
              <Boton
                variante="claro"
                onClick={onConfirmar}
                className="flex-1 font-tag h-11 uppercase tracking-widest text-xs lg:text-sm"
              >
                {textoConfirmar}
              </Boton>
            )}
          </div>
        )}

        {/* Firma DORO */}
        <div className="mt-10 font-display tracking-widest text-xl lg:text-2xl transition-colors text-[var(--noir-soft)] dark:text-[var(--gold-light)]">
          D'ORO
        </div>
      </div>
    </div>
  );
}