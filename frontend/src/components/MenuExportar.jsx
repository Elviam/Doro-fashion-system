import { useEffect, useRef, useState } from "react";
import { exportarExcel, exportarPDF } from "../services/exportService";

export default function MenuExportar({ titulo, columnas, filas, resumen }) {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [exportando, setExportando] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const cerrarAlHacerClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMostrarMenu(false);
    };
    document.addEventListener("mousedown", cerrarAlHacerClickFuera);
    return () => document.removeEventListener("mousedown", cerrarAlHacerClickFuera);
  }, []);

  const exportar = async (formato) => {
    setMostrarMenu(false);
    setExportando(true);
    try {
      if (formato === "pdf") exportarPDF(titulo, columnas, filas, resumen);
      else await exportarExcel(titulo, columnas, filas, resumen);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="relative w-fit" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMostrarMenu((visible) => !visible)}
        disabled={exportando}
        className="flex h-11 items-center justify-center gap-2 rounded-[2px] border border-[var(--border-gold-40)] bg-transparent px-5 text-sm font-bold text-[var(--noir-soft)] transition-all hover:bg-[var(--gold)] hover:text-[var(--noir)] active:scale-95 dark:border-[var(--border-gold-20)] dark:text-[var(--snow)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]"
      >
        {exportando ? <i className="bi bi-arrow-repeat animate-spin text-sm" /> : <i className="bi bi-download text-sm" />}
        {exportando ? "Exportando..." : "Exportar"}
        {!exportando && <i className={`bi bi-chevron-${mostrarMenu ? "up" : "down"} text-xs`} />}
      </button>
      {mostrarMenu && (
        <div className="absolute bottom-full left-0 z-50 mb-2 min-w-[170px] overflow-hidden rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] shadow-2xl dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)]">
          <button type="button" onClick={() => exportar("pdf")} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--noir-soft)] transition-colors hover:bg-[var(--gold-08)] dark:text-[var(--snow)]">
            <i className="bi bi-file-earmark-pdf text-base text-red-600 dark:text-rojo" /> Exportar PDF
          </button>
          <div className="h-px bg-[var(--border-gold-20)]" />
          <button type="button" onClick={() => exportar("excel")} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--noir-soft)] transition-colors hover:bg-[var(--gold-08)] dark:text-[var(--snow)]">
            <i className="bi bi-file-earmark-excel text-base text-green-600 dark:text-verde" /> Exportar Excel
          </button>
        </div>
      )}
    </div>
  );
}
