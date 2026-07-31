import { useCallback, useEffect, useState } from "react";
import Tabla from "../components/Tabla";
import Paginacion from "../components/Paginacion";
import ModalAuditoria from "../components/ModalAuditoria";
import Encabezado from "../components/Encabezado";
import { ActionBadge, ResourceBadge } from "../components/ActionBadge";
import { useAuth } from "../hooks/useAuth";
import useTitulo from "../hooks/useTitulo";
import { staffApi } from "../services/api";
import FechaMexicoInput from "../components/FechaMexicoInput";

const LIMIT = 10;
const ZONA_HORARIA_MEXICO = "America/Mexico_City";
const FECHA_MINIMA = "2026-01-01";
const ACCIONES = [
  ["", "Todas las acciones"], ["CREATE", "Creaciones"], ["UPDATE", "Actualizaciones"], ["DELETE", "Eliminaciones"],
  ["TOGGLE_ACTIVE", "Cambios de estado"], ["ADJUST", "Ajustes"], ["SEND", "Envíos"], ["CONFIRM", "Confirmaciones"], ["CANCEL", "Cancelaciones"], ["CHANGE_PASSWORD", "Cambios de contraseña"],
  ["RESET_PASSWORD", "Restablecimientos de contraseña"],
];
const RECURSOS = [
  ["", "Todos los módulos"], ["users", "Usuarios"], ["clients", "Clientes"], ["suppliers", "Proveedores"], ["products", "Productos"], ["inventory", "Inventario"], ["recepciones", "Recepciones"], ["ventas", "Ventas"], ["fulfillment", "Preparación de pedidos"], ["roles", "Roles"], ["permissions", "Permisos"], ["auth", "Autenticación"],
];
function fechaCorta(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", { timeZone: ZONA_HORARIA_MEXICO, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fechaActualMexico() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_MEXICO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

export default function Auditoria() {
  useTitulo("Auditoría");
  const { token } = useAuth();
  const FECHA_MAXIMA = fechaActualMexico();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtros, setFiltros] = useState({ q: "", action: "", resource: "", userId: "", from: "", to: "" });
  const [seleccionado, setSeleccionado] = useState(null);

  const actualizarFiltro = (campo, value) => { setFiltros((actual) => ({ ...actual, [campo]: value })); setPagina(1); };
  const limpiarFiltros = () => { setFiltros({ q: "", action: "", resource: "", userId: "", from: "", to: "" }); setPagina(1); };

  const cargar = useCallback(async () => {
    if (!token) return;
    setCargando(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(pagina), limit: String(LIMIT) });
      Object.entries(filtros).forEach(([key, value]) => { if (value) params.set(key, value); });
      const data = await staffApi.get(`/audit?${params}`);
      setLogs(data.items || []); setTotal(data.total || 0);
    } catch (err) { setError(err.message); } finally { setCargando(false); }
  }, [token, pagina, filtros, refreshKey]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    if (!token) return;
    staffApi.get("/audit/filters")
      .then((data) => setUsuarios(data.users || []))
      .catch(() => setUsuarios([]));
  }, [token]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));
  const cambiarPagina = (valor) => setPagina((actual) => valor === "‹" ? Math.max(1, actual - 1) : valor === "›" ? Math.min(totalPaginas, actual + 1) : Number(valor));
  return <div className="w-full space-y-5 p-4 md:p-6">
    <Encabezado titulo="Auditoría" onActualizar={() => setRefreshKey((valor) => valor + 1)} />
    <section className="rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--snow)] p-3 shadow-sm dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="relative"><i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]" /><input value={filtros.q} onChange={(event) => actualizarFiltro("q", event.target.value)} placeholder="Buscar acción, módulo o usuario" className="h-10 w-full rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)]" /></div>
        <select value={filtros.action} onChange={(event) => actualizarFiltro("action", event.target.value)} className="h-10 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-3 text-sm dark:bg-[var(--noir)] dark:text-[var(--snow)]">{ACCIONES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filtros.resource} onChange={(event) => actualizarFiltro("resource", event.target.value)} className="h-10 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-3 text-sm dark:bg-[var(--noir)] dark:text-[var(--snow)]">{RECURSOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filtros.userId} onChange={(event) => actualizarFiltro("userId", event.target.value)} aria-label="Filtrar por personal administrativo" className="h-10 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-3 text-sm dark:bg-[var(--noir)] dark:text-[var(--snow)]"><option value="">Todo el personal</option>{usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nombre}{usuario.usuario ? ` (@${usuario.usuario})` : ""}</option>)}</select>
        <FechaMexicoInput etiqueta="Desde" value={filtros.from} onChange={(valor) => actualizarFiltro("from", valor)} min={FECHA_MINIMA} max={filtros.to || FECHA_MAXIMA} />
        <FechaMexicoInput etiqueta="Hasta" value={filtros.to} onChange={(valor) => actualizarFiltro("to", valor)} min={filtros.from || FECHA_MINIMA} max={FECHA_MAXIMA} />
        <button type="button" onClick={limpiarFiltros} className="self-end h-8 w-fit rounded-[2px] border border-[var(--gold)] bg-[var(--gold)] px-3 text-xs font-semibold text-[var(--noir)] transition-colors hover:bg-[var(--gold-light)]">Limpiar filtros</button>
      </div>
    </section>

    <div className="overflow-x-auto rounded-[2px] shadow-sm"><Tabla encabezados={["Acción", "Módulo", "Usuario", "Detalles", "Fecha"]}>
      {cargando ? <tr><td colSpan={5} className="py-10 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]"><i className="bi bi-arrow-repeat mr-2 inline-block animate-spin" style={{ animationDuration: "0.8s" }} />Consultando registros…</td></tr> : error ? <tr><td colSpan={5} className="py-10 text-center text-sm text-rojo">{error}</td></tr> : logs.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Sin registros que coincidan con los filtros.</td></tr> : logs.map((log) => <tr key={log.id} onClick={() => setSeleccionado(log)} className="cursor-pointer border-b border-[var(--border-gold-20)] hover:bg-[var(--gold-08)]"><td className="p-3 text-center"><ActionBadge action={log.action} /></td><td className="p-3 text-center"><ResourceBadge resource={log.resource} /></td><td className="p-3 text-center text-sm text-[var(--noir)] dark:text-[var(--snow)]">{log.usuario || "Sistema"}</td><td className="max-w-48 truncate p-3 text-center text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{Object.keys(log.details || {}).slice(0, 2).join(", ") || "—"}</td><td className="p-3 text-center text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{fechaCorta(log.createdAt)}</td></tr>)}</Tabla></div>
    <Paginacion paginaActual={pagina} totalRegistros={total} rangoSiguiente={total ? `${(pagina - 1) * LIMIT + 1} – ${Math.min(pagina * LIMIT, total)}` : "0"} limit={LIMIT} onCambiarPagina={cambiarPagina} exportTitulo="Auditoría" exportColumnas={[]} exportFilas={[]} />
    <ModalAuditoria isOpen={Boolean(seleccionado)} onClose={() => setSeleccionado(null)} data={seleccionado} />
  </div>
}
