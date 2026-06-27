import { useState, useRef, useEffect } from 'react'
import { exportarPDF, exportarExcel } from '../services/exportService'

export default function Paginacion({
  paginaActual   = 1,
  totalRegistros = 0,
  rangoSiguiente = "1 – 5",
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

  const getPaginas = () => {
    if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, i) => String(i + 1))
    const paginas = []
    if (paginaActual <= 3) {
      paginas.push("1", "2", "3", "4", "...", String(totalPaginas))
    } else if (paginaActual >= totalPaginas - 2) {
      paginas.push("1", "...", String(totalPaginas - 3), String(totalPaginas - 2), String(totalPaginas - 1), String(totalPaginas))
    } else {
      paginas.push("1", "...", String(paginaActual - 1), String(paginaActual), String(paginaActual + 1), "...", String(totalPaginas))
    }
    return paginas
  }

  const paginas  = getPaginas()
  const esPrimera = paginaActual === 1
  const esUltima  = paginaActual === totalPaginas

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">

      {/* Botón Exportar con dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMostrarMenu((v) => !v)}
          disabled={exportando}
          className="bg-transparent text-lila-soft border border-lila/20 rounded-lg px-5 py-2 font-bold cursor-pointer hover:bg-lila hover:text-oscuro transition-all active:scale-95 w-full sm:w-auto flex items-center gap-2"
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
          <div
            className="absolute left-0 bottom-full mb-2 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[160px]"
            style={{ backgroundColor: "#2C2A48", border: "1px solid #56538E" }}
          >
            <button
              onClick={() => handleExportar('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ color: "#E7D6FF" }}
            >
              <i className="bi bi-file-earmark-pdf text-base" style={{ color: "#e05c5c" }} />
              Exportar PDF
            </button>
            <div style={{ height: "1px", backgroundColor: "rgba(86,83,142,0.4)" }} />
            <button
              onClick={() => handleExportar('excel')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ color: "#E7D6FF" }}
            >
              <i className="bi bi-file-earmark-excel text-base" style={{ color: "#8DB051" }} />
              Exportar Excel
            </button>
          </div>
        )}
      </div>

      {/* Contador */}
      <span className="text-text-muted text-sm font-medium">
        {rangoSiguiente} de {totalRegistros.toLocaleString()}
      </span>

      {/* Botones de navegación */}
      <div className="flex gap-2">
        <button
          onClick={() => !esPrimera && onCambiarPagina("‹")}
          disabled={esPrimera}
          className="w-9 h-9 rounded-lg font-bold transition-all flex items-center justify-center border border-lila/20 text-lila-soft disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lila hover:text-oscuro active:scale-90"
        >
          ‹
        </button>

        {paginas.map((p, i) =>
          p === "..." ? (
            <span key={i} className="w-9 h-9 flex items-center justify-center text-lila-soft opacity-50 text-sm">
              ...
            </span>
          ) : (
            <button
              key={i}
              onClick={() => onCambiarPagina(p)}
              className={`w-9 h-9 rounded-lg font-bold transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${
                p === String(paginaActual)
                  ? "bg-lila text-oscuro border-none"
                  : "bg-transparent text-lila-soft border border-lila/20 hover:bg-lila hover:text-oscuro"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => !esUltima && onCambiarPagina("›")}
          disabled={esUltima}
          className="w-9 h-9 rounded-lg font-bold transition-all flex items-center justify-center border border-lila/20 text-lila-soft disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lila hover:text-oscuro active:scale-90"
        >
          ›
        </button>
      </div>
      
    </div>
  )
}
