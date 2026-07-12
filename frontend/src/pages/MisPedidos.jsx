import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Encabezado from "../components/Encabezado";
import Etiquetas from "../components/Etiquetas";
import { fetchPedidos, enviarPedido, ESTADO_PEDIDO_LABELS } from "../services/pedidos.service";

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

export default function MisPedidos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enviandoId, setEnviandoId] = useState(null);

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

  const tabs = [
    { label: "Resumen", active: location.pathname === "/reabastecimiento", onClick: () => navigate("/reabastecimiento") },
    { label: "Mis pedidos", active: location.pathname === "/reabastecimiento/pedidos", onClick: () => navigate("/reabastecimiento/pedidos") },
    { label: "Generar pedido", active: location.pathname === "/reabastecimiento/generar-pedido", onClick: () => navigate("/reabastecimiento/generar-pedido") },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-body">
      <Encabezado titulo="Reabastecimiento" tabs={tabs} />

      {cargando ? (
        <div className="text-center py-10 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
          <i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando pedidos...
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-10 rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
          <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] italic">Sin pedidos</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="flex flex-wrap md:flex-nowrap items-center gap-4 rounded-[2px] px-5 py-4 border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm lg:text-base font-bold text-[var(--noir)] dark:text-[var(--snow)]">
                  {formatFolioPedido(pedido.folio)} — {formatFechaCorta(pedido.fecha || pedido.createdAt)}
                </p>
                <p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] mt-0.5">
                  {pedido.supplierNombre || "Sin proveedor asignado"} · {pedido.items?.length || 0} producto(s)
                </p>
              </div>

              <Etiquetas contenido={ESTADO_PEDIDO_LABELS[pedido.status] || pedido.status} />

              {pedido.status === "BORRADOR" && (
                <button
                  onClick={() => handleMarcarEnviado(pedido.id)}
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
      )}
    </div>
  );
}