import { useCallback, useEffect, useState } from "react";
import { staffApi } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import ModalConfirmacion from "../components/ModalConfirmacion";
import ModalRecepciones from "../components/ModalRecepciones";
import Etiquetas from "../components/Etiquetas";
import { useAuth } from "../hooks/useAuth";
import { canPerformAction } from "../utils/permissionMapper";

const LIMIT = 100;
const DIAS_VISIBLES_HISTORIAL = 10;

const ESTADO_LABELS = {
  ENVIADA: "Por confirmar",
  CONFIRMADA: "Recibido",
  CANCELADA: "Cancelada",
};

function formatDate(iso) {
  if (!iso) return "—";

  const fecha = new Date(iso);

  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function esDeLosUltimosDiezDias(recepcion) {
  const fechaEstado =
    recepcion.status === "CONFIRMADA"
      ? recepcion.confirmedAt || recepcion.updatedAt
      : recepcion.canceledAt || recepcion.updatedAt;

  const fecha = new Date(fechaEstado);

  if (Number.isNaN(fecha.getTime())) return false;

  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_VISIBLES_HISTORIAL);

  return fecha >= limite;
}

export default function Recepciones() {
  useTitulo("Recepción de mercancía");

  const { usuario } = useAuth();

  const puedeConfirmar = canPerformAction(
    usuario,
    "recepciones",
    "confirm"
  );

  const puedeCancelar = canPerformAction(
    usuario,
    "recepciones",
    "cancel"
  );

  const limitarHistorial = usuario?.role === "BODEGUERO";

  const [rows, setRows] = useState([]);
  const [filtro, setFiltro] = useState("ENVIADA");
  const [busquedas, setBusquedas] = useState({
    ENVIADA: "",
    CONFIRMADA: "",
    CANCELADA: "",
  });
  const [paginaActiva, setPaginaActiva] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [rowSeleccionada, setRowSeleccionada] = useState(null);
  const [rowCancelando, setRowCancelando] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [modalExito, setModalExito] = useState("");

  const busquedaActiva = busquedas[filtro] || "";

  const refetch = useCallback(
    () => setRefresh((valor) => valor + 1),
    []
  );

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams({
      page: paginaActiva,
      limit: LIMIT,
      origen: "REABASTECIMIENTO",
    });

    if (filtro) {
      params.set("status", filtro);
    }

    if (busquedaActiva) {
      params.set("q", busquedaActiva);
    }

    staffApi
      .get(`/recepciones/pendientes?${params}`)
      .then((res) => {
        const items = (res.items || [])
          .filter((item) => item.status !== "BORRADOR")
          .filter(
            (item) =>
              !limitarHistorial ||
              !["CONFIRMADA", "CANCELADA"].includes(filtro) ||
              esDeLosUltimosDiezDias(item)
          );

        setRows(items);
        setTotalRegistros(items.length);
      })
      .catch(() => {
        setRows([]);
        setTotalRegistros(0);
      })
      .finally(() => setLoading(false));
  }, [
    paginaActiva,
    filtro,
    busquedaActiva,
    refresh,
    limitarHistorial,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / LIMIT)
  );

  const handleConfirmar = async (
    recepcion,
    datosConfirmacion
  ) => {
    const resultado = await staffApi.patch(
      `/recepciones/${recepcion.id}/confirm`,
      datosConfirmacion
    );

    const faltantes = resultado.itemsFaltantes || [];

    setRowSeleccionada(null);
    refetch();

    setModalExito(
      faltantes.length
        ? `Recepción confirmada con ${faltantes.length} incidencia(s).`
        : "Recepción confirmada correctamente."
    );
  };

  const handleCancelar = async () => {
    if (!rowCancelando || cancelando) return;

    try {
      setCancelando(true);

      await staffApi.patch(
        `/recepciones/${rowCancelando.id}/cancel`
      );

      setRowSeleccionada(null);
      refetch();
      setModalExito("Recepción cancelada correctamente.");
    } catch (error) {
      window.alert(
        error.message ||
          "No se pudo cancelar la recepción."
      );
    } finally {
      setCancelando(false);
      setRowCancelando(null);
    }
  };

  const handleAdjuntarFactura = async (
    recepcion,
    datosFactura
  ) => {
    const resultado = await staffApi.patch(
      `/recepciones/${recepcion.id}/factura`,
      datosFactura
    );

    const actualizada =
      resultado.item || resultado.data?.item;

    if (actualizada) {
      setRowSeleccionada(actualizada);
    }

    refetch();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        <Encabezado
          titulo="Recepción de mercancía"
          onActualizar={refetch}
        />

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-gold-25)] pb-4 dark:border-[var(--border-gold-20)]">
            <div>
              <div
                className="flex gap-4"
                role="tablist"
                aria-label="Estado de recepciones"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filtro === "ENVIADA"}
                  onClick={() => {
                    setFiltro("ENVIADA");
                    setPaginaActiva(1);
                  }}
                  className={`border-b-2 pb-2 text-sm font-semibold transition ${
                    filtro === "ENVIADA"
                      ? "border-[var(--gold-dark)] text-[var(--gold-dark)] dark:border-[var(--gold-light)] dark:text-[var(--gold-light)]"
                      : "border-transparent text-[var(--noir-soft)] dark:text-[var(--ash)]"
                  }`}
                >
                  Por confirmar
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={filtro === "CONFIRMADA"}
                  onClick={() => {
                    setFiltro("CONFIRMADA");
                    setPaginaActiva(1);
                  }}
                  className={`border-b-2 pb-2 text-sm font-semibold transition ${
                    filtro === "CONFIRMADA"
                      ? "border-[var(--gold-dark)] text-[var(--gold-dark)] dark:border-[var(--gold-light)] dark:text-[var(--gold-light)]"
                      : "border-transparent text-[var(--noir-soft)] dark:text-[var(--ash)]"
                  }`}
                >
                  Recibidas
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={filtro === "CANCELADA"}
                  onClick={() => {
                    setFiltro("CANCELADA");
                    setPaginaActiva(1);
                  }}
                  className={`border-b-2 pb-2 text-sm font-semibold transition ${
                    filtro === "CANCELADA"
                      ? "border-[var(--gold-dark)] text-[var(--gold-dark)] dark:border-[var(--gold-light)] dark:text-[var(--gold-light)]"
                      : "border-transparent text-[var(--noir-soft)] dark:text-[var(--ash)]"
                  }`}
                >
                  Canceladas
                </button>
              </div>

              <h2 className="mt-3 font-display text-xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">
                {filtro === "CONFIRMADA"
                  ? "Recepciones recibidas"
                  : filtro === "CANCELADA"
                    ? "Recepciones canceladas"
                    : "Recepciones por confirmar"}
              </h2>

              <p className="mt-1 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                {filtro === "CONFIRMADA"
                  ? limitarHistorial
                    ? "Historial de recepciones recibidas durante los últimos 10 días."
                    : "Historial completo de recepciones recibidas."
                  : filtro === "CANCELADA"
                    ? limitarHistorial
                      ? "Historial de recepciones canceladas durante los últimos 10 días."
                      : "Historial completo de recepciones canceladas."
                    : "Confirma la mercancía recibida de tus proveedores."}
              </p>

              <div className="relative mt-4 max-w-md">
                <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />

                <input
                  type="search"
                  value={busquedaActiva}
                  onChange={(event) => {
                    const valor = event.target.value;

                    setBusquedas((actuales) => ({
                      ...actuales,
                      [filtro]: valor,
                    }));

                    setPaginaActiva(1);
                  }}
                  placeholder="Buscar por folio, proveedor, factura o SKU..."
                  className="h-10 w-full rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] py-2 pl-9 pr-3 text-sm text-[var(--noir)] outline-none focus:ring-1 focus:ring-[var(--gold)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)] dark:text-[var(--snow)]"
                />
              </div>
            </div>

            <span className="rounded-[2px] bg-[var(--gold-08)] px-3 py-1 text-sm font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
              {totalRegistros}
            </span>
          </div>

          {loading ? (
            <div className="rounded-[2px] border border-[var(--border-gold-40)] p-10 text-center text-sm text-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
              <i className="bi bi-arrow-repeat mr-2 inline-block animate-spin" />
              Cargando recepciones...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[2px] border border-[var(--border-gold-40)] p-10 text-center text-sm text-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
              No hay recepciones para este filtro.
            </div>
          ) : (
            <div className="grid max-h-[34rem] gap-4 overflow-y-auto pb-20 pr-2 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setRowSeleccionada(row)}
                  className="group relative rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--snow)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--border-gold-55)] hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)]"
                >
                  {row.status === "CONFIRMADA" && (
                    <div className="absolute right-4 top-4">
                      <Etiquetas
                        contenido={ESTADO_LABELS[row.status]}
                      />
                    </div>
                  )}

                  <div
                    className={`mb-3 flex items-start justify-between gap-3 ${
                      row.status === "CONFIRMADA"
                        ? "pr-32"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                        {row.folio}
                      </p>

                      <p className="mt-1 truncate text-base font-semibold text-[var(--noir)] dark:text-[var(--snow)]">
                        {row.supplierNombre ||
                          "Sin proveedor asignado"}
                      </p>
                    </div>

                    {row.status !== "CONFIRMADA" && (
                      <i className="bi bi-chevron-right text-[var(--gold-dark)] transition-transform group-hover:translate-x-1 dark:text-[var(--gold-light)]" />
                    )}
                  </div>

                  <p className="line-clamp-2 min-h-10 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    {row.status === "CONFIRMADA" ? (
                      <>
                        Recibido por{" "}
                        {row.confirmedByNombre ||
                          "Admin Sistema"}{" "}
                        el{" "}
                        {formatDate(
                          row.confirmedAt ||
                            row.updatedAt
                        )}
                      </>
                    ) : (
                      <>
                        Enviado el{" "}
                        {formatDate(
                          row.sentAt || row.createdAt
                        )}{" "}
                        por {row.sentByNombre || "—"}
                      </>
                    )}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-gold-20)] pt-3 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">
                    <span>
                      {row.items?.length || 0} productos /{" "}
                      {row.piezasTotales || 0} piezas
                    </span>

                    <span>
                      {row.status === "CONFIRMADA"
                        ? `Recibido ${formatDate(
                            row.confirmedAt
                          )}`
                        : formatDate(
                            row.sentAt || row.createdAt
                          )}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {totalRegistros > LIMIT && (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={paginaActiva === 1}
              onClick={() =>
                setPaginaActiva((pagina) => pagina - 1)
              }
              className="h-10 rounded-[2px] border border-[var(--border-gold-40)] px-4 text-sm font-bold text-[var(--gold-dark)] disabled:opacity-40 dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
            >
              Anterior
            </button>

            <span className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">
              Página {paginaActiva} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaActiva === totalPaginas}
              onClick={() =>
                setPaginaActiva((pagina) => pagina + 1)
              }
              className="h-10 rounded-[2px] border border-[var(--border-gold-40)] px-4 text-sm font-bold text-[var(--gold-dark)] disabled:opacity-40 dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
            >
              Siguiente
            </button>
          </div>
        )}
      </main>

      {rowSeleccionada && (
        <ModalRecepciones
          isOpen
          row={rowSeleccionada}
          onClose={() => setRowSeleccionada(null)}
          onConfirmar={handleConfirmar}
          onAdjuntarFactura={handleAdjuntarFactura}
          onCancelar={(row) => {
            setRowSeleccionada(null);
            setRowCancelando(row);
          }}
          modoChecklist={
            rowSeleccionada.status === "ENVIADA"
          }
          soloLectura={[
            "CONFIRMADA",
            "CANCELADA",
          ].includes(rowSeleccionada.status)}
          puedeConfirmar={puedeConfirmar}
          puedeCancelar={puedeCancelar}
        />
      )}

      {rowCancelando && (
        <ModalConfirmacion
          isOpen
          tipo="eliminar"
          titulo="¿Desea cancelar la recepción?"
          mensaje={`${rowCancelando.folio} se conservará en el historial como cancelada.`}
          textoConfirmar="Sí, cancelar"
          textoCancelar="No"
          onConfirmar={handleCancelar}
          onCancelar={() => {
            if (!cancelando) {
              setRowCancelando(null);
            }
          }}
          cargando={cancelando}
          textoCargando="Cancelando..."
        />
      )}

      {modalExito && (
        <ModalConfirmacion
          isOpen
          tipo="exito"
          titulo={modalExito}
          onCancelar={() => setModalExito("")}
        />
      )}
    </div>
  );
}