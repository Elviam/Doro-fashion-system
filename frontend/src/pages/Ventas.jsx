import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Tarjetas from "../components/Tarjetas";
import ToolBar from "../components/ToolBar";
import Tabla from "../components/Tabla";
import AccionesTabla from "../components/AccionesTabla";
import Etiquetas from "../components/Etiquetas";
import Paginacion from "../components/Paginacion";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Encabezado from "../components/Encabezado";
import { api } from "../services/api";
import ModalVentas from "../components/ModalVentas";
import FechaMexicoInput from "../components/FechaMexicoInput";

const LIMIT = 7;

// Se conserva exportada: el Dashboard (Dashboard.jsx) la sigue usando
// para su propia gráfica de tendencia de 30 días.
/* Legacy chart helper removed: sales analytics now live in the Dashboard API. */
export function generarDatos30Dias(ventas) {
  const hoy = new Date();
  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return { fecha: d, label: String(d.getDate()).padStart(2, "0"), monto: 0 };
  });

  ventas
    .filter((v) => v.estado === "PAGADO")
    .forEach((v) => {
      const fecha = new Date(v.createdAt);
      fecha.setHours(0, 0, 0, 0);
      const idx = dias.findIndex((d) => d.fecha.getTime() === fecha.getTime());
      if (idx !== -1) dias[idx].monto += v.total;
    });

  return dias;
}

const OPCIONES_ESTADO = [
  { value: "",          label: "Todos" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "PAGADO",    label: "Pagados" },
  { value: "ENVIADO",   label: "Enviados" },
  { value: "CANCELADO", label: "Cancelados" },
];
const OPCIONES_PAGO = [
  { value: "", label: "Todos los pagos" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "oxxo", label: "OXXO" },
  { value: "spei", label: "SPEI" },
];

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const esHoy = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const hoy = new Date();
  return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
};

const formatMoney = (n) => `$${Number(n ?? 0).toLocaleString("es-MX")}`;

export default function Ventas() {
  const { usuario } = useContext(AuthContext);
  const puedeActualizar = usuario?.permissions?.includes("ventas:update");

  const [ventas, setVentas]               = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [filtroEstado, setFiltroEstado]   = useState("");
  const [filtroPago, setFiltroPago]       = useState("");
  const [busqueda, setBusqueda]           = useState("");
  const [desde, setDesde]                 = useState("");
  const [hasta, setHasta]                 = useState("");
  const [resumen, setResumen]             = useState({ total: 0, estados: {} });
  const [error, setError]                 = useState("");
  const [paginaActiva, setPaginaActiva]   = useState(1);
  const [ventaDetalle, setVentaDetalle]   = useState(null);
  const [ventaCancelando, setVentaCancelando] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [modalExito, setModalExito]       = useState("");
  const [refresh, setRefresh]             = useState(0);

  useEffect(() => {
    setCargando(true);
    const params = new URLSearchParams({ page: paginaActiva, limit: LIMIT, q: busqueda, estado: filtroEstado, metodoPago: filtroPago, desde, hasta });
    api.get(`/ventas?${params}`)
      .then((pagina) => {
        const items = pagina.items ?? [];
        setVentas(items);
        setVentaDetalle((actual) => actual ? items.find((venta) => venta.id === actual.id) || actual : actual);
        setResumen({ total: pagina.total ?? 0, estados: pagina.estados ?? {} });
        setError("");
      })
      .catch(() => { setVentas([]); setResumen({ total: 0, estados: {} }); setError("No se pudieron cargar las ventas."); })
      .finally(() => setCargando(false));
  }, [refresh, paginaActiva, filtroEstado, filtroPago, busqueda, desde, hasta]);

  useEffect(() => { setPaginaActiva(1); }, [filtroEstado, filtroPago, busqueda, desde, hasta]);

  useEffect(() => {
    if (ventaDetalle?.estadoEnvio !== "EN_TRANSITO") return undefined;
    const intervalo = window.setInterval(() => setRefresh((actual) => actual + 1), 3_000);
    return () => window.clearInterval(intervalo);
  }, [ventaDetalle?.estadoEnvio]);

  const totalRegistros = resumen.total;
  const inicio = (paginaActiva - 1) * LIMIT;
  const rows = ventas;

  const ventasConfirmadas = ventas.filter((v) => ["PAGADO", "ENVIADO"].includes(v.estado));
  const totalIngresos = ventasConfirmadas.reduce((acc, v) => acc + v.total, 0);

  // ── Indicadores operativos (reemplazan la gráfica; el análisis vive en el Dashboard) ──
  const ventasHoy      = ventas.filter((v) => esHoy(v.createdAt)).length;
  const ingresosHoy     = ventas.filter((v) => esHoy(v.createdAt) && ["PAGADO", "ENVIADO"].includes(v.estado)).reduce((a, v) => a + v.total, 0);
  const ticketPromedio  = ventasConfirmadas.length > 0 ? totalIngresos / ventasConfirmadas.length : 0;
  const productosVendidos = ventasConfirmadas.reduce((a, v) => a + (v.items?.reduce((s, i) => s + i.cantidad, 0) ?? 0), 0);

  const cambiarPagina = (p) => {
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / LIMIT));
    if (p === "‹") setPaginaActiva((c) => Math.max(1, c - 1));
    else if (p === "›") setPaginaActiva((c) => Math.min(totalPaginas, c + 1));
    else setPaginaActiva(Number(p));
  };

  const cancelarVenta = async () => {
    if (!ventaCancelando || cancelando) return;
    setCancelando(true);
    try {
      await api.patch(`/ventas/${ventaCancelando.id}/estado`, { estado: "CANCELADO", motivoCancelacion: motivoCancelacion.trim() });
      setRefresh((r) => r + 1);
      setModalExito("Venta cancelada correctamente");
    } catch {
      window.alert("No se pudo cancelar la venta.");
    } finally {
      setCancelando(false);
      setVentaCancelando(null);
      setMotivoCancelacion("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">

        <Encabezado
          titulo="Ventas"
          onActualizar={() => setRefresh((r) => r + 1)}
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 w-full mb-2">
          <Tarjetas
            label="Total pedidos"
            value={resumen.total}
            sub="Todos los estados"
            icon="bi bi-bag"
            onClick={() => setFiltroEstado("")}
            isActive={filtroEstado === ""}
          />
          <Tarjetas
            label="Pagados"
            value={resumen.estados.PAGADO || 0}
            sub="Confirmados"
            accent="#64a838"
            icon="bi bi-check-circle"
            onClick={() => setFiltroEstado("PAGADO")}
            isActive={filtroEstado === "PAGADO"}
          />
          <Tarjetas
            label="Pendientes"
            value={resumen.estados.PENDIENTE || 0}
            sub="Por procesar"
            accent="#F7CB57"
            icon="bi bi-hourglass-split"
            onClick={() => setFiltroEstado("PENDIENTE")}
            isActive={filtroEstado === "PENDIENTE"}
          />
          <Tarjetas
            label="Cancelados"
            value={resumen.estados.CANCELADO || 0}
            sub="Ventas anuladas"
            accent="#E05C5C"
            icon="bi bi-x-circle"
            onClick={() => setFiltroEstado("CANCELADO")}
            isActive={filtroEstado === "CANCELADO"}
          />
          <Tarjetas
            label="Enviados"
            value={resumen.estados.ENVIADO || 0}
            sub="En camino al cliente"
            accent="#3a86bc"
            icon="bi bi-truck"
            onClick={() => setFiltroEstado("ENVIADO")}
            isActive={filtroEstado === "ENVIADO"}
          />
        </div>

        {/* Resumen operativo del día — reemplaza la gráfica, que ahora vive solo en el Dashboard */}
        <div className="hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[2px] font-tag font-semibold text-[var(--noir-soft)]/70 dark:text-[var(--ash)] mb-0.5">
              Ventas de hoy
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)] m-0">
              {ventasHoy}
            </p>
          </div>
          <div className="w-px bg-[var(--border-gold-20)] hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-[2px] font-tag font-semibold text-[var(--noir-soft)]/70 dark:text-[var(--ash)] mb-0.5">
              Ingresos de hoy
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--gold-dark)] dark:text-[var(--gold)] m-0">
              {formatMoney(ingresosHoy)}
            </p>
          </div>
          <div className="w-px bg-[var(--border-gold-20)] hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-[2px] font-tag font-semibold text-[var(--noir-soft)]/70 dark:text-[var(--ash)] mb-0.5">
              Compra promedio
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)] m-0">
              {formatMoney(ticketPromedio)}
            </p>
          </div>
          <div className="w-px bg-[var(--border-gold-20)] hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-[2px] font-tag font-semibold text-[var(--noir-soft)]/70 dark:text-[var(--ash)] mb-0.5">
              Productos vendidos
            </p>
            <p className="text-lg font-bold tabular-nums text-[var(--noir)] dark:text-[var(--snow)] m-0">
              {productosVendidos}
            </p>
          </div>
        </div>

        {error && <p className="rounded-[2px] border border-rojo/30 bg-rojo/10 px-4 py-3 text-sm text-rojo">{error}</p>}
        <div className="flex flex-wrap items-end gap-3 rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]">
          <FechaMexicoInput etiqueta="Desde" value={desde} onChange={setDesde} />
          <FechaMexicoInput etiqueta="Hasta" value={hasta} onChange={setHasta} min={desde || "2026-01-01"} />
          {(desde || hasta) && <button type="button" onClick={() => { setDesde(""); setHasta(""); }} className="h-9 rounded-[2px] border border-[var(--border-gold-40)] px-3 text-xs font-semibold text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">Limpiar fechas</button>}
        </div>
        <ToolBar
          filtro={filtroEstado}
          setFiltro={setFiltroEstado}
          opcionesFiltro={OPCIONES_ESTADO}
          filtro2={filtroPago}
          setFiltro2={setFiltroPago}
          opcionesFiltro2={OPCIONES_PAGO}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          placeholderBuscar="Buscar por ID, cliente o email..."
        />

        <Tabla encabezados={["N° Pedido", "Fecha", "Cliente", "Método pago", "Artículos", "Total", "Estado", "Acciones"]}>
          {cargando ? (
            <tr>
              <td colSpan={8} className={`text-center py-10 text-sm transition-colors text-[var(--noir-soft)] dark:text-[var(--ash)]`}>
                <i className="bi bi-arrow-repeat spinner-cargando mr-2 text-[var(--noir-soft)] dark:text-[var(--ash)]" />Cargando ventas...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={`text-center py-10 text-sm opacity-50 transition-colors text-[var(--noir-soft)] dark:text-[var(--snow)]`}>
                No hay resultados
              </td>
            </tr>
          ) : rows.map((v) => (
            <tr key={v.id} onClick={() => setVentaDetalle(v)} className={`
              border-b transition-colors
              cursor-pointer border-[var(--border-gold-20)] hover:bg-[var(--gold-08)]
              dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold-08)]
            `}>
              <td className="p-4 text-center text-sm font-poppins font-bold whitespace-nowrap transition-colors text-[var(--gold-dark)] dark:text-[var(--gold)]">
                {v.numeroPedido || `#${v.id.slice(0, 8).toUpperCase()}`}
              </td>
              <td className="p-4 text-center text-sm whitespace-nowrap text-[var(--noir-soft)] dark:text-[var(--snow)]">
                {formatFecha(v.createdAt)}
              </td>
              <td className="p-4 text-center text-sm whitespace-nowrap">
                <div className="leading-tight">
                  <div className="font-medium text-[var(--noir-soft)] dark:text-[var(--snow)]">{v.cliente?.nombre}</div>
                  <div className="text-xs transition-colors text-[var(--noir-soft)]/60 dark:text-[var(--ash)]/70">{v.cliente?.email}</div>
                </div>
              </td>
              <td className="p-4 text-center whitespace-nowrap">
                {{
                  tarjeta: <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-azul/10 text-azul-dark dark:text-azul border-azul/30">Tarjeta</span>,
                  oxxo:    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amarillo/10 text-amarillo-dark dark:text-amarillo border-amarillo/30">OXXO</span>,
                  spei:    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-verde/10 text-verde-dark dark:text-verde border-verde/30">SPEI</span>,
                }[v.metodoPago] ?? <span className="text-sm capitalize">{v.metodoPago}</span>}
              </td>
              <td className="p-4 text-center text-sm whitespace-nowrap text-[var(--noir-soft)] dark:text-[var(--snow)]">
                {v.items?.reduce((a, i) => a + i.cantidad, 0) ?? 0} uds.
              </td>
              <td className="p-4 text-center text-sm font-bold whitespace-nowrap tabular-nums text-[var(--gold-dark)] dark:text-[var(--gold)]">
                {formatMoney(v.total)}
              </td>
              <td className="p-4 text-center whitespace-nowrap">
                <Etiquetas contenido={v.estado} />
              </td>
              <td onClick={(event) => event.stopPropagation()} className="p-4 align-middle whitespace-nowrap">
                <AccionesTabla
                  onVer={() => setVentaDetalle(v)}
                  onCancelar={
                    puedeActualizar && v.estado !== "CANCELADO"
                      ? () => { setVentaCancelando(v); setMotivoCancelacion(""); }
                      : null
                  }
                />
              </td>
            </tr>
          ))}
        </Tabla>

        <Paginacion
          paginaActual={paginaActiva}
          totalRegistros={totalRegistros}
          rangoSiguiente={`${totalRegistros === 0 ? 0 : inicio + 1} – ${Math.min(inicio + LIMIT, totalRegistros)}`}
          limit={LIMIT}
          onCambiarPagina={cambiarPagina}
          exportTitulo="Ventas"
          exportColumnas={[
            { header: "ID",      key: "id",      width: 12 },
            { header: "Pedido",  key: "pedido",  width: 18 },
            { header: "Fecha",   key: "fecha",   width: 14 },
            { header: "Cliente", key: "cliente", width: 28 },
            { header: "Método pago", key: "metodo", width: 16 },
            { header: "Artículos", key: "articulos", width: 12 },
            { header: "Total",   key: "total",   width: 14 },
            { header: "Estado",  key: "estado",  width: 14 },
          ]}
          exportFilas={ventas.map((v) => ({
            id:      `#${v.id.slice(0, 8).toUpperCase()}`,
            pedido:  v.numeroPedido,
            fecha:   formatFecha(v.createdAt),
            cliente: v.cliente?.nombre ?? "",
            metodo:  v.metodoPago,
            articulos: v.items?.reduce((total, item) => total + item.cantidad, 0) ?? 0,
            total:   formatMoney(v.total),
            estado:  v.estado,
          }))}
        />

        {ventaDetalle && (
          <ModalVentas
            venta={ventaDetalle}
            puedeActualizar={puedeActualizar}
            onClose={() => setVentaDetalle(null)}
            onCancelar={(v) => { setVentaDetalle(null); setVentaCancelando(v); setMotivoCancelacion(""); }}
          />
        )}

        {ventaCancelando && (
          <ModalConfirmacion
            isOpen={true}
            tipo="eliminar"
            titulo="¿Cancelar esta venta?"
            mensaje={`La venta de ${ventaCancelando.cliente?.nombre} por ${formatMoney(ventaCancelando.total)} será marcada como cancelada.`}
            textoConfirmar="Cancelar venta"
            onConfirmar={cancelarVenta}
            onCancelar={() => { if (cancelando) return; setVentaCancelando(null); setMotivoCancelacion(""); }}
            cargando={cancelando}
            deshabilitarConfirmar={motivoCancelacion.trim().length < 5}
          >
            <label className="mt-2 block">
              <span className="font-tag text-xs font-bold uppercase tracking-wide text-[var(--noir-soft)] dark:text-[var(--ash)]">Motivo de cancelación</span>
              <textarea value={motivoCancelacion} onChange={(event) => setMotivoCancelacion(event.target.value)} maxLength={300} rows={3} placeholder="Ej. Solicitud del cliente" className="mt-2 w-full resize-none rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] p-3 font-body text-sm text-[var(--noir)] outline-none focus:border-[var(--gold-dark)] dark:bg-[var(--noir-soft)] dark:text-[var(--snow)]" />
              <span className="mt-1 block text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Uso interno. El cliente solo verá que el pedido fue cancelado.</span>
            </label>
          </ModalConfirmacion>
        )}

        {modalExito && (
          <ModalConfirmacion
            isOpen={true}
            tipo="exito"
            titulo={modalExito}
            onCancelar={() => setModalExito("")}
          />
        )}

      </div>
    </div>
  );
}
