import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// Paleta de la app en RGB
const C = {
  bg:      [34,  30,  58 ],   // #221E3A
  card:    [44,  42,  72 ],   // #2C2A48
  lila:    [86,  83,  142],   // #56538E
  text:    [231, 214, 255],   // #E7D6FF
  soft:    [201, 184, 232],   // #C9B8E8
  rowAlt:  [38,  35,  65 ],   // fila alternada
}

function nombreArchivo(titulo) {
  const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g, '-')
  return `${titulo}-${fecha}`
}

export function exportarPDF(titulo, columnas, filas) {
  const doc   = new jsPDF({ orientation: 'landscape' })
  const pageW = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(...C.bg)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setDrawColor(...C.lila)
  doc.setLineWidth(0.5)
  doc.line(0, 28, pageW, 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...C.text)
  doc.text(titulo.toUpperCase(), 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.soft)
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW - 14, 18, { align: 'right' }
  )

  autoTable(doc, {
    startY: 34,
    head: [columnas.map((c) => c.header)],
    body: filas.map((fila) => columnas.map((c) => fila[c.key] ?? '—')),
    styles: {
      fillColor: C.card,
      textColor: C.text,
      fontSize: 8,
      cellPadding: 4,
      halign: 'center',
    },
    headStyles: {
      fillColor: C.lila,
      textColor: C.text,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    tableLineColor: C.lila,
    tableLineWidth: 0.1,
  })

  // Pie de página
  const pages = doc.internal.getNumberOfPages()
  const pageH = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...C.soft)
    doc.text('AURA', 14, pageH - 6)
    doc.text(`Página ${i} de ${pages}`, pageW - 14, pageH - 6, { align: 'right' })
  }

  doc.save(`${nombreArchivo(titulo)}.pdf`)
}

export async function exportarExcel(titulo, columnas, filas) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'AURA'
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
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF56538E' } }
    cell.font      = { bold: true, color: { argb: 'FFE7D6FF' }, size: 11, name: 'Calibri' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FFA68DC8' } } }
  })

  // Filas de datos
  filas.forEach((fila, idx) => {
    const row = ws.addRow(columnas.map((c) => fila[c.key] ?? '—'))
    row.height = 22
    const bg = idx % 2 === 0 ? 'FF221E3A' : 'FF2C2A48'
    row.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
      cell.font      = { color: { argb: 'FFE7D6FF' }, size: 10, name: 'Calibri' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${nombreArchivo(titulo)}.xlsx`
  )
}
