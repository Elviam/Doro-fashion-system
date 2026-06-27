import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  ComposedChart, Line,
} from "recharts";

import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import Etiquetas from "../components/Etiquetas";
import Toast from "../components/Toast";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const C = {
  lila:     "#E7D6FF",
  lilaMid:  "#A68DC8",
  lilaSoft: "#C9B8E8",
  verde:    "#A3E378",
  verdeMid: "#6DB84A",
  rojo:     "#FF6B6B",
  amarillo: "#F7CB57",
  azul:     "#7EC9ED",
  naranja:  "#FAA86B",
  muted:    "#5A5870",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1A1730",
    border: `1px solid ${C.lilaMid}40`,
    borderRadius: 10,
    color: C.lila,
    fontSize: 12,
    fontFamily: "Poppins, sans-serif",
    padding: "8px 12px",
  },
  labelStyle: { color: C.lilaSoft, marginBottom: 4, fontSize: 11 },
  cursor:      { fill: "rgba(167,139,250,0.06)" },
};

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <p style={{ ...TOOLTIP_STYLE.labelStyle, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: 0, fontSize: 12 }}>
          {p.name}: ${Number(p.value || 0).toLocaleString("es-MX")}
        </p>
      ))}
    </div>
  );
};

function ToggleBtn({ isGrafica, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all active:scale-95 font-poppins
        ${isGrafica
          ? "bg-lila text-oscuro border-lila"
          : "bg-transparent text-lila-soft border-lila/20 hover:bg-lila hover:text-oscuro"}`}
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
        <h2 className="flex items-center gap-2 text-sm font-bold text-lila m-0">
          <i className={`bi ${icon} text-lila-mid`} />
          {title}
        </h2>
        {subtitle && <p className="text-xs text-text-muted mt-0.5 m-0">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        <ToggleBtn isGrafica={isGrafica} onClick={onToggle} />
      </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-lila/10 shadow-lg p-5 w-full
        bg-blanco dark:bg-[rgba(35,30,60,0.6)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Tr({ children, idx }) {
  return <tr className={idx % 2 === 0 ? "bg-black/10" : ""}>{children}</tr>;
}

function Td({ children, mono, color, align = "center" }) {
  return (
    <td
      className={`p-3 text-xs border-b ${mono ? "font-mono" : "font-poppins"}`}
      style={{ textAlign: align, color: color || C.lilaSoft }}
    >
      {children}
    </td>
  );
}

function Triangle({ children, mono, color }) {
  return (
    <td
      className={`p-3 text-xs border-b ${mono ? "font-mono" : "font-poppins"} text-center`}
      style={{ color: color || C.lilaSoft }}
    >
      {children}
    </td>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-lila/5 rounded-lg w-full" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

function StatPill({ label, value, color = C.lilaSoft }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
      style={{ background: `${color}18`, border: `0.5px solid ${color}40`, color }}
    >
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}

const ACTION_COLORS = {
  CREATE:        { bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.35)",  color: "#84B140" },
  UPDATE:        { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  color: "#E0DA66" },
  DELETE:        { bg: "rgba(244,63,94,0.12)",   border: "rgba(244,63,94,0.35)",   color: "#D04E37" },
  TOGGLE_ACTIVE: { bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.35)",  color: "#38bdf8" },
};

function ActionBadge({ action }) {
  const c = ACTION_COLORS[action] || {
    bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)", color: "#a78bfa",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: c.bg, border: `0.5px solid ${c.border}`, color: c.color }}
    >
      {action}
    </span>
  );
}

const fmt     = (n) => Number(n ?? 0).toLocaleString("es-MX");
const fmtCur  = (n) => `$${Number(n ?? 0).toLocaleString("es-MX")}`;
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }); } catch { return d; } };
const pct     = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

function buildAuditBar(logs) {
  const counts = {};
  logs.forEach((l) => { counts[l.action] = (counts[l.action] || 0) + 1; });
  const cm = { CREATE: C.azul, UPDATE: C.amarillo, DELETE: C.rojo, TOGGLE_ACTIVE: C.naranja };
  return Object.entries(counts).map(([accion, total]) => ({ accion, total, color: cm[accion] || C.lilaSoft }));
}

function buildMovArea(movs) {
  return movs.map((m, i) => ({
    idx:     i + 1,
    entrada: m.tipo?.toLowerCase().includes("entr") ? Math.abs(Number(m.cantidad) || 0) : 0,
    salida:  !m.tipo?.toLowerCase().includes("entr") ? Math.abs(Number(m.cantidad) || 0) : 0,
  }));
}

function buildRecepPie(receps) {
  const counts = {};
  receps.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const cm = { COMPLETED: C.verdeMid, CONFIRMED: C.verdeMid, PENDING: C.amarillo, DRAFT: C.lilaMid };
  return Object.entries(counts).map(([name, value]) => ({ name, value, color: cm[name] || C.lilaSoft }));
}

function buildRecepValor(receps) {
  return receps.slice(0, 8).map((r) => ({
    folio: r.folio?.slice(-5) || "—",
    total: Number(r.total || 0),
  }));
}

export default function Dashboard() {
  useTitulo("Dashboard");

  const [summary,  setSummary]  = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState({ message: "", type: "error" });

  const [views, setViews] = useState({
    productos:   false,
    recepciones: false,
    movimientos: false,
    auditoria:   false,
    valorRecep:  false,
  });
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
      setToast({ message: `No se pudo cargar el resumen: ${err.message}`, type: "error" });
    } finally { setLoading(false); }
  }, []);

  const fetchActivity = useCallback(async () => {
    if (activity) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/dashboard/recent-activity?limit=10`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setActivity(data.items ?? []);
    } catch (err) {
      setToast({ message: `No se pudo cargar la actividad: ${err.message}`, type: "error" });
    }
  }, [activity]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { if (views.auditoria) fetchActivity(); }, [views.auditoria, fetchActivity]);

  const t     = summary?.totals                   ?? {};
  const lsp   = summary?.lowStockProducts         ?? [];
  const recep = summary?.recepcionesRecientes     ?? [];
  const movs  = summary?.recentInventoryMovements ?? [];
  const audit = summary?.recentAudit              ?? [];
  const acts  = activity ?? audit;

  const pieRecep   = buildRecepPie(recep);
  const areaMovs   = buildMovArea(movs);
  const barAudit   = buildAuditBar(acts);
  const recepValor = buildRecepValor(recep);

  const totalEntradas = movs
    .filter(m => m.tipo?.toLowerCase().includes("entr"))
    .reduce((a, m) => a + Math.abs(Number(m.cantidad) || 0), 0);
  const totalSalidas = movs
    .filter(m => !m.tipo?.toLowerCase().includes("entr"))
    .reduce((a, m) => a + Math.abs(Number(m.cantidad) || 0), 0);
  const valorRecepTotal = recep.reduce((a, r) => a + Number(r.total || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-5 font-poppins">

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "error" })}
      />

      <Encabezado 
        titulo="Dashboard" 
        onActualizar={fetchSummary} 
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse border border-lila/10
              bg-oscuro/5 dark:bg-[rgba(35,30,60,0.6)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Productos",   value: fmt(t.products),             sub: `${fmt(t.activeProducts)} activos`,    accent: C.lilaMid,  icon: "bi bi-box-seam",            pct: pct(t.activeProducts,  t.products)  },
            { label: "Clientes",    value: fmt(t.clients),              sub: `${fmt(t.activeClients)} activos`,     accent: C.azul,     icon: "bi bi-people",               pct: pct(t.activeClients,   t.clients)   },
            { label: "Proveedores", value: fmt(t.suppliers),            sub: `${fmt(t.activeSuppliers)} activos`,   accent: C.verdeMid, icon: "bi bi-truck",                pct: pct(t.activeSuppliers, t.suppliers) },
            { label: "Recepciones", value: fmt(t.recepciones),          sub: fmtCur(valorRecepTotal) + " reciente", accent: C.naranja,  icon: "bi bi-clipboard-check",      pct: null                                },
            { label: "Bajo stock",  value: fmt(summary?.lowStockCount), sub: "requieren reorden",                   accent: C.rojo,     icon: "bi bi-exclamation-triangle", pct: null                                },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-lila/10 p-4 flex flex-col gap-2 relative overflow-hidden
                bg-blanco dark:bg-[rgba(35,30,60,0.6)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">{k.label}</span>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${k.accent}18`, color: k.accent }}>
                  <i className={`${k.icon} text-sm`} />
                </span>
              </div>
              <p className="text-2xl font-bold text-oscuro dark:text-blanco m-0">{k.value}</p>
              <p className="text-xs m-0" style={{ color: k.accent }}>{k.sub}</p>
              {k.pct !== null && (
                <div className="mt-1">
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-1 rounded-full transition-all"
                      style={{ width: `${k.pct}%`, background: k.accent }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {!loading && summary?.lowStockCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium"
          style={{ background: `${C.rojo}12`, border: `1px solid ${C.rojo}35`, color: C.rojo }}
        >
          <i className="bi bi-exclamation-triangle-fill" />
          <span>
            <b>{summary.lowStockCount} producto{summary.lowStockCount > 1 ? "s" : ""}</b>
            {" "}por debajo del stock mínimo.
          </span>
        </div>
      )}

      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <Panel className="xl:col-span-2">
          <SectionHeader
            title="Inventario · Bajo stock"
            icon="bi-box-seam"
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
                    stock:   Number(p.stock || 0),
                    min:     Number(p.stockMinimo || 0),
                    deficit: Math.max(0, Number(p.stockMinimo || 0) - Number(p.stock || 0)),
                  }))}
                  barSize={18}
                >
                  <CartesianGrid stroke="rgba(231,214,255,0.06)" vertical={false} />
                  {/* Corregido: Angulo sutil para prevenir colisión de texto en móvil */}
                  <XAxis dataKey="nombre" tick={{ fill: C.muted, fontSize: 9 }} angle={-12} dy={4} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="stock"   name="Stock actual"  fill={C.lilaMid}     radius={[4, 4, 0, 0]} />
                  <Bar dataKey="min"     name="Stock mínimo"  fill={`${C.rojo}50`} radius={[4, 4, 0, 0]} />
                  <Line dataKey="deficit" name="Déficit" type="monotone" stroke={C.rojo} strokeWidth={2} dot={{ r: 3, fill: C.rojo }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Tabla encabezados={["SKU", "Nombre", "Stock", "Mínimo", "Déficit", "Estado"]}>
              {lsp.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-text-muted py-8 text-sm">
                    Sin productos críticos 🎉
                  </td>
                </tr>
              ) : lsp.map((p, i) => (
                <Tr key={p.id} idx={i}>
                  <Td mono color={C.azul}>{p.sku}</Td>
                  <Td align="left">{p.nombre}</Td>
                  <Td color={Number(p.stock) <= Number(p.stockMinimo) ? C.rojo : C.verde}>
                    <b>{fmt(p.stock)}</b>
                  </Td>
                  <Td>{fmt(p.stockMinimo)}</Td>
                  <Td color={C.rojo}>
                    <b>−{Math.max(0, Number(p.stockMinimo) - Number(p.stock))}</b>
                  </Td>
                  <Td><Etiquetas contenido={p.activo ? "Activo" : "Inactivo"} /></Td>
                </Tr>
              ))}
            </Tabla>
          )}
        </Panel>

        <Panel>
          <SectionHeader
            title="Valor recepciones"
            icon="bi-currency-dollar"
            subtitle={fmtCur(valorRecepTotal) + " acumulado"}
            isGrafica={views.valorRecep}
            onToggle={() => toggleView("valorRecep")}
          />
          {loading ? <Skeleton /> : views.valorRecep ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recepValor} layout="vertical" barSize={14}>
                  <CartesianGrid stroke="rgba(231,214,255,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: C.muted, fontSize: 9 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="folio" type="category"
                    tick={{ fill: C.lilaSoft, fontSize: 10 }}
                    axisLine={false} tickLine={false} width={42}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                    {recepValor.map((_, i) => (
                      <Cell key={i} fill={`rgba(250,168,107,${0.4 + (i / Math.max(recepValor.length, 1)) * 0.6})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Tabla encabezados={["Folio", "Proveedor", "Fecha", "Total"]}>
              {recep.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-text-muted py-8 text-sm">
                    Sin recepciones
                  </td>
                </tr>
              ) : recep.map((r, i) => (
                <Tr key={r.id} idx={i}>
                  <Triangle mono color={C.azul}>{r.folio}</Triangle>
                  <Td align="left" color={C.lilaSoft}>{r.supplierNombre}</Td>
                  <Td>{fmtDate(r.fecha || r.createdAt)}</Td>
                  <Td color={C.verdeMid}><b>{fmtCur(r.total)}</b></Td>
                </Tr>
              ))}
            </Tabla>
          )}
        </Panel>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        <Panel>
          <SectionHeader
            title="Recepciones recientes"
            icon="bi-clipboard-check"
            subtitle={`${recep.length} en este período`}
            isGrafica={views.recepciones}
            onToggle={() => toggleView("recepciones")}
          />
          {loading ? <Skeleton /> : views.recepciones ? (
            <div className="flex flex-col sm:flex-row items-center gap-6" style={{ minHeight: 220 }}>
              <div style={{ flex: "0 0 160px", height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieRecep} cx="50%" cy="50%"
                      outerRadius={75} innerRadius={45}
                      dataKey="value" paddingAngle={4}
                      startAngle={90} endAngle={450}
                    >
                      {pieRecep.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-3">
                <p className="text-xs text-text-muted mb-2">Por estatus</p>
                {pieRecep.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="flex items-center gap-2" style={{ color: C.lilaSoft }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
                        {s.name}
                      </span>
                      <b style={{ color: s.color }}>{s.value}</b>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${pct(s.value, recep.length)}%`, background: s.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Tabla encabezados={["Folio", "Proveedor", "Fecha", "Total", "Estatus"]}>
              {recep.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-8 text-sm">Sin recepciones</td>
                </tr>
              ) : recep.map((r, i) => (
                <Tr key={r.id} idx={i}>
                  <Td mono color={C.azul}>{r.folio}</Td>
                  <Td align="left" color={C.lilaSoft}>{r.supplierNombre}</Td>
                  <Td>{fmtDate(r.fecha || r.createdAt)}</Td>
                  <Td color={C.verdeMid}><b>{fmtCur(r.total)}</b></Td>
                  <Td>
                    <Etiquetas contenido={
                      r.status === "COMPLETED" || r.status === "CONFIRMED" ? "Activo"
                      : r.status === "PENDING" ? "Pendiente"
                      : "Inactivo"
                    } />
                  </Td>
                </Tr>
              ))}
            </Tabla>
          )}
        </Panel>

        <Panel>
          <SectionHeader
            title="Movimientos de inventario"
            icon="bi-arrow-left-right"
            subtitle={`${fmt(totalEntradas)} entradas · ${fmt(totalSalidas)} salidas`}
            isGrafica={views.movimientos}
            onToggle={() => toggleView("movimientos")}
          />
          {loading ? <Skeleton /> : views.movimientos ? (
            <>
              <div style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaMovs}>
                    <defs>
                      <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.verdeMid} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={C.verdeMid} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.rojo} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={C.rojo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(231,214,255,0.06)" vertical={false} />
                    <XAxis dataKey="idx" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="entrada" name="Entradas" stroke={C.verdeMid} fill="url(#gEnt)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="salida"  name="Salidas"  stroke={C.rojo}     fill="url(#gSal)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3 mt-3 flex-wrap">
                <StatPill label="entradas" value={fmt(totalEntradas)} color={C.verdeMid} />
                <StatPill label="salidas"  value={fmt(totalSalidas)}  color={C.rojo} />
              </div>
            </>
          ) : (
            <Tabla encabezados={["Producto", "Tipo", "Cant.", "Anterior → Nuevo", "Usuario"]}>
              {movs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-8 text-sm">Sin movimientos</td>
                </tr>
              ) : movs.map((m, i) => {
                const entrada = m.tipo?.toLowerCase().includes("entr");
                return (
                  <Tr key={m.id} idx={i}>
                    <Td align="left" color={C.lilaSoft}>{m.productNombre}</Td>
                    <Td>
                      <span className="text-xs font-bold" style={{ color: entrada ? C.verdeMid : C.rojo }}>
                        {entrada ? "Entrada" : "Salida"}
                      </span>
                    </Td>
                    <Td color={entrada ? C.verdeMid : C.rojo}>
                      <b>{entrada ? "+" : "−"}{fmt(Math.abs(m.cantidad))}</b>
                    </Td>
                    <Td mono color={C.muted}>{fmt(m.stockAnterior)} → {fmt(m.stockNuevo)}</Td>
                    <Td color={C.azul}>{m.usuario}</Td>
                  </Tr>
                );
              })}
            </Tabla>
          )}
        </Panel>

      </div>

      <Panel>
        <SectionHeader
          title="Actividad reciente · Auditoría"
          icon="bi-clock-history"
          subtitle={`${acts.length} eventos registrados`}
          isGrafica={views.auditoria}
          onToggle={() => toggleView("auditoria")}
        />

        {loading ? <Skeleton rows={4} /> : views.auditoria ? (

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {barAudit.map((b) => (
                <StatPill key={b.accion} label={b.accion} value={b.total} color={b.color} />
              ))}
            </div>
            <div style={{ height: Math.max(200, barAudit.length * 52 + 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barAudit} layout="vertical" barSize={28}
                  margin={{ left: 8, right: 40, top: 4, bottom: 4 }}
                >
                  <CartesianGrid stroke="rgba(231,214,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="accion" type="category"
                    tick={{ fill: C.lilaSoft, fontSize: 12, fontWeight: 600 }}
                    axisLine={false} tickLine={false} width={90}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} />
                  <Bar
                    dataKey="total" name="Acciones" radius={[0, 6, 6, 0]}
                    label={{ position: "right", fill: C.lilaSoft, fontSize: 12, fontWeight: 700 }}
                  >
                    {barAudit.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        ) : (

          <Tabla encabezados={["Acción", "Recurso", "Resource ID", "Usuario", "Detalles", "Fecha"]}>
            {acts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-text-muted py-8 text-sm">
                  Sin actividad reciente
                </td>
              </tr>
            ) : acts.map((a, i) => (
              <Tr key={a.id} idx={i}>
                <Td><ActionBadge action={a.action} /></Td>
                <Td color={C.lilaMid}>{a.resource}</Td>
                <Td mono color={C.muted}>{a.resourceId?.slice(0, 12)}</Td>
                <Td color={C.azul}>{a.usuario}</Td>
                <Td color={C.muted}>{a.details ? Object.keys(a.details).slice(0, 2).join(", ") : "—"}</Td>
                <Td color={C.muted}>{fmtDate(a.createdAt)}</Td>
              </Tr>
            ))}
          </Tabla>

        )}
      </Panel>

    </div>
  );
}