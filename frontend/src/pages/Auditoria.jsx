import { useState, useEffect, useCallback } from "react";
import Tabla from "../components/Tabla";
import Tarjetas from "../components/Tarjetas";
import Paginacion from "../components/Paginacion";
import ModalAuditoria from "../components/ModalAuditoria";
import ToolBar from "../components/ToolBar";
import Encabezado from "../components/Encabezado";
import { useAuth } from "../hooks/useAuth";
import useTitulo from "../hooks/useTitulo";

const LIMIT = 7;
const API_URL = import.meta.env.VITE_API_URL;

// Colores semánticos por tipo de acción — se mantienen como indicadores visuales
const ACTION_CFG = {
  CREATE:        { label: "CREATE",  bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.35)",  color: "#84B140" },
  UPDATE:        { label: "UPDATE",  bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  color: "#E0DA66" },
  DELETE:        { label: "DELETE",  bg: "rgba(244,63,94,0.12)",   border: "rgba(244,63,94,0.35)",   color: "#D04E37" },
  TOGGLE_ACTIVE: { label: "TOGGLE",  bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.35)",  color: "#38bdf8" },
};

const OPCIONES_ACCION = [
  { label: "Todas las acciones",  value: ""             },
  { label: "CREATE",              value: "CREATE"       },
  { label: "UPDATE",              value: "UPDATE"       },
  { label: "DELETE",              value: "DELETE"       },
  { label: "TOGGLE_ACTIVE",       value: "TOGGLE_ACTIVE"},
];

const OPCIONES_RECURSO = [
  { label: "Todos los recursos",  value: ""            },
  { label: "users",               value: "users"       },
  { label: "clients",             value: "clients"     },
  { label: "suppliers",           value: "suppliers"   },
  { label: "products",            value: "products"    },
  { label: "recepciones",         value: "recepciones" },
];

function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CFG[action] || {
    label: action, bg: "rgba(201,168,76,0.12)",
    border: "rgba(201,168,76,0.35)", color: "#C9A84C",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-tag font-semibold"
      style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function ResourceBadge({ resource }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-[2px] text-xs font-tag font-medium"
      style={{
        background: "rgba(201,168,76,0.10)",
        border: "0.5px solid rgba(201,168,76,0.30)",
        color: "#C9A84C",
      }}
    >
      {resource}
    </span>
  );
}

export default function Auditoria() {
  const { token } = useAuth();
  useTitulo("Auditoría");

  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(null);

  const [kpis, setKpis] = useState({ total: 0, crear: 0, actualizar: 0, eliminar: 0 });

  const [refreshKey, setRefreshKey] = useState(0);

  const [busqueda,      setBusqueda]      = useState("");
  const [filtroAccion,  setFiltroAccion]  = useState("");
  const [filtroRecurso, setFiltroRecurso] = useState("");
  const [modoKPI,       setModoKPI]       = useState("all");
  const [paginaActual,  setPaginaActual]  = useState(1);

  const [logSeleccionado,    setLogSeleccionado]    = useState(null);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);

  const handleVerDetalle = (log) => {
    setLogSeleccionado(log);
    setIsDetalleModalOpen(true);
  };

  const fetchAuth = useCallback(
    (url) =>
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    const fetchKpis = async () => {
      try {
        const res  = await fetchAuth(`${API_URL}/audit?page=1&limit=50`);
        if (!res.ok) return;
        const data = await res.json();
        const todos      = data.items || [];
        const crear      = todos.filter((l) => l.action === "CREATE").length;
        const actualizar = todos.filter((l) => l.action === "UPDATE" || l.action === "TOGGLE_ACTIVE").length;
        const eliminar   = todos.filter((l) => l.action === "DELETE").length;
        setKpis({ total: data.total ?? todos.length, crear, actualizar, eliminar });
      } catch { /* silencioso */ }
    };
    fetchKpis();
  }, [token, refreshKey, fetchAuth]);

  useEffect(() => {
    if (!token) return;
    const fetchLogs = async () => {
      try {
        setCargando(true);
        setError(null);
        const params = new URLSearchParams({
          page:  String(paginaActual),
          limit: String(LIMIT),
          ...(busqueda      && { q:        busqueda      }),
          ...(filtroAccion  && { action:   filtroAccion  }),
          ...(filtroRecurso && { resource: filtroRecurso }),
        });
        const res = await fetchAuth(`${API_URL}/audit?${params}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Error ${res.status}`);
        }
        const data = await res.json();
        setLogs((data.items || []).slice(0, LIMIT));
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchLogs();
  }, [token, busqueda, filtroAccion, filtroRecurso, paginaActual, refreshKey, fetchAuth]);

  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroAccion, filtroRecurso]);

  const textoRango = total === 0
    ? "0"
    : `${(paginaActual - 1) * LIMIT + 1} – ${Math.min(paginaActual * LIMIT, total)}`;

  const handleCambiarPagina = (page) => {
    const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));
    if (page === "‹") setPaginaActual((c) => Math.max(1, c - 1));
    else if (page === "›") setPaginaActual((c) => Math.min(totalPaginas, c + 1));
    else setPaginaActual(Number(page));
  };

  const handleSetFiltroAccion = (v) => {
    setFiltroAccion(v);
    setModoKPI("all");
  };

  const handleKPI = (modo) => {
    setModoKPI(modo);
    setFiltroAccion(modo === "all" ? "" : modo);
  };

  const encabezados = ["Acción", "Recurso", "Resource ID", "Usuario", "Detalles", "Fecha"];

  return (
    <div className="w-full p-4 md:p-6 flex flex-col gap-5 box-border overflow-x-hidden">

      <Encabezado
        titulo="Auditoría"
        onActualizar={() => setRefreshKey((k) => k + 1)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {[
          { id: "all",    label: "Total registros",  value: kpis.total,      sub: "Todos los eventos",                                                                                   accent: "#C9A84C", icon: "bi bi-file-earmark-text" },
          { id: "CREATE", label: "Creaciones",        value: kpis.crear,      sub: kpis.total ? `${Math.round((kpis.crear      / kpis.total) * 100)}% del total` : "—", accent: "#84B140", icon: "bi bi-plus-circle"       },
          { id: "UPDATE", label: "Actualizaciones",   value: kpis.actualizar, sub: kpis.total ? `${Math.round((kpis.actualizar / kpis.total) * 100)}% del total` : "—", accent: "#E0DA66", icon: "bi bi-pencil-square"     },
          { id: "DELETE", label: "Eliminaciones",     value: kpis.eliminar,   sub: kpis.total ? `${Math.round((kpis.eliminar   / kpis.total) * 100)}% del total` : "—", accent: "#D04E37", icon: "bi bi-trash"             },
        ].map((k) => (
          <div
            key={k.id}
            style={{
              opacity:      modoKPI === k.id || modoKPI === "all" ? 1 : 0.55,
              outline:      modoKPI === k.id ? `1.5px solid ${k.accent}40` : "none",
              borderRadius: 2,
              transition:   "opacity 0.2s, outline 0.2s",
            }}
            className="w-full min-w-0"
          >
            <Tarjetas
              label={k.label}
              value={k.value}
              sub={k.sub}
              accent={k.accent}
              icon={k.icon}
              onClick={() => handleKPI(k.id)}
              isActive={modoKPI === k.id}
            />
          </div>
        ))}
      </div>

      <ToolBar
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        placeholderBuscar="Buscar usuario, recurso, ID..."
        filtro={filtroAccion}
        setFiltro={handleSetFiltroAccion}
        opcionesFiltro={OPCIONES_ACCION}
        placeholderFiltro="Todas las acciones"
        filtro2={filtroRecurso}
        setFiltro2={setFiltroRecurso}
        opcionesFiltro2={OPCIONES_RECURSO}
        placeholderFiltro2="Todos los recursos"
      />

      <div className="w-full overflow-x-auto rounded-[2px] shadow-sm">
        <Tabla encabezados={encabezados}>
          {cargando ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)]">
                <i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sm lg:text-base text-rojo">
                <i className="bi bi-exclamation-circle mr-2" />{error}
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)]">
                Sin registros que coincidan con los filtros
              </td>
            </tr>
          ) : (
            logs.map((l) => {
              const detailKeys = Object.keys(l.details || {}).slice(0, 2).join(", ");
              return (
                <tr
                  key={l.id}
                  onClick={() => handleVerDetalle(l)}
                  className="border-b border-[var(--border-gold-20)] hover:bg-[var(--gold-08)] transition-colors cursor-pointer"
                >
                  <td className="p-3 md:p-4 text-center">
                    <ActionBadge action={l.action} />
                  </td>
                  <td className="p-3 md:p-4 text-center">
                    <ResourceBadge resource={l.resource} />
                  </td>
                  <td className="p-3 md:p-4 text-center font-mono text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    {l.resourceId || "—"}
                  </td>
                  <td className="p-3 md:p-4 text-center text-sm lg:text-base font-medium text-[var(--noir)] dark:text-[var(--snow)]">
                    {l.usuario || "—"}
                  </td>
                  <td className="p-3 md:p-4 text-center text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] max-w-[140px] truncate overflow-hidden whitespace-nowrap">
                  {detailKeys || "—"}
                  </td>
                  <td className="p-3 md:p-4 text-center text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    {fmtDateShort(l.createdAt)}
                  </td>
                </tr>
              );
            })
          )}
        </Tabla>
      </div>

      <Paginacion
        paginaActual={paginaActual}
        totalRegistros={total}
        rangoSiguiente={textoRango}
        limit={LIMIT}
        onCambiarPagina={handleCambiarPagina}
        exportTitulo="Auditoría"
        exportColumnas={[
          { header: "Acción",   key: "accion",   width: 16 },
          { header: "Recurso",  key: "recurso",  width: 18 },
          { header: "Usuario",  key: "usuario",  width: 22 },
          { header: "Detalles", key: "detalles", width: 35 },
          { header: "Fecha",    key: "fecha",    width: 22 },
        ]}
        exportFilas={logs.map((l) => ({
          accion:   l.action,
          recurso:  l.resource,
          usuario:  l.usuario  || "—",
          detalles: l.details  ? JSON.stringify(l.details) : "—",
          fecha:    fmtDateShort(l.createdAt || l.timestamp),
        }))}
      />

      <ModalAuditoria
        isOpen={isDetalleModalOpen}
        onClose={() => setIsDetalleModalOpen(false)}
        data={logSeleccionado}
      />

    </div>
  );
}