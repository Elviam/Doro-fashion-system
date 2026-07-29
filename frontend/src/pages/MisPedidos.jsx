import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import Etiquetas from "../components/Etiquetas";
import ModalRecepciones from "../components/ModalRecepciones";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Paginacion from "../components/Paginacion";
import { fetchPedidos, enviarPedido, ESTADO_PEDIDO_LABELS } from "../services/pedidos.service";
import useTitulo from "../hooks/useTitulo";
import { useAuth } from "../hooks/useAuth";
import { canPerformAction } from "../utils/permissionMapper";
import FechaMexicoInput from "../components/FechaMexicoInput";

function formatFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function formatFolioPedido(folio) {
  const match = String(folio || "").match(/PED-(\d+)/);
  return match ? `Pedido ${match[1]}` : folio;
}

function formatFechaHora(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const FECHA_MINIMA = "2026-01-01";
const FECHA_MAXIMA = new Date().toISOString().slice(0, 10);
const PEDIDOS_POR_PAGINA = 5;

function fechaParaFiltro(iso) {
  return iso ? String(iso).slice(0, 10) : "";
}

function estadoVisualPedido(pedido) {
  if (pedido.status === "BORRADOR") return "En borrador";
  return ESTADO_PEDIDO_LABELS[pedido.status] || pedido.status;
}

export default function MisPedidos() {
  const navigate = useNavigate();
  useTitulo("Mis pedidos");
  const { usuario } = useAuth();
  const puedeEnviar = canPerformAction(usuario, "pedidos_proveedor", "send");

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enviandoId, setEnviandoId] = useState(null);
  const [pedidoEnviadoExitosamente, setPedidoEnviadoExitosamente] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("BORRADOR");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    setCargando(true);
    fetchPedidos()
      .then((res) => setPedidos(res.items))
      .catch((err) => console.error("Error pedidos:", err))
      .finally(() => setCargando(false));
  }, [refreshKey]);

  const handleMarcarEnviado = async (id) => {
    setEnviandoId(id);
    try {
      await enviarPedido(id);
      setRefreshKey((k) => k + 1);
      setPedidoEnviadoExitosamente(true);
    } catch (err) {
      console.error("Error al marcar como enviado:", err);
    } finally {
      setEnviandoId(null);
    }
  };

  const terminoBusqueda = busqueda.trim().toLowerCase();
  const pedidosVisibles = pedidos.filter((pedido) => {
    if (filtroEstado && pedido.status !== filtroEstado) return false;
    const fechaPedido = fechaParaFiltro(pedido.fecha || pedido.createdAt);
    if (fechaDesde && fechaPedido < fechaDesde) return false;
    if (fechaHasta && fechaPedido > fechaHasta) return false;
    if (!terminoBusqueda) return true;
    const fecha = formatFechaCorta(pedido.sentAt || pedido.fecha || pedido.createdAt).toLowerCase();
    return [pedido.folio, pedido.supplierNombre, fecha].some((valor) => String(valor || "").toLowerCase().includes(terminoBusqueda));
  });
  const inicioPagina = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
  const pedidosPagina = pedidosVisibles.slice(inicioPagina, inicioPagina + PEDIDOS_POR_PAGINA);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-8 flex flex-col gap-6 font-body">
      <Encabezado titulo="Mis pedidos" />

      {cargando ? (
        <div className="text-center py-10 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
          <i className="bi bi-arrow-repeat spinner-cargando mr-2 text-[var(--gold-dark)] dark:text-[var(--gold-light)]" aria-hidden="true" />Cargando pedidos...
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-10 rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
          <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] italic">Sin pedidos</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="relative flex-1"><i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]" /><input type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} placeholder="Buscar por nombre, fecha o proveedor..." className="h-11 w-full rounded-[2px] border py-2 pl-9 pr-3 text-sm outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]" /></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <FechaMexicoInput etiqueta="Desde" value={fechaDesde} onChange={(valor) => { setFechaDesde(valor); setPaginaActual(1); }} min={FECHA_MINIMA} max={fechaHasta || FECHA_MAXIMA} />
              <FechaMexicoInput etiqueta="Hasta" value={fechaHasta} onChange={(valor) => { setFechaHasta(valor); setPaginaActual(1); }} min={fechaDesde || FECHA_MINIMA} max={FECHA_MAXIMA} />
            </div>
            <div className="flex flex-wrap gap-4 border-b border-[var(--border-gold-25)] pt-1 dark:border-[var(--border-gold-20)]" role="tablist" aria-label="Estado de pedidos">
              {[['BORRADOR', 'En borrador'], ['ENVIADA', 'Enviados'], ['CONFIRMADA', 'Recibidos'], ['CANCELADA', 'Cancelados']].map(([estado, etiqueta]) => (
                <button
                  key={estado}
                  type="button"
                  role="tab"
                  aria-selected={filtroEstado === estado}
                  onClick={() => { setFiltroEstado(estado); setPaginaActual(1); }}
                  className={`border-b-2 pb-2 text-sm font-semibold transition ${filtroEstado === estado ? "border-[var(--gold-dark)] text-[var(--gold-dark)] dark:border-[var(--gold-light)] dark:text-[var(--gold-light)]" : "border-transparent text-[var(--noir-soft)] dark:text-[var(--ash)]"}`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
          {pedidosPagina.map((pedido) => (
            <div
              key={pedido.id}
              onClick={() => setPedidoSeleccionado(pedido)}
              className="flex flex-wrap md:flex-nowrap items-center gap-4 rounded-[2px] px-5 py-4 border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] shadow-sm cursor-pointer transition-colors hover:bg-[var(--gold-08)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm lg:text-base font-bold text-[var(--noir)] dark:text-[var(--snow)]">
                  {formatFolioPedido(pedido.folio)} — {formatFechaCorta(pedido.fecha || pedido.createdAt)}
                </p>
                <p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] mt-0.5">
                  {pedido.supplierNombre || "Sin proveedor asignado"} · {pedido.items?.length || 0} producto(s)
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {pedido.status === "CONFIRMADA" && (
                  <span className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    <span className="block">Confirmado por {pedido.confirmedByNombre || "Admin Sistema"}</span>
                    <span className="block">{formatFechaHora(pedido.confirmedAt)}</span>
                  </span>
                )}
                <div className="flex flex-col items-stretch gap-2">
                  <Etiquetas contenido={estadoVisualPedido(pedido)} />
                </div>
              </div>
            </div>
          ))}
          </div>
          {pedidosVisibles.length > PEDIDOS_POR_PAGINA && (
            <Paginacion
              paginaActual={paginaActual}
              totalRegistros={pedidosVisibles.length}
              limit={PEDIDOS_POR_PAGINA}
              mostrarExportar={false}
              onCambiarPagina={(direccion) => {
                const totalPaginas = Math.ceil(pedidosVisibles.length / PEDIDOS_POR_PAGINA);
                if (direccion === "â€¹") setPaginaActual((pagina) => Math.max(1, pagina - 1));
                else if (direccion === "â€º") setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1));
              }}
            />
          )}
          {pedidosVisibles.length === 0 && <p className="py-8 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">No se encontraron pedidos.</p>}
        </>
      )}

      <ModalRecepciones
        isOpen={Boolean(pedidoSeleccionado)}
        row={pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
        soloLectura
        vistaMisPedidos
        puedeEnviar={puedeEnviar}
        enviando={enviandoId === pedidoSeleccionado?.id}
        onEnviar={(pedido) => handleMarcarEnviado(pedido.id)}
        onEditarPedido={(pedido) => {
          setPedidoSeleccionado(null);
          navigate("/reabastecimiento/generar-pedido", { state: { pedidoParaEditar: pedido } });
        }}
      />

      {/* Cancelar/eliminar pertenecen a Recepción y no se exponen como acciones de pedidos a proveedor.
        <ModalConfirmacion
          isOpen
          tipo="eliminar"
          titulo={accionPendiente.tipo === "eliminar" ? "¿Eliminar este borrador?" : "¿Cancelar este pedido?"}
          mensaje={accionPendiente.tipo === "eliminar"
            ? "El borrador se eliminará permanentemente."
            : "El pedido dejará de estar disponible para recepción y quedará registrado como cancelado."}
          textoConfirmar={accionPendiente.tipo === "eliminar" ? "Eliminar pedido" : "Cancelar pedido"}
          onConfirmar={handleConfirmarAccion}
          onCancelar={() => { if (!procesandoAccion) setAccionPendiente(null); }}
          cargando={procesandoAccion}
          textoCargando={accionPendiente.tipo === "eliminar" ? "Eliminando..." : "Cancelando..."}
        />
      */}

      <ModalConfirmacion
        isOpen={pedidoEnviadoExitosamente}
        tipo="exito"
        titulo="Pedido enviado exitosamente"
        onCancelar={() => setPedidoEnviadoExitosamente(false)}
      />
    </div>
  );
}
