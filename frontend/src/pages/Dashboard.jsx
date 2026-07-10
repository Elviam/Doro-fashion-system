import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

import { api } from "../services/api";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import Etiquetas from "../components/Etiquetas";
import Toast from "../components/Toast";
import GraficaVentas from "../components/GraficaVentas";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import { generarDatos30Dias } from "./Ventas";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// ── Hook: detecta el modo oscuro observando la clase "dark" en <html> ──
function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

// ── Paleta para RELLENOS de gráficas (no varía por tema) ──
const C = { gold: "#C9A84C", rojo: "#B5644B" };

// ── Paleta para TEXTO/BADGES (sí varía por tema, para contraste real) ──
function getPalette(isDark) {
  return {
    gold:  isDark ? "#E8D49A" : "#8A6D1B",
    verde: isDark ? "#A8CB82" : "#4F7A34",
    rojo:  isDark ? "#E0917A" : "#9C3F2B",
    azul:  isDark ? "#C9BFAE" : "#5C5347",
  };
}

// ── Datos mock (solo para previsualizar el diseño si la API no responde) ──
const MOCK_SUMMARY = {
  totals: {
    products: 184, activeProducts: 162,
    clients: 96, activeClients: 88,
    suppliers: 21, activeSuppliers: 19,
  },
  topProductos: [
    { id: "t1", nombre: "Vestido Seda Como",      sku: "DRO-SED-014", unidades: 142, ingreso: 218900 },
    { id: "t2", nombre: "Camisa Lino Belga",       sku: "DRO-LIN-027", unidades: 118, ingreso: 165400 },
    { id: "t3", nombre: "Pañuelo Algodón Egipcio", sku: "DRO-ALG-041", unidades: 97,  ingreso: 87300  },
    { id: "t4", nombre: "Abrigo Lana Merino",      sku: "DRO-LAN-009", unidades: 64,  ingreso: 198700 },
    { id: "t5", nombre: "Pantalón Cashmere",       sku: "DRO-CAS-033", unidades: 51,  ingreso: 142600 },
  ],
};

const MOCK_PRODUCTOS = [
  { id: "p1", sku: "DRO-SED-014", nombre: "Vestido Seda Como",       inventario: [{ talla: "M", stock: 3 }],  stockMinimo: 10, activo: true  },
  { id: "p2", sku: "DRO-LIN-027", nombre: "Camisa Lino Belga",       inventario: [{ talla: "L", stock: 5 }],  stockMinimo: 12, activo: true  },
  { id: "p3", sku: "DRO-LAN-009", nombre: "Abrigo Lana Merino",      inventario: [{ talla: "M", stock: 1 }],  stockMinimo: 8,  activo: true  },
  { id: "p4", sku: "DRO-CAS-033", nombre: "Pantalón Cashmere",       inventario: [{ talla: "32", stock: 4 }], stockMinimo: 10, activo: false },
  { id: "p5", sku: "DRO-ALG-041", nombre: "Pañuelo Algodón Egipcio", inventario: [{ talla: "Unitalla", stock: 6 }], stockMinimo: 15, activo: true },
];

const MOCK_VENTAS = [
  { id: "v1a2b3c4", numeroPedido: "#A2C91F", cliente: { nombre: "Carla Núñez"  }, total: 3200, estado: "pagado",    createdAt: "2026-06-30T10:00:00Z" },
  { id: "v2a2b3c4", numeroPedido: "#B7D82E", cliente: { nombre: "Diego Ramos"  }, total: 1800, estado: "pagado",    createdAt: "2026-06-29T15:30:00Z" },
  { id: "v3a2b3c4", numeroPedido: "#C4E17A", cliente: { nombre: "Fernanda Ruiz"}, total: 950,  estado: "pendiente", createdAt: "2026-06-29T09:15:00Z" },
  { id: "v4a2b3c4", numeroPedido: "#D9F03B", cliente: { nombre: "José Herrera" }, total: 4200, estado: "pagado",    createdAt: "2026-06-27T12:00:00Z" },
  { id: "v5a2b3c4", numeroPedido: "#E1A64C", cliente: { nombre: "Marina López" }, total: 600,  estado: "cancelado", createdAt: "2026-06-25T17:45:00Z" },
  { id: "v6a2b3c4", numeroPedido: "#F3B75D", cliente: { nombre: "Óscar Peña"   }, total: 2750, estado: "pagado",    createdAt: "2026-06-22T11:20:00Z" },
];

function getTooltipStyle(isDark) {
  return {
    contentStyle: {
      background: isDark ? "var(--noir-soft)" : "var(--snow)",
      border: `1px solid ${isDark ? "var(--border-gold-25)" : "var(--border-gold-40)"}`,
      borderRadius: 2,
      color: isDark ? "var(--gold-light)" : "var(--gold-dark)",
      fontSize: 12,
      fontFamily: "var(--font-tag)",
      padding: "8px 12px",
    },
    labelStyle: { color: isDark ? "var(--gold-light)" : "var(--gold-dark)", marginBottom: 4, fontSize: 11 },
    cursor: { fill: isDark ? "rgba(201,168,76,0.06)" : "rgba(122,92,30,0.05)" },
  };
}

function ToggleBtn({ isGrafica, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold font-tag uppercase tracking-wide cursor-pointer transition-all active:scale-95 rounded-[2px] border
        ${isGrafica
          ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--noir)]"
          : "border-[var(--border-gold-20)] bg-transparent text-[var(--gold-dark)] dark:text-[var(--gold-light)] hover:bg-[var(--gold-08)] hover:border-[var(--border-gold-40)]"
        }`}
    >
      <i className={`bi ${isGrafica ? "bi-table" : "bi-bar-chart-line"} text-sm`} />
      {isGrafica ? "Ver tabla" : "Ver gráfica"}
    </button>
  );
}

function SectionHeader({ title, icon, subtitle, isGrafica, onToggle, extra }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="flex items-center gap-2 m-0 font-display italic font-medium text-lg text-[var(--noir)] dark:text-[var(--snow)]">
          <i className={icon} style={{ color: "var(--gold)" }} />
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 m-0 font-body text-sm text-[var(--noir-soft)]/70 dark:text-[var(--ash)]">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {onToggle && <ToggleBtn isGrafica={isGrafica} onClick={onToggle} />}
      </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div className={`p-5 w-full rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--ivory)] dark:bg-[var(--noir-soft)] shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] ${className}`}>
      {children}
    </div>
  );
}

function Tr({ children, idx }) {
  return <tr style={{ background: idx % 2 === 0 ? "rgba(201,168,76,0.03)" : "transparent" }}>{children}</tr>;
}

function Td({ children, mono, color, align = "center" }) {
  return (
    <td
      className={`p-3 text-sm border-b border-[var(--border-gold-20)] ${mono ? "font-mono" : "font-body"} ${!color ? "text-[var(--noir-soft)] dark:text-[var(--snow)]" : ""}`}
      style={{ textAlign: align, ...(color ? { color } : {}) }}
    >
      {children}
    </td>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 w-full rounded-[2px] bg-[var(--gold-08)]" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

const fmt     = (n) => Number(n ?? 0).toLocaleString("es-MX");
const fmtCur  = (n) => `$${Number(n ?? 0).toLocaleString("es-MX")}`;
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }); } catch { return d; } };
const pct     = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

// Misma lógica que Productos.jsx: el stock real de un producto es la suma
// de su inventario por talla, no un campo suelto que puede quedar desfasado.
const calcularStockTotal = (inventario) => {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + Number(item.stock || 0), 0);
};

export default function Dashboard() {
  useTitulo("Dashboard");

  const isDark = useIsDark();
  const pal = getPalette(isDark);
  const tooltipStyle = getTooltipStyle(isDark);
  const tickColor = isDark ? "var(--ash)" : "var(--noir-soft)";

  const [summary, setSummary] = useState(null);
  const [productosDB, setProductosDB] = useState([]);
  const [ventas,  setVentas]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState({ message: "", type: "error" });
  const [views, setViews] = useState({ productos: false });
  const toggleView = (s) => setViews((p) => ({ ...p, [s]: !p[s] }));

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/dashboard/summary`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setSummary(await res.json());
    } catch (err) {
      setSummary(MOCK_SUMMARY);
    } finally { setLoading(false); }
  }, []);

  // Trae el catálogo real de productos para calcular el stock igual que
  // en la página de Productos, en vez de confiar en un snapshot del summary
  // que puede quedar desactualizado apenas alguien edita el inventario.
  const fetchProductosDB = useCallback(async () => {
    try {
      const result = await api.get("/products?limit=1000");
      const datosReales = result.items || result.data?.items || (Array.isArray(result) ? result : []);
      setProductosDB(datosReales);
    } catch (err) {
      setProductosDB(MOCK_PRODUCTOS);
    }
  }, []);

  const fetchVentas = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/ventas?limit=100`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setVentas(data.items ?? []);
    } catch (err) {
      setVentas(MOCK_VENTAS);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchProductosDB();
    fetchVentas();
  }, [fetchSummary, fetchProductosDB, fetchVentas]);

  const t     = summary?.totals       ?? {};
  const top5  = summary?.topProductos ?? [];

  // Bajo stock calculado en vivo a partir del catálogo real (sincronizado
  // con Productos.jsx), no del summary cacheado del backend.
  const lsp = productosDB
    .map((p) => ({ ...p, stockTotal: calcularStockTotal(p.inventario) }))
    .filter((p) => p.stockTotal <= Number(p.stockMinimo ?? 0))
    .sort((a, b) => a.stockTotal - b.stockTotal);

  const lowStockCount = lsp.length;

  const ingresos30d = ventas.filter((v) => v.estado === "pagado").reduce((a, v) => a + v.total, 0);
  const maxIngresoTop = Math.max(1, ...top5.map((p) => p.ingreso));

  const ultimasVentas = [...ventas]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const refrescarTodo = () => { fetchSummary(); fetchProductosDB(); fetchVentas(); };

  return (
    <div className="p-6 md:p-8 space-y-5 font-body bg-[var(--snow)] dark:bg-[var(--noir)] min-h-screen">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
      `}</style>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "error" })} />

      <Encabezado titulo="Dashboard" onActualizar={refrescarTodo} />

      {/* ══════════ 1. KPIs ══════════ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--ivory)] dark:bg-[var(--noir-soft)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Tarjetas label="Ventas"      value={fmtCur(ingresos30d)} sub="Últimos 30 días"                                              icon="bi bi-cash-coin"           accent="#7A9959" />
          <Tarjetas label="Productos"   value={fmt(t.products)}    sub={`${fmt(t.activeProducts)} activos · ${pct(t.activeProducts, t.products)}%`}   icon="bi bi-box-seam"            accent="#C9A84C" />
          <Tarjetas label="Clientes"    value={fmt(t.clients)}     sub={`${fmt(t.activeClients)} activos · ${pct(t.activeClients, t.clients)}%`}       icon="bi bi-people"              accent="#7EC9ED" />
          <Tarjetas label="Proveedores" value={fmt(t.suppliers)}   sub={`${fmt(t.activeSuppliers)} activos · ${pct(t.activeSuppliers, t.suppliers)}%`} icon="bi bi-truck"               accent="#B5824B" />
          <Tarjetas label="Bajo stock"  value={fmt(lowStockCount)} sub="requieren reorden"                                             icon="bi bi-exclamation-triangle" accent="#B5644B" />
        </div>
      )}

      {/* ══════════ 2. ANÁLISIS ══════════ */}
      <Panel>
        <SectionHeader
          title="Ventas · Últimos 30 días"
          icon="bi bi-graph-up-arrow"
          subtitle="Monto total de ventas confirmadas"
          extra={
            <div className="text-right mr-1">
              <p className="text-[10px] tracking-[2px] uppercase font-semibold text-[var(--gold-dark)] dark:text-[var(--gold)]">Total</p>
              <p className="text-lg font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)]">{fmtCur(ingresos30d)}</p>
            </div>
          }
        />
        {loading ? <Skeleton /> : <GraficaVentas data={generarDatos30Dias(ventas)} />}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <Panel className="lg:col-span-2">
          <SectionHeader
            title="Inventario · Bajo stock"
            icon="bi bi-box-seam"
            subtitle={`${lsp.length} productos críticos`}
            isGrafica={views.productos}
            onToggle={() => toggleView("productos")}
          />
          {loading ? <Skeleton /> : views.productos ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={lsp.slice(0, 7).map((p) => ({
                    nombre:  p.nombre?.slice(0, 10) ?? p.sku,
                    stock:   p.stockTotal,
                    min:     Number(p.stockMinimo || 0),
                    deficit: Math.max(0, Number(p.stockMinimo || 0) - p.stockTotal),
                  }))}
                  barSize={18}
                >
                  <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fill: tickColor, fontSize: 9 }} angle={-12} dy={4} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="stock" name="Stock actual" fill={C.gold} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="min"   name="Stock mínimo" fill={`${C.rojo}50`} radius={[2, 2, 0, 0]} />
                  <Line dataKey="deficit" name="Déficit" type="monotone" stroke={C.rojo} strokeWidth={2} dot={{ r: 3, fill: C.rojo }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Tabla encabezados={["SKU", "Nombre", "Stock", "Mínimo", "Déficit", "Estado"]}>
              {lsp.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-[var(--noir-soft)] dark:text-[var(--snow)]">Sin productos críticos 🎉</td></tr>
              ) : lsp.map((p, i) => (
                <Tr key={p.id} idx={i}>
                  <Td mono color={pal.azul}>{p.sku}</Td>
                  <Td align="left">{p.nombre}</Td>
                  <Td color={p.stockTotal <= Number(p.stockMinimo) ? pal.rojo : pal.verde}><b>{fmt(p.stockTotal)}</b></Td>
                  <Td>{fmt(p.stockMinimo)}</Td>
                  <Td color={pal.rojo}><b>−{Math.max(0, Number(p.stockMinimo) - p.stockTotal)}</b></Td>
                  <Td><Etiquetas contenido={p.activo ? "Activo" : "Inactivo"} /></Td>
                </Tr>
              ))}
            </Tabla>
          )}
        </Panel>

        <Panel>
          <SectionHeader title="Top 5 · Más vendidos" icon="bi bi-trophy" subtitle="Por unidades" />
          {loading ? <Skeleton rows={5} /> : top5.length === 0 ? (
            <p className="text-center py-8 text-sm text-[var(--noir-soft)] dark:text-[var(--snow)]">Sin datos de ventas</p>
          ) : (
            <div className="space-y-4">
              {top5.map((p, i) => (
                <div key={p.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-[2px] shrink-0"
                      style={{ background: `${C.gold}20`, color: pal.gold }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[var(--noir-soft)] dark:text-[var(--snow)] truncate">
                      {p.nombre}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)]">
                      {fmt(p.unidades)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-7">
                    <div className="flex-1 h-1.5 rounded-[2px] bg-[var(--gold-08)]">
                      <div
                        className="h-1.5 rounded-[2px]"
                        style={{ width: `${(p.ingreso / maxIngresoTop) * 100}%`, background: C.gold }}
                      />
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: pal.verde }}>
                      {fmtCur(p.ingreso)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

      </div>

      {/* ══════════ 3. ACTIVIDAD RECIENTE ══════════ */}
      <Panel>
        <SectionHeader
          title="Últimas ventas"
          icon="bi bi-receipt"
          subtitle={`${ultimasVentas.length} pedidos recientes`}
        />
        {loading ? <Skeleton rows={5} /> : (
          <Tabla encabezados={["Folio", "Cliente", "Total", "Estado"]}>
            {ultimasVentas.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-sm text-[var(--noir-soft)] dark:text-[var(--snow)]">Sin ventas registradas</td></tr>
            ) : ultimasVentas.map((v, i) => (
              <Tr key={v.id} idx={i}>
                <Td mono color={pal.azul}>{v.numeroPedido || `#${v.id.slice(0, 8).toUpperCase()}`}</Td>
                <Td align="left">{v.cliente?.nombre ?? "—"}</Td>
                <Td color={pal.verde}><b>{fmtCur(v.total)}</b></Td>
                <Td><Etiquetas contenido={v.estado} /></Td>
              </Tr>
            ))}
          </Tabla>
        )}
      </Panel>

      {/* ══════════ 4. ALERTAS ══════════ */}
      {!loading && lowStockCount > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-3 text-sm font-medium"
          style={{ borderRadius: "2px", background: `${C.rojo}12`, border: `1px solid ${C.rojo}35`, color: pal.rojo, fontFamily: "var(--font-body)" }}
        >
          <i className="bi bi-exclamation-triangle-fill" />
          <span>
            <b>{lowStockCount} producto{lowStockCount > 1 ? "s" : ""}</b> por debajo del stock mínimo. Revisa el panel de inventario para reordenar.
          </span>
        </div>
      )}

    </div>
  );
}