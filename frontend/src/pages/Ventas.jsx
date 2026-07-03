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

const LIMIT = 10;

// Se conserva exportada: el Dashboard (Dashboard.jsx) la sigue usando
// para su propia gráfica de tendencia de 30 días.
export function generarDatos30Dias(ventas) {
  const hoy = new Date();
  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return { fecha: d, label: String(d.getDate()).padStart(2, "0"), monto: 0 };
  });

  ventas
    .filter((v) => v.estado === "pagado")
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
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado",    label: "Pagados" },
  { value: "cancelado", label: "Cancelados" },
];

const OPCIONES_METODO_PAGO = [
  { value: "tarjeta", label: "Tarjeta" },
  { value: "oxxo",    label: "OXXO" },
  { value: "spei",    label: "SPEI" },
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

// ── Modal simple para registrar una venta manual ──
// Nota: es un formulario mínimo embebido aquí mismo. Si más adelante
// necesitas selección de productos/inventario, conviene extraerlo a un
// componente FormVenta.jsx propio, igual que FormUsuarios.
function ModalNuevaVenta({ onClose, onGuardar, guardando }) {
  const [form, setForm] = useState({
    clienteNombre: "",
    clienteEmail: "",
    total: "",
    metodoPago: "tarjeta",
    estado: "pagado",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar({
      cliente: { nombre: form.clienteNombre, email: form.clienteEmail },
      total: Number(form.total) || 0,
      metodoPago: form.metodoPago,
      estado: form.estado,
    });
  };

  return (
    <div className="fixed inset-0 bg-[var(--noir)]/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-gold-20)]">
          <h3 className="font-display italic text-lg text-[var(--noir)] dark:text-[var(--snow)] m-0">
            Nueva venta
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--noir-soft)] dark:text-[var(--ash)] hover:text-[var(--gold)] transition-colors"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide font-tag mb-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">
              Cliente
            </label>
            <input
              required
              value={form.clienteNombre}
              onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-transparent text-[var(--noir-soft)] dark:text-[var(--snow)] focus:outline-none focus:border-[var(--gold)]"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide font-tag mb-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">
              Email (opcional)
            </label>
            <input
              type="email"
              value={form.clienteEmail}
              onChange={(e) => setForm({ ...form, clienteEmail: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-transparent text-[var(--noir-soft)] dark:text-[var(--snow)] focus:outline-none focus:border-[var(--gold)]"
              placeholder="cliente@correo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide font-tag mb-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">
                Total
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-transparent text-[var(--noir-soft)] dark:text-[var(--snow)] focus:outline-none focus:border-[var(--gold)]"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide font-tag mb-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">
                Método de pago
              </label>
              <select
                value={form.metodoPago}
                onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-transparent text-[var(--noir-soft)] dark:text-[var(--snow)] focus:outline-none focus:border-[var(--gold)]"
              >
                {OPCIONES_METODO_PAGO.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide font-tag mb-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-transparent text-[var(--noir-soft)] dark:text-[var(--snow)] focus:outline-none focus:border-[var(--gold)]"
            >
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] text-[var(--noir-soft)] dark:text-[var(--snow)] hover:bg-[var(--gold-08)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-2.5 text-sm font-bold rounded-[2px] bg-[var(--gold)] text-[var(--noir)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Registrar venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Ventas() {
  const { usuario } = useContext(AuthContext);
  const puedeActualizar = usuario?.permissions?.includes("ventas:update");
  const puedeCrear = usuario?.permissions?.includes("ventas:create") || usuario?.roleId === "role_admin" || usuario?.roleId === "GERENTE";

  const [ventas, setVentas]               = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [filtroEstado, setFiltroEstado]   = useState("");
  const [busqueda, setBusqueda]           = useState("");
  const [paginaActiva, setPaginaActiva]   = useState(1);
  const [ventaDetalle, setVentaDetalle]   = useState(null);
  const [ventaCancelando, setVentaCancelando] = useState(null);
  const [modalExito, setModalExito]       = useState("");
  const [refresh, setRefresh]             = useState(0);
  const [isModalNuevaVentaAbierto, setIsModalNuevaVentaAbierto] = useState(false);
  const [guardandoVenta, setGuardandoVenta] = useState(false);

  useEffect(() => {
    setCargando(true);
    api.get("/ventas?limit=100")
      .then((data) => setVentas(data.items ?? []))
      .catch(() => setVentas([]))
      .finally(() => setCargando(false));
  }, [refresh]);

  useEffect(() => { setPaginaActiva(1); }, [filtroEstado, busqueda]);

  const ventasFiltradas = ventas
    .filter((v) => !filtroEstado || v.estado === filtroEstado)
    .filter((v) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        v.id.toLowerCase().includes(q) ||
        v.cliente?.nombre?.toLowerCase().includes(q) ||
        v.cliente?.email?.toLowerCase().includes(q)
      );
    });

  const totalRegistros = ventasFiltradas.length;
  const inicio = (paginaActiva - 1) * LIMIT;
  const rows = ventasFiltradas.slice(inicio, inicio + LIMIT);

  const ventasPagadas = ventas.filter((v) => v.estado === "pagado");
  const totalIngresos = ventasPagadas.reduce((acc, v) => acc + v.total, 0);

  // ── Indicadores operativos (reemplazan la gráfica; el análisis vive en el Dashboard) ──
  const ventasHoy      = ventas.filter((v) => esHoy(v.createdAt)).length;
  const ingresosHoy     = ventas.filter((v) => esHoy(v.createdAt) && v.estado === "pagado").reduce((a, v) => a + v.total, 0);
  const ticketPromedio  = ventasPagadas.length > 0 ? totalIngresos / ventasPagadas.length : 0;
  const productosVendidos = ventas.reduce((a, v) => a + (v.items?.reduce((s, i) => s + i.cantidad, 0) ?? 0), 0);

  const cambiarPagina = (p) => {
    const totalPaginas = Math.max(1, Math.ceil(totalRegistros / LIMIT));
    if (p === "‹") setPaginaActiva((c) => Math.max(1, c - 1));
    else if (p === "›") setPaginaActiva((c) => Math.min(totalPaginas, c + 1));
    else setPaginaActiva(Number(p));
  };

  const cancelarVenta = async () => {
    if (!ventaCancelando) return;
    try {
      await api.patch(`/ventas/${ventaCancelando.id}/estado`, { estado: "cancelado" });
      setRefresh((r) => r + 1);
      setModalExito("Venta cancelada correctamente");
    } catch {
      window.alert("No se pudo cancelar la venta.");
    } finally {
      setVentaCancelando(null);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/ventas/${id}/estado`, { estado });
      setRefresh((r) => r + 1);
      setModalExito("Estado actualizado correctamente");
      setVentaDetalle(null);
    } catch {
      window.alert("No se pudo actualizar el estado.");
    }
  };

  const registrarVentaManual = async (formData) => {
    try {
      setGuardandoVenta(true);
      await api.post("/ventas", formData);
      setIsModalNuevaVentaAbierto(false);
      setRefresh((r) => r + 1);
      setModalExito("Venta registrada correctamente");
    } catch (err) {
      window.alert(err.message || "No se pudo registrar la venta.");
    } finally {
      setGuardandoVenta(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">

        <Encabezado
          titulo="Ventas"
          onActualizar={() => setRefresh((r) => r + 1)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full mb-2">
          <Tarjetas
            label="Total pedidos"
            value={ventas.length}
            sub="Todos los estados"
            icon="bi bi-bag"
            onClick={() => setFiltroEstado("")}
            isActive={filtroEstado === ""}
          />
          <Tarjetas
            label="Pagados"
            value={ventas.filter((v) => v.estado === "pagado").length}
            sub="Confirmados"
            accent="#A3E378"
            icon="bi bi-check-circle"
            onClick={() => setFiltroEstado("pagado")}
            isActive={filtroEstado === "pagado"}
          />
          <Tarjetas
            label="Pendientes"
            value={ventas.filter((v) => v.estado === "pendiente").length}
            sub="Por procesar"
            accent="#F7CB57"
            icon="bi bi-hourglass-split"
            onClick={() => setFiltroEstado("pendiente")}
            isActive={filtroEstado === "pendiente"}
          />
          <Tarjetas
            label="Cancelados"
            value={ventas.filter((v) => v.estado === "cancelado").length}
            sub="Ventas anuladas"
            accent="#E05C5C"
            icon="bi bi-x-circle"
            onClick={() => setFiltroEstado("cancelado")}
            isActive={filtroEstado === "cancelado"}
          />
          <Tarjetas
            label="Ingresos"
            value={formatMoney(totalIngresos)}
            sub="Solo pagados"
            accent="#D4AF37"
            icon="bi bi-cash-coin"
          />
        </div>

        {/* Resumen operativo del día — reemplaza la gráfica, que ahora vive solo en el Dashboard */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 px-5 py-4 rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] dark:bg-[var(--noir-soft)]">
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
              Ticket promedio
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

        <ToolBar
          filtro={filtroEstado}
          setFiltro={setFiltroEstado}
          opcionesFiltro={OPCIONES_ESTADO}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          placeholderBuscar="Buscar por ID, cliente o email..."
          textoBoton={puedeCrear ? "+ Nueva venta" : null}
          accionBoton={puedeCrear ? () => setIsModalNuevaVentaAbierto(true) : null}
        />

        <Tabla encabezados={["N° Pedido", "Fecha", "Cliente", "Método pago", "Artículos", "Total", "Estado", "Acciones"]}>
          {cargando ? (
            <tr>
              <td colSpan={8} className={`text-center py-10 text-sm opacity-50 transition-colors text-[var(--noir-soft)] dark:text-[var(--snow)]`}>
                Cargando ventas...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={`text-center py-10 text-sm opacity-50 transition-colors text-[var(--noir-soft)] dark:text-[var(--snow)]`}>
                No hay resultados
              </td>
            </tr>
          ) : rows.map((v) => (
            <tr key={v.id} className={`
              border-b transition-colors
              border-[var(--border-gold-20)] hover:bg-[var(--gold-08)]
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
                  tarjeta: <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-azul/10 text-azul border-azul/30">Tarjeta</span>,
                  oxxo:    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amarillo/10 text-amarillo border-amarillo/30">OXXO</span>,
                  spei:    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-verde/10 text-verde border-verde/30">SPEI</span>,
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
              <td className="p-4 align-middle whitespace-nowrap">
                <AccionesTabla
                  onVer={() => setVentaDetalle(v)}
                  onCancelar={
                    puedeActualizar && v.estado !== "cancelado"
                      ? () => setVentaCancelando(v)
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
            { header: "Fecha",   key: "fecha",   width: 14 },
            { header: "Cliente", key: "cliente", width: 28 },
            { header: "Total",   key: "total",   width: 14 },
            { header: "Estado",  key: "estado",  width: 14 },
          ]}
          exportFilas={ventasFiltradas.map((v) => ({
            id:      `#${v.id.slice(0, 8).toUpperCase()}`,
            fecha:   formatFecha(v.createdAt),
            cliente: v.cliente?.nombre ?? "",
            total:   formatMoney(v.total),
            estado:  v.estado,
          }))}
        />

        {ventaDetalle && (
          <ModalVentas
            venta={ventaDetalle}
            puedeActualizar={puedeActualizar}
            onClose={() => setVentaDetalle(null)}
            onCambiarEstado={cambiarEstado}
            onCancelar={(v) => { setVentaDetalle(null); setVentaCancelando(v); }}
          />
        )}

        {isModalNuevaVentaAbierto && (
          <ModalNuevaVenta
            onClose={() => setIsModalNuevaVentaAbierto(false)}
            onGuardar={registrarVentaManual}
            guardando={guardandoVenta}
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
            onCancelar={() => setVentaCancelando(null)}
          />
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