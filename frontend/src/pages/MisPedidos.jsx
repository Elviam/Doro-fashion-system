import { useState, useEffect } from "react";
import Encabezado from "../components/Encabezado";
import Etiquetas from "../components/Etiquetas";
import ModalRecepciones from "../components/ModalRecepciones";
import { fetchPedidos, enviarPedido, ESTADO_PEDIDO_LABELS } from "../services/pedidos.service";
import useTitulo from "../hooks/useTitulo";
import { useAuth } from "../hooks/useAuth";
import { canPerformAction } from "../utils/permissionMapper";

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

function estadoVisualPedido(pedido) {
  if (pedido.status === "BORRADOR") return "Pendiente";
  return ESTADO_PEDIDO_LABELS[pedido.status] || pedido.status;
}

export default function MisPedidos() {
  useTitulo("Mis pedidos");
  const { usuario } = useAuth();
  const puedeEnviar = canPerformAction(usuario?.permissions, "recepciones", "enviar");

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enviandoId, setEnviandoId] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");

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
    } catch (err) {
      console.error("Error al marcar como enviado:", err);
    } finally {
      setEnviandoId(null);
    }
  };

  const terminoBusqueda = busqueda.trim().toLowerCase();
  const pedidosVisibles = pedidos.filter((pedido) => {
    if (!terminoBusqueda) return true;
    const fecha = formatFechaCorta(pedido.sentAt || pedido.fecha || pedido.createdAt).toLowerCase();
    return [pedido.folio, pedido.supplierNombre, fecha].some((valor) => String(valor || "").toLowerCase().includes(terminoBusqueda));
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-8 flex flex-col gap-6 font-body">
      <Encabezado titulo="Mis pedidos" />

      {cargando ? (
        <div className="text-center py-10 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
          <i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando pedidos...
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-10 rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
          <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] italic">Sin pedidos</p>
        </div>
      ) : (
        <>
          <div className="relative"><i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]" /><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, fecha o proveedor..." className="h-11 w-full rounded-[2px] border py-2 pl-9 pr-3 text-sm outline-none bg-[var(--snow)] border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--snow)]" /></div>
          <div className="flex flex-col gap-3">
          {pedidosVisibles.map((pedido) => (
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
                <Etiquetas contenido={estadoVisualPedido(pedido)} />
                {pedido.status === "CONFIRMADA" && (
                  <span className="text-[11px] text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    <span className="block">Confirmado por {pedido.confirmedByNombre || "Admin Sistema"}</span>
                    <span className="block">{formatFechaHora(pedido.confirmedAt)}</span>
                  </span>
                )}
              </div>

              {puedeEnviar && pedido.status === "BORRADOR" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarcarEnviado(pedido.id);
                  }}
                  disabled={enviandoId === pedido.id}
                  className="flex items-center justify-center gap-2 bg-transparent text-[var(--gold-dark)] border border-[var(--border-gold-40)] rounded-[2px] px-4 py-2 text-xs lg:text-sm font-bold font-body transition-all duration-300 active:scale-95 cursor-pointer hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)] disabled:opacity-50 shrink-0"
                >
                  {enviandoId === pedido.id ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-send" />}
                  Marcar como enviado
                </button>
              )}
            </div>
          ))}
          </div>
          {pedidosVisibles.length === 0 && <p className="py-8 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">No se encontraron pedidos.</p>}
        </>
      )}

      <ModalRecepciones
        isOpen={Boolean(pedidoSeleccionado)}
        row={pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
        soloLectura
      />
    </div>
  );
}
