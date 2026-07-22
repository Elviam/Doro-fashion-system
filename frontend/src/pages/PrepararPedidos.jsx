import { useEffect, useState } from "react";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import Modal from "../components/Modal";
import Boton from "../components/Boton";
import Toast from "../components/Toast";
import { useAuth } from "../hooks/useAuth";
import { canPerformAction } from "../utils/permissionMapper";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export default function PrepararPedidos() {
  useTitulo("Preparar pedidos");
  const { usuario } = useAuth();
  const puedeActualizar = canPerformAction(usuario?.permissions, "fulfillment", "update");
  const [pedidos, setPedidos] = useState([]);
  const [pestana, setPestana] = useState("POR_ENVIAR");
  const [seleccionado, setSeleccionado] = useState(null);
  const [cantidadesVerificadas, setCantidadesVerificadas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const cargar = () => {
    setCargando(true);
    api.get("/fulfillment")
      .then((result) => setPedidos(result.items || []))
      .catch((error) => setToast({ message: error.message || "No se pudieron cargar los pedidos.", type: "error" }))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirDetalle = (pedido) => {
    setSeleccionado(pedido);
    setCantidadesVerificadas(Object.fromEntries(pedido.items.map((item) => [item.id, pedido.estado === "ENVIADO" ? item.cantidad : 0])));
  };

  const pedidosPorEnviar = pedidos.filter((pedido) => pedido.estado === "PAGADO");
  const enviadosRecientes = pedidos.filter((pedido) => pedido.estado === "ENVIADO");
  const pedidosVisibles = pestana === "POR_ENVIAR" ? pedidosPorEnviar : enviadosRecientes;
  const esEnviado = seleccionado?.estado === "ENVIADO";
  const totalPiezas = seleccionado?.items.reduce((total, item) => total + item.cantidad, 0) || 0;
  const piezasVerificadas = seleccionado?.items.reduce((total, item) => total + Math.min(cantidadesVerificadas[item.id] || 0, item.cantidad), 0) || 0;
  const todoVerificado = totalPiezas > 0 && piezasVerificadas === totalPiezas;

  const confirmarPreparacionYEnvio = async () => {
    if (!seleccionado || !todoVerificado) return;
    setGuardando(true);
    try {
      const result = await api.patch(`/fulfillment/${seleccionado.id}/dispatch`, {});
      setPedidos((actuales) => actuales.filter((pedido) => pedido.id !== seleccionado.id));
      setSeleccionado(null);
      setToast({ message: `Pedido enviado a paqueteria. Guia simulada: ${result.item.guiaEnvio}`, type: "success" });
    } catch (error) {
      setToast({ message: error.message || "No se pudo registrar el envio.", type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 p-4 sm:p-6 lg:p-8 font-body">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
      <Encabezado titulo="Preparar pedidos" onActualizar={cargar} />

      <section className="rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--snow)] p-4 shadow-sm dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] sm:p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-gold-25)] pb-4 dark:border-[var(--border-gold-20)]">
          <div>
            <div className="flex gap-4" role="tablist" aria-label="Pedidos de bodega">
              <button type="button" role="tab" aria-selected={pestana === "POR_ENVIAR"} onClick={() => setPestana("POR_ENVIAR")} className={`border-b-2 pb-2 text-sm font-semibold transition ${pestana === "POR_ENVIAR" ? "border-[var(--gold-dark)] text-[var(--gold-dark)] dark:border-[var(--gold-light)] dark:text-[var(--gold-light)]" : "border-transparent text-[var(--noir-soft)] dark:text-[var(--ash)]"}`}>Por enviar</button>
              <button type="button" role="tab" aria-selected={pestana === "ENVIADOS"} onClick={() => setPestana("ENVIADOS")} className={`border-b-2 pb-2 text-sm font-semibold transition ${pestana === "ENVIADOS" ? "border-[var(--gold-dark)] text-[var(--gold-dark)] dark:border-[var(--gold-light)] dark:text-[var(--gold-light)]" : "border-transparent text-[var(--noir-soft)] dark:text-[var(--ash)]"}`}>Enviados recientes</button>
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{pestana === "POR_ENVIAR" ? "Pedidos por empaquetar" : "Enviados en los ultimos 10 dias"}</h2>
            <p className="mt-1 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{pestana === "POR_ENVIAR" ? "Verifica las prendas, empaca todo en un solo paquete y confirma el envio a paqueteria." : "Historial de solo lectura. Para incidencias, contacta al administrador."}</p>
          </div>
          <span className="rounded-[2px] bg-[var(--gold-08)] px-3 py-1 text-sm font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{pedidosVisibles.length}</span>
        </div>

        {cargando ? <p className="py-10 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]"><i className="bi bi-arrow-repeat spinner-cargando mr-2 text-[var(--noir-soft)] dark:text-[var(--ash)]" />Cargando pedidos...</p> : pedidosVisibles.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{pestana === "POR_ENVIAR" ? "No hay pedidos por enviar." : "No hay envios recientes."}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pedidosVisibles.map((pedido) => {
              const piezas = pedido.items.reduce((total, item) => total + item.cantidad, 0);
              return <button key={pedido.id} type="button" onClick={() => abrirDetalle(pedido)} className="group rounded-[2px] border border-[var(--border-gold-25)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--border-gold-55)] hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div><p className="font-mono text-sm font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{pedido.numeroPedido}</p><p className="mt-1 text-base font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{pedido.cliente?.nombre || "Cliente"}</p></div>
                  <i className="bi bi-chevron-right text-[var(--gold-dark)] transition-transform group-hover:translate-x-1 dark:text-[var(--gold-light)]" />
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{pedido.cliente?.direccion || "Sin direccion registrada"}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border-gold-20)] pt-3 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]"><span>{pedido.items.length} productos / {piezas} piezas</span><span>{pedido.estado === "ENVIADO" ? `Guia ${pedido.guiaEnvio}` : formatDate(pedido.createdAt)}</span></div>
              </button>;
            })}
          </div>
        )}
      </section>

      <Modal isOpen={Boolean(seleccionado)} onClose={() => !guardando && setSeleccionado(null)} titulo={seleccionado ? `Pedido ${seleccionado.numeroPedido}` : "Pedido"} ancho="max-w-3xl" footer={seleccionado && (
        <div className="flex w-full flex-wrap justify-end gap-3"><Boton variante="secundario" onClick={() => setSeleccionado(null)}>Cerrar</Boton>{puedeActualizar && !esEnviado && <Boton variante="oscuro" onClick={confirmarPreparacionYEnvio} className={!todoVerificado || guardando ? "pointer-events-none opacity-50" : ""}><i className="bi bi-truck" /> {guardando ? "Confirmando..." : "Confirmar preparacion y envio"}</Boton>}</div>
      )}>
        {seleccionado && <div className="space-y-5">
          <div className="grid gap-3 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-4 text-sm sm:grid-cols-2 dark:border-[var(--border-gold-20)]"><p><span className="font-semibold">Cliente:</span> {seleccionado.cliente?.nombre || "-"}</p><p><span className="font-semibold">Pedido creado:</span> {formatDate(seleccionado.createdAt)}</p><p className="sm:col-span-2"><span className="font-semibold">Entrega:</span> {seleccionado.cliente?.direccion || "Sin direccion registrada"}</p>{seleccionado.direccionEntrega?.telefono && <p><span className="font-semibold">Teléfono:</span> {seleccionado.direccionEntrega.telefono}</p>}{seleccionado.direccionEntrega?.referencias && <p className="sm:col-span-2"><span className="font-semibold">Referencias:</span> {seleccionado.direccionEntrega.referencias}</p>}</div>
          {esEnviado && <div className="rounded-[2px] border border-verde/30 bg-verde/10 p-4 text-sm text-[var(--noir)] dark:text-[var(--snow)]"><p className="font-semibold text-verde-dark dark:text-verde"><i className="bi bi-truck mr-2" />Enviado a paqueteria</p><p className="mt-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">Guia: {seleccionado.guiaEnvio || "-"} · Fecha: {formatDate(seleccionado.shippedAt)}</p></div>}
          <div className="rounded-[2px] border border-[var(--gold-dark)]/30 bg-[var(--gold-08)] p-4 text-sm text-[var(--noir)] dark:text-[var(--snow)]"><p className="font-semibold"><i className="bi bi-box-seam mr-2" />{esEnviado ? "Paquete verificado" : "Un solo paquete"}</p><p className="mt-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">{esEnviado ? "Consulta Ventas para el seguimiento o cualquier incidencia." : "Verifica y empaca todas las prendas de este pedido juntas antes de confirmar el envio."}</p><p className="mt-3 font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Progreso: {piezasVerificadas} de {totalPiezas} piezas verificadas</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border-gold-25)]"><div className="h-full bg-[var(--gold-dark)] transition-all" style={{ width: `${totalPiezas ? (piezasVerificadas / totalPiezas) * 100 : 0}%` }} /></div></div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Prendas a reunir</p>
            <div className="space-y-2">
              {seleccionado.items.map((item) => {
                const verificadas = cantidadesVerificadas[item.id] || 0;
                const completa = verificadas === item.cantidad;
                return <div key={item.id} className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[2px] p-3 ${completa ? "bg-verde/10" : "bg-[var(--gold-08)]"}`}>
                  <div className="h-12 w-12 overflow-hidden rounded-[2px] bg-[var(--gold-08)]">{item.imagen ? <img src={item.imagen} alt={item.nombre} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><i className="bi bi-image text-[var(--gold-dark)]" /></div>}</div>
                  <div className="min-w-0"><p className="truncate font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{item.nombre}</p><p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">SKU: {item.sku} · Talla: {item.talla} · Se requieren: {item.cantidad}</p></div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-sm font-bold tabular-nums" aria-label={`${item.cantidad} piezas requeridas`}>{item.cantidad}</span>
                    <label className="flex cursor-pointer items-center" title={completa ? "Producto reunido" : "Marcar todas las piezas como reunidas"}><input type="checkbox" checked={completa} disabled={!puedeActualizar || esEnviado} onChange={(event) => setCantidadesVerificadas((actuales) => ({ ...actuales, [item.id]: event.target.checked ? item.cantidad : 0 }))} aria-label={`Marcar ${item.nombre} como reunido`} className="h-5 w-5 cursor-pointer accent-[var(--gold-dark)] disabled:cursor-not-allowed" /></label>
                  </div>
                </div>;
              })}
            </div>
          </div>
        </div>}
      </Modal>
    </div>
  );
}
