import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import ToolBar from "../components/ToolBar";
import ModalConfirmacion from "../components/ModalConfirmacion";
import ModalRecepciones from "../components/ModalRecepciones";
import Etiquetas from "../components/Etiquetas";
import { useAuth } from "../hooks/useAuth";
import { canPerformAction } from "../utils/permissionMapper";

const LIMIT = 10;

const OPCIONES_FILTRO = [
  { value: "ENVIADA", label: "Por confirmar" },
  { value: "CONFIRMADA", label: "Confirmadas" },
  { value: "CANCELADA", label: "Canceladas" },
  { value: "", label: "Todas" },
];

const ESTADO_LABELS = { BORRADOR: "Borrador", ENVIADA: "Enviada", CONFIRMADA: "Confirmada", CANCELADA: "Cancelada" };

function formatDate(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Recepciones() {
  useTitulo("Recepciones");
  const { usuario } = useAuth();
  const puedeConfirmar = canPerformAction(usuario?.permissions, "recepciones", "confirm");
  const puedeCancelar = canPerformAction(usuario?.permissions, "recepciones", "cancel");

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, porConfirmar: 0, confirmadas: 0 });
  const [filtro, setFiltro] = useState("ENVIADA");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActiva, setPaginaActiva] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [rowSeleccionada, setRowSeleccionada] = useState(null);
  const [rowCancelando, setRowCancelando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [modalExito, setModalExito] = useState("");

  const refetch = useCallback(() => setRefresh((valor) => valor + 1), []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: paginaActiva, limit: LIMIT, origen: "REABASTECIMIENTO" });
    if (filtro) params.set("status", filtro);
    if (busqueda) params.set("q", busqueda);

    api.get(`/recepciones?${params}`)
      .then((res) => {
        setRows(res.items || []);
        setTotalRegistros(res.total || 0);
      })
      .catch(() => {
        setRows([]);
        setTotalRegistros(0);
      })
      .finally(() => setLoading(false));
  }, [paginaActiva, filtro, busqueda, refresh]);

  useEffect(() => {
    const base = "origen=REABASTECIMIENTO&limit=1";
    Promise.all([
      api.get(`/recepciones?${base}`),
      api.get(`/recepciones?${base}&status=ENVIADA`),
      api.get(`/recepciones?${base}&status=CONFIRMADA`),
    ])
      .then(([total, porConfirmar, confirmadas]) => {
        setStats({ total: total.total || 0, porConfirmar: porConfirmar.total || 0, confirmadas: confirmadas.total || 0 });
      })
      .catch(console.error);
  }, [refresh]);

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / LIMIT));

  const handleConfirmar = async (recepcion, datosConfirmacion) => {
    const items = datosConfirmacion.items || [];
    const hayFaltantes = items.some((item) => {
      const pedido = recepcion.items.find((linea) => linea.id === item.id);
      return pedido && Number(item.cantidadRecibida) < Number(pedido.cantidad);
    });

    if (hayFaltantes && !window.confirm("Hay productos con cantidades menores a las pedidas. ¿Deseas confirmar la recepción de todos modos?")) return;

    try {
      const resultado = await api.patch(`/recepciones/${recepcion.id}/confirm`, datosConfirmacion);
      const faltantes = resultado.itemsFaltantes || [];
      setRowSeleccionada(null);
      refetch();
      setModalExito(faltantes.length ? `Recepción confirmada con ${faltantes.length} incidencia(s).` : "Recepción confirmada correctamente.");
    } catch (error) {
      window.alert(error.message || "No se pudo confirmar la recepción.");
    }
  };

  const handleCancelar = async () => {
    if (!rowCancelando) return;
    try {
      await api.patch(`/recepciones/${rowCancelando.id}/cancel`);
      setRowSeleccionada(null);
      refetch();
      setModalExito("Recepción cancelada correctamente.");
    } catch (error) {
      window.alert(error.message || "No se pudo cancelar la recepción.");
    } finally {
      setRowCancelando(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <Encabezado titulo="Recepciones" onActualizar={refetch} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <Tarjetas
            label="Por confirmar"
            value={stats.porConfirmar}
            sub="Pedidos enviados por recibir"
            accent="#bf9d40"
            icon="bi bi-hourglass-split"
            onClick={() => { setFiltro("ENVIADA"); setPaginaActiva(1); }}
            isActive={filtro === "ENVIADA"}
          />
          <Tarjetas
            label="Confirmadas"
            value={stats.confirmadas}
            sub="Recepciones finalizadas"
            accent="#8DB051"
            icon="bi bi-check-circle"
            onClick={() => { setFiltro("CONFIRMADA"); setPaginaActiva(1); }}
            isActive={filtro === "CONFIRMADA"}
          />
          <Tarjetas
            label="Todas las recepciones"
            value={stats.total}
            sub="Historial de pedidos enviados"
            accent="#717171"
            icon="bi bi-layers"
            onClick={() => { setFiltro(""); setPaginaActiva(1); }}
            isActive={filtro === ""}
          />
        </section>

        <ToolBar
          filtro={filtro}
          setFiltro={(valor) => { setFiltro(valor); setPaginaActiva(1); }}
          opcionesFiltro={OPCIONES_FILTRO}
          placeholderFiltro="Estado"
          busqueda={busqueda}
          setBusqueda={(valor) => { setBusqueda(valor); setPaginaActiva(1); }}
          placeholderBuscar="Buscar por folio, proveedor, factura o SKU..."
        />

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                {filtro === "ENVIADA" ? "Recepciones recientes por confirmar" : "Recepciones"}
              </h2>
              <p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Abre una tarjeta para revisar cantidades y confirmar lo que llegó.</p>
            </div>
            <span className="text-xs font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">{totalRegistros} resultado(s)</span>
          </div>

          {loading ? (
            <div className="rounded-[2px] border p-10 text-center text-sm text-[var(--noir-soft)] border-[var(--border-gold-40)] dark:text-[var(--ash)] dark:border-[var(--border-gold-20)]"><i className="bi bi-arrow-repeat mr-2 animate-spin" />Cargando recepciones...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-[2px] border p-10 text-center text-sm text-[var(--noir-soft)] border-[var(--border-gold-40)] dark:text-[var(--ash)] dark:border-[var(--border-gold-20)]">No hay recepciones para este filtro.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setRowSeleccionada(row)}
                  className="flex w-full flex-col gap-3 rounded-[2px] border px-4 py-4 text-left transition-colors hover:bg-[var(--gold-08)] sm:flex-row sm:items-center sm:px-5 bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[var(--noir)] dark:text-[var(--snow)]">{row.folio}</p>
                      <Etiquetas contenido={ESTADO_LABELS[row.status] || row.status} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Enviado el {formatDate(row.sentAt)} por <strong>{row.sentByNombre || "—"}</strong></p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:w-auto sm:text-right">
                    <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Fecha <strong className="ml-1 text-[var(--noir)] dark:text-[var(--snow)]">{formatDate(row.sentAt || row.createdAt)}</strong></p>
                    <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">Productos <strong className="ml-1 text-[var(--noir)] dark:text-[var(--snow)]">{row.items?.length || 0}</strong></p>
                    <p className="col-span-2 text-[var(--noir-soft)] dark:text-[var(--ash)]">Total de piezas <strong className="ml-1 text-[var(--noir)] dark:text-[var(--snow)]">{row.piezasTotales || 0}</strong></p>
                  </div>
                  <i className="bi bi-chevron-right hidden text-[var(--gold-dark)] sm:block dark:text-[var(--gold-light)]" />
                </button>
              ))}
            </div>
          )}
        </section>

        {totalRegistros > LIMIT && (
          <div className="flex items-center justify-end gap-3">
            <button type="button" disabled={paginaActiva === 1} onClick={() => setPaginaActiva((pagina) => pagina - 1)} className="h-10 rounded-[2px] border px-4 text-sm font-bold disabled:opacity-40 border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">Anterior</button>
            <span className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Página {paginaActiva} de {totalPaginas}</span>
            <button type="button" disabled={paginaActiva === totalPaginas} onClick={() => setPaginaActiva((pagina) => pagina + 1)} className="h-10 rounded-[2px] border px-4 text-sm font-bold disabled:opacity-40 border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">Siguiente</button>
          </div>
        )}
      </main>

      {rowSeleccionada && (
        <ModalRecepciones
          isOpen
          row={rowSeleccionada}
          onClose={() => setRowSeleccionada(null)}
          onConfirmar={handleConfirmar}
          onCancelar={(row) => { setRowSeleccionada(null); setRowCancelando(row); }}
          modoChecklist={rowSeleccionada.status === "ENVIADA"}
          puedeConfirmar={puedeConfirmar}
          puedeCancelar={puedeCancelar}
        />
      )}

      {rowCancelando && (
        <ModalConfirmacion
          isOpen
          tipo="eliminar"
          titulo="¿Cancelar esta recepción?"
          mensaje={`${rowCancelando.folio} se conservará en el historial como cancelada.`}
          textoConfirmar="Cancelar recepción"
          onConfirmar={handleCancelar}
          onCancelar={() => setRowCancelando(null)}
        />
      )}

      {modalExito && <ModalConfirmacion isOpen tipo="exito" titulo={modalExito} onCancelar={() => setModalExito("")} />}
    </div>
  );
}
