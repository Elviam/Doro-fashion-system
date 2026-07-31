import jsPDF from 'jspdf'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// Paleta clara D'ORO para exportaciones
const C = {
  headerBg: [247, 240, 230],  // #F7F0E6 ivory
  text:     [0, 0, 0],        // negro
  line:     [0, 0, 0],        // negro
}

function nombreArchivo(titulo) {
  const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g, '-')
  return `${titulo}-${fecha}`
}

export function exportarPDF(titulo, columnas, filas, { total } = {}) {
  const doc   = new jsPDF({ orientation: 'landscape' })
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(...C.headerBg)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.5)
  doc.line(0, 28, pageW, 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...C.text)
  doc.text(titulo.toUpperCase(), 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.text)
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW - 14, 18, { align: 'right' }
  )

  doc.autoTable({
    startY: 34,
    head: [columnas.map((c) => c.header)],
    body: filas.map((fila) => columnas.map((c) => fila[c.key] ?? '—')),
    ...(total ? { foot: [columnas.map((_, index) => index === columnas.length - 1 ? total : '')] } : {}),
    styles: {
      fillColor: [255, 255, 255],
      textColor: C.text,
      fontSize: 8,
      cellPadding: 4,
      halign: 'center',
      lineColor: C.line,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.headerBg,
      textColor: C.text,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      lineColor: C.line,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [251, 247, 240] },
    footStyles: {
      fillColor: C.headerBg,
      textColor: C.text,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: C.line,
      lineWidth: 0.2,
    },
    tableLineColor: C.line,
    tableLineWidth: 0.2,
  })

  // Pie de página
  const pages = doc.getNumberOfPages()
  const pageH = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...C.text)
    doc.text("D'ORO", 14, pageH - 6)
    doc.text(`Página ${i} de ${pages}`, pageW - 14, pageH - 6, { align: 'right' })
  }

  doc.save(`${nombreArchivo(titulo)}.pdf`)
}

export async function exportarExcel(titulo, columnas, filas, { total } = {}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "D'ORO"
  wb.created = new Date()

  const ws = wb.addWorksheet(titulo, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  ws.columns = columnas.map((c) => ({
    header: c.header,
    key:    c.key,
    width:  c.width || 22,
  }))

  // Estilo header
  const headerRow = ws.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F0E6' } }
    cell.font      = { bold: true, color: { argb: 'FF000000' }, size: 11, name: 'Calibri' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = {
      top:    { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      left:   { style: 'thin', color: { argb: 'FF000000' } },
      right:  { style: 'thin', color: { argb: 'FF000000' } },
    }
  })

  // Filas de datos
  filas.forEach((fila, idx) => {
    const row = ws.addRow(columnas.map((c) => fila[c.key] ?? '—'))
    row.height = 22
    const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFFBF7F0'
    row.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.font      = { color: { argb: 'FF000000' }, size: 10, name: 'Calibri' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border    = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      }
    })
  })

  if (total) {
    const totalRow = ws.addRow([total])
    totalRow.height = 24
    ws.mergeCells(totalRow.number, 1, totalRow.number, columnas.length)
    const cell = totalRow.getCell(1)
    cell.font = { bold: true, color: { argb: 'FF000000' }, size: 11, name: 'Calibri' }
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F0E6' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${nombreArchivo(titulo)}.xlsx`
  )
}
