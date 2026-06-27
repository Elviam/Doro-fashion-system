import jsPDF from "jspdf";

const ANCHO  = 80;
const MARGEN = 6;

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora  = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return `${fecha}  ${hora}`;
};

const linea = (doc, y) => {
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text("-".repeat(42), MARGEN, y);
  return y + 4;
};

const centrado = (doc, texto, y, bold = false, size = 8) => {
  doc.setFont("courier", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.text(texto, ANCHO / 2, y, { align: "center" });
  return y + size * 0.45;
};

const fila = (doc, izq, der, y, boldDer = false, size = 7.5) => {
  doc.setFont("courier", "normal");
  doc.setFontSize(size);
  doc.text(izq, MARGEN, y);
  doc.setFont("courier", boldDer ? "bold" : "normal");
  doc.text(der, ANCHO - MARGEN, y, { align: "right" });
  return y + size * 0.45 + 1.5;
};

function marcaDeAgua(doc, altura) {
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(181, 181, 181);

  const texto   = "A U R A";
  const espacioX = 20;
  const espacioY = 20;
  const angulo   = 35;

  for (let y = -10; y < altura + 20; y += espacioY) {
    for (let x = -5; x < ANCHO + 20; x += espacioX) {
      doc.text(texto, x, y, { angle: angulo });
    }
  }

  doc.setTextColor(0, 0, 0);
}

export function generarTicket(venta) {
  const numItems    = (venta.items ?? []).length;
  const alturaBase  = 175;
  const alturaTotal = alturaBase + numItems * 16;

  const doc = new jsPDF({ unit: "mm", format: [ANCHO, alturaTotal] });

  marcaDeAgua(doc, alturaTotal);

  doc.setTextColor(0, 0, 0);

  let y = 10;

  // ── Nombre de la tienda ──────────────────────────────────────
  doc.setFont("courier", "bold");
  doc.setFontSize(26);
  doc.text("AURA", ANCHO / 2, y, { align: "center" });
  y += 9;

  y = centrado(doc, "B O U T I Q U E", y, false, 8);
  y += 3;
  y = centrado(doc, "CDMX, MEXICO", y, false, 7);
  y += 2;
  y = centrado(doc, "contacto@auraboutique.mx", y, false, 7);
  y += 5;

  y = linea(doc, y);
  y += 1;

  // ── Fecha y número de pedido ─────────────────────────────────
  y = fila(doc, fmtFecha(venta.createdAt), venta.numeroPedido || `#${venta.id.slice(0, 8).toUpperCase()}`, y, true, 7.5);
  y += 1;

  y = linea(doc, y);
  y += 1;

  // ── Datos del cliente ────────────────────────────────────────
  y = centrado(doc, "DATOS DE ENVIO", y, true, 7.5);
  y += 3;

  const cliente = venta.cliente ?? {};
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);

  if (cliente.nombre) { doc.text(cliente.nombre, ANCHO / 2, y, { align: "center" }); y += 4; }
  if (cliente.email)  { doc.text(cliente.email,  ANCHO / 2, y, { align: "center" }); y += 4; }
  if (cliente.calle)  { doc.text(cliente.calle,  ANCHO / 2, y, { align: "center" }); y += 4; }
  if (cliente.ciudad || cliente.cp) {
    doc.text(`${cliente.ciudad ?? ""} C.P. ${cliente.cp ?? ""}`, ANCHO / 2, y, { align: "center" });
    y += 4;
  }
  y += 1;

  y = linea(doc, y);
  y += 1;

  // ── Encabezado artículos ─────────────────────────────────────
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.text("PRODUCTO",  MARGEN,           y);
  doc.text("T",         MARGEN + 34,      y, { align: "center" });
  doc.text("UD",        MARGEN + 41,      y, { align: "center" });
  doc.text("IMPORTE",   ANCHO - MARGEN,   y, { align: "right" });
  y += 3.5;

  y = linea(doc, y);
  y += 1;

  // ── Items ────────────────────────────────────────────────────
  for (const item of venta.items ?? []) {
    const nombre = item.nombre.length > 20 ? item.nombre.slice(0, 20) : item.nombre;
    const subtotal = fmt(item.cantidad * item.precioUnitario);

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(nombre,              MARGEN,         y);
    doc.text(String(item.talla),  MARGEN + 34,    y, { align: "center" });
    doc.text(String(item.cantidad), MARGEN + 41,  y, { align: "center" });
    doc.text(subtotal,            ANCHO - MARGEN, y, { align: "right" });
    y += 4;

    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(fmt(item.precioUnitario) + " c/u", MARGEN, y);
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  y = linea(doc, y);
  y += 1;

  // ── Totales ──────────────────────────────────────────────────
  y = fila(doc, "Subtotal", fmt(venta.subtotal), y, false, 7.5);
  y += 1;
  y = fila(doc, "Envio", venta.envio === 0 ? "GRATIS" : fmt(venta.envio), y, false, 7.5);
  y += 2;

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", MARGEN, y);
  doc.text(fmt(venta.total), ANCHO - MARGEN, y, { align: "right" });
  y += 5;

  y = linea(doc, y);
  y += 2;

  // ── Método de pago ───────────────────────────────────────────
  const metodo = venta.metodoPago.charAt(0).toUpperCase() + venta.metodoPago.slice(1);
  y = fila(doc, metodo, fmt(venta.total), y, false, 7.5);
  y += 2;

  // ── Estado ───────────────────────────────────────────────────
  y = fila(doc, "Estado", venta.estado.toUpperCase(), y, true, 7.5);
  y += 3;

  y = linea(doc, y);
  y += 3;

  // ── Footer ───────────────────────────────────────────────────
  const mensajeFooter = {
    pagado:    "Gracias por tu compra",
    pendiente: "El pago esta siendo procesado",
    cancelado: "Este pedido fue cancelado",
  }[venta.estado] ?? "Gracias por tu compra";

  y = centrado(doc, mensajeFooter, y, false, 7.5);
  y += 4;
  centrado(doc, "A U R A  B O U T I Q U E", y, true, 7.5);

  doc.save(`AURA-Pedido-${venta.numeroPedido || venta.id.slice(0, 8).toUpperCase()}.pdf`);
}
