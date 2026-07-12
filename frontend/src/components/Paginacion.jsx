import { useState, useRef, useEffect } from 'react'
import { exportarPDF, exportarExcel } from '../services/exportService'

export default function Paginacion({
  paginaActual   = 1,
  totalRegistros = 0,
  limit          = 7,
  onCambiarPagina,
  exportTitulo   = "Reporte",
  exportColumnas = [],
  exportFilas    = [],
}) {
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [exportando,  setExportando]  = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMostrarMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExportar = async (formato) => {
    setMostrarMenu(false)
    setExportando(true)
    try {
      if (formato === 'pdf') exportarPDF(exportTitulo, exportColumnas, exportFilas)
      else                   await exportarExcel(exportTitulo, exportColumnas, exportFilas)
    } finally {
      setExportando(false)
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limit))
  const esPrimera = paginaActual === 1
  const esUltima  = paginaActual === totalPaginas

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 font-body">

      {/* Botón Exportar con dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMostrarMenu((v) => !v)}
          disabled={exportando}
          className="bg-transparent text-[var(--noir-soft)] border border-[var(--border-gold-40)] rounded-[2px] px-5 py-2 h-11 font-bold text-sm lg:text-base cursor-pointer hover:bg-[var(--gold)] hover:text-[var(--noir)] transition-all active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2 dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]"
        >
          {exportando ? (
            <>
              <i className="bi bi-arrow-repeat animate-spin text-sm" />
              Exportando...
            </>
          ) : (
            <>
              <i className="bi bi-download text-sm" />
              Exportar
              <i className={`bi bi-chevron-${mostrarMenu ? 'up' : 'down'} text-xs`} />
            </>
          )}
        </button>

        {mostrarMenu && (
          <div className="absolute left-0 bottom-full mb-2 rounded-[2px] overflow-hidden shadow-2xl z-50 min-w-[170px] bg-[var(--snow)] border border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
            <button
              onClick={() => handleExportar('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm lg:text-base font-semibold transition-colors hover:bg-[var(--gold-08)] text-[var(--noir-soft)] dark:text-[var(--snow)]"
            >
              <i className="bi bi-file-earmark-pdf text-base text-red-600 dark:text-rojo" />
              Exportar PDF
            </button>
            <div className="h-px bg-[var(--border-gold-20)]" />
            <button
              onClick={() => handleExportar('excel')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm lg:text-base font-semibold transition-colors hover:bg-[var(--gold-08)] text-[var(--noir-soft)] dark:text-[var(--snow)]"
            >
              <i className="bi bi-file-earmark-excel text-base text-green-600 dark:text-verde" />
              Exportar Excel
            </button>
          </div>
        )}
      </div>

      {/* Navegación simplificada */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => !esPrimera && onCambiarPagina("‹")}
          disabled={esPrimera}
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-[2px] font-bold text-sm lg:text-base transition-all flex items-center justify-center border border-[var(--border-gold-40)] text-[var(--noir-soft)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--gold)] hover:text-[var(--noir)] active:scale-90 dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]"
        >
          ‹
        </button>

        <span className="text-[var(--noir-soft)] dark:text-[var(--snow)] text-sm lg:text-base font-semibold whitespace-nowrap px-1">
          Página {paginaActual} de {totalPaginas}
        </span>

        <button
          onClick={() => !esUltima && onCambiarPagina("›")}
          disabled={esUltima}
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-[2px] font-bold text-sm lg:text-base transition-all flex items-center justify-center border border-[var(--border-gold-40)] text-[var(--noir-soft)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--gold)] hover:text-[var(--noir)] active:scale-90 dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]"
        >
          ›
        </button>
      </div>
      
    </div>
  )
}