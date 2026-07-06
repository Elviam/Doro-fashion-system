import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { Calendar, User, Package } from "lucide-react";

import useTitulo from "../hooks/useTitulo";

import Encabezado from "../components/Encabezado";
import Tarjetas      from "../components/Tarjetas";
import ToolBar       from "../components/ToolBar";
import Tabla         from "../components/Tabla";
import AccionesTabla from "../components/AccionesTabla";
import Etiquetas     from "../components/Etiquetas";
import Paginacion    from "../components/Paginacion";
import ModalConfirmacion from "../components/ModalConfirmacion";
import ModalRecepciones from "../components/ModalRecepciones";
import FormRecepciones from "../components/FormRecepciones";

const LIMIT = 10;

const ENCABEZADOS = ["Folio", "Factura", "Proveedor", "Fecha", "Recibió", "Items", "Total", "Estado", "Acciones"];

const ESTADO_LABELS = { BORRADOR: "Borrador", CONFIRMADA: "Confirmada", CANCELADA: "Cancelada" };

const OPCIONES_FILTRO = [
  { value: "",           label: "Todos"       },
  { value: "CONFIRMADA", label: "Confirmadas" },
  { value: "BORRADOR",   label: "Borrador"    },
  { value: "CANCELADA",  label: "Canceladas"  },
];

function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-MX")}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  if (iso.includes("-")) {
    const [year, month, day] = iso.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }
  if (iso.includes("/")) {
    const [dia, mes, anio] = iso.split("/");
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
  }
  return iso;
}

export default function Recepciones() {
  useTitulo("Recepciones");

  const [rows, setRows]                       = useState([]);
  const [stats, setStats]                     = useState({ total: 0, confirmadas: 0, borrador: 0, estaSemana: 0, piezas: 0 });
  const [filtro, setFiltro]                   = useState("");
  const [busqueda, setBusqueda]               = useState("");
  const [paginaActiva, setPaginaActiva]       = useState(1);
  const [totalRegistros, setTotalRegistros]   = useState(0);
  const [rowSeleccionada, setRowSeleccionada] = useState(null);
  const [rowEditando, setRowEditando]         = useState(null);
  const [rowEliminando, setRowEliminando]     = useState(null);
  const [rowCancelando, setRowCancelando]     = useState(null);
  const [mostrarNueva, setMostrarNueva]       = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [refresh, setRefresh]                 = useState(0);
  const [modalExito, setModalExito]           = useState("");
  const [filtroTiempo, setFiltroTiempo]       = useState("semana");

  const refetch = useCallback(() => setRefresh((r) => r + 1), []);

  useEffect(() => {
    const params = new URLSearchParams({ page: paginaActiva, limit: LIMIT });
    if (filtro)   params.set("status", filtro);
    if (busqueda) params.set("q", busqueda);

    api.get(`/recepciones?${params}`)
      .then((res) => { setRows(res.items); setTotalRegistros(res.total); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paginaActiva, filtro, busqueda, refresh]);

  useEffect(() => {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const fechaInicio = hace7Dias.toISOString();

    Promise.all([
      api.get("/recepciones?limit=1"),
      api.get("/recepciones?status=CONFIRMADA&limit=1"),
      api.get("/recepciones?status=BORRADOR&limit=1"),
      api.get(`/recepciones?limit=1&fechaDesde=${fechaInicio}`),
      // Nota: para "piezas totales" se traen hasta 500 recepciones confirmadas
      // y se suman en el cliente. Suficiente para el volumen actual del negocio;
      // si crece mucho, conviene mover este cálculo a un endpoint agregado.
      api.get("/recepciones?status=CONFIRMADA&limit=500"),
    ]).then(([all, confirmadas, borrador, semana, confirmadasFull]) => {
      const piezas = confirmadasFull.items.reduce((acc, r) => acc + (r.piezasTotales || 0), 0);
      setStats({ total: all.total, confirmadas: confirmadas.total, borrador: borrador.total, estaSemana: semana.total, piezas });
    }).catch(console.error);
  }, [refresh]);

  const totalPaginas = Math.ceil(totalRegistros / LIMIT);

  const handleCambiarPagina = (p) => {
    if (p === "‹") setPaginaActiva((prev) => Math.max(1, prev - 1));
    else if (p === "›") setPaginaActiva((prev) => Math.min(totalPaginas, prev + 1));
    else setPaginaActiva(Number(p));
  };

  const handleConfirmar = (id) => {
    api.patch(`/recepciones/${id}/confirm`)
      .then(() => { setRowSeleccionada(null); refetch(); setModalExito("Recepción confirmada correctamente"); })
      .catch((err) => window.alert(err.message || "No se pudo confirmar la recepción."));
  };

  const handleCancelar = () => {
    if (!rowCancelando) return;
    api.patch(`/recepciones/${rowCancelando.id}/cancel`)
      .then(() => { setRowSeleccionada(null); refetch(); setModalExito("Recepción cancelada correctamente"); })
      .catch((err) => window.alert(err.message || "No se pudo cancelar la recepción."))
      .finally(() => setRowCancelando(null));
  };

  const handleEliminar = (id) => {
    api.delete(`/recepciones/${id}`)
      .then(() => { refetch(); setModalExito("Recepción eliminada correctamente"); })
      .catch((err) => window.alert(err.message || "No se pudo eliminar la recepción."));
  };

  const plantillaNueva = {
    id: null, folio: "", facturaProveedor: "", supplierNombre: "", supplierId: "",
    fecha: new Date().toISOString().split("T")[0],
    comentarios: "", status: "BORRADOR", total: 0,
    createdAt: null, updatedAt: null,
    items: [{ productId: "", sku: "", productNombre: "", imagen: "", talla: "", cantidad: 1, costoUnitario: 0, subtotal: 0 }],
  };

  const rango = totalRegistros === 0
    ? "0"
    : `${(paginaActiva - 1) * LIMIT + 1} – ${Math.min(paginaActiva * LIMIT, totalRegistros)}`;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">

        <Encabezado titulo="Recepciones" onActualizar={refetch} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full mb-8 -mt-6!">
          <Tarjetas
            label="Total de recepciones" value={stats.total} sub="Todas" accent="#717171" icon="bi bi-layers"
            onClick={() => { setFiltro(""); setFiltroTiempo("todos"); setPaginaActiva(1); }}
            isActive={filtro === "" && filtroTiempo === "todos"}
          />
          <Tarjetas
            label="Recientes" value={stats.estaSemana} sub="Últimos 7 días" accent="#805d85" icon="bi bi-calendar-event"
            onClick={() => { setFiltro(""); setFiltroTiempo(filtroTiempo === "semana" ? "todos" : "semana"); setPaginaActiva(1); }}
            isActive={filtroTiempo === "semana"}
          />
          <Tarjetas
            label="Confirmadas" value={stats.confirmadas}
            sub={`${stats.total ? Math.round(stats.confirmadas / stats.total * 100) : 0}% del total`}
            accent="#8DB051" icon="bi bi-check-circle"
            onClick={() => { setFiltroTiempo("todos"); setFiltro(filtro === "CONFIRMADA" ? "" : "CONFIRMADA"); setPaginaActiva(1); }}
            isActive={filtro === "CONFIRMADA"}
          />
          <Tarjetas
            label="Borrador" value={stats.borrador} sub="Pendientes de confirmar" accent="#bf9d40" icon="bi bi-pencil-square"
            onClick={() => { setFiltroTiempo("todos"); setFiltro(filtro === "BORRADOR" ? "" : "BORRADOR"); setPaginaActiva(1); }}
            isActive={filtro === "BORRADOR"}
          />
          <Tarjetas
            label="Piezas recibidas" value={stats.piezas} sub="Solo confirmadas" accent="#3a86bc" icon="bi bi-boxes"
          />
        </div>

        <ToolBar
          filtro={filtro}
          setFiltro={(v) => { setFiltro(v); setPaginaActiva(1); }}
          opcionesFiltro={OPCIONES_FILTRO}
          busqueda={busqueda}
          setBusqueda={(v) => { setBusqueda(v); setPaginaActiva(1); }}
          placeholderBuscar="Buscar por folio, factura, proveedor o SKU..."
          textoBoton="+ Recepción"
          accionBoton={() => setMostrarNueva(true)}
        />

        <Tabla encabezados={ENCABEZADOS}>
          {loading ? (
            <tr><td colSpan={9} className="text-center py-10 text-sm opacity-50">Cargando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-10 text-sm opacity-50">Sin resultados</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors">
              <td className="p-4 text-center text-sm font-bold">{row.folio}</td>
              <td className="p-4 text-center text-sm">{row.facturaProveedor || "—"}</td>
              <td className="p-4 text-center text-sm">{row.supplierNombre}</td>
              <td className="p-4 text-center text-sm">{formatDate(row.fecha)}</td>
              <td className="p-4 text-center text-sm">{row.recibidoPor || row.createdBy || "—"}</td>
              <td className="p-4 text-center text-sm">{row.items.length} ({row.piezasTotales} pzas.)</td>
              <td className="p-4 text-center text-sm font-bold text-verde">{formatMoney(row.total)}</td>
              <td className="p-4 text-center">
                <Etiquetas contenido={ESTADO_LABELS[row.status] || row.status} />
              </td>
              <td className="p-4 text-center">
                <AccionesTabla
                  onVer={() => setRowSeleccionada(row)}
                  onEditar={row.status === "BORRADOR" ? () => setRowEditando(row) : undefined}
                  onEliminar={row.status === "BORRADOR" ? () => setRowEliminando(row) : undefined}
                />
              </td>
            </tr>
          ))}
        </Tabla>

        <Paginacion
          paginaActual={paginaActiva}
          totalRegistros={totalRegistros}
          rangoSiguiente={rango}
          limit={LIMIT}
          onCambiarPagina={handleCambiarPagina}
          exportTitulo="Recepciones"
          exportColumnas={[
            { header: "Folio",     key: "folio",     width: 15 },
            { header: "Factura",   key: "factura",   width: 18 },
            { header: "Proveedor", key: "proveedor", width: 28 },
            { header: "Fecha",     key: "fecha",     width: 15 },
            { header: "Recibió",   key: "recibio",   width: 20 },
            { header: "Piezas",    key: "piezas",    width: 10 },
            { header: "Total",     key: "total",     width: 15 },
            { header: "Estado",    key: "estado",    width: 15 },
          ]}
          exportFilas={rows.map((r) => ({
            folio:     r.folio,
            factura:   r.facturaProveedor || "—",
            proveedor: r.supplierNombre,
            fecha:     formatDate(r.fecha),
            recibio:   r.recibidoPor || r.createdBy || "—",
            piezas:    r.piezasTotales,
            total:     formatMoney(r.total),
            estado:    ESTADO_LABELS[r.status] || r.status,
          }))}
        />

      </div>

      {rowSeleccionada && (
        <ModalRecepciones
          isOpen={true}
          row={rowSeleccionada}
          onClose={() => setRowSeleccionada(null)}
          onConfirmar={handleConfirmar}
          onCancelar={(r) => { setRowSeleccionada(null); setRowCancelando(r); }}
          onEditar={() => { setRowEditando(rowSeleccionada); setRowSeleccionada(null); }}
          onEliminar={() => { setRowEliminando(rowSeleccionada); setRowSeleccionada(null); }}
        />
      )}

      {rowEditando && (
        <FormRecepciones
          isOpen={true} row={rowEditando} esNuevo={false}
          onClose={() => setRowEditando(null)}
          onGuardar={() => { refetch(); setModalExito("Recepción actualizada correctamente"); }}
        />
      )}

      {mostrarNueva && (
        <FormRecepciones
          isOpen={true} row={plantillaNueva} esNuevo={true}
          onClose={() => setMostrarNueva(false)}
          onGuardar={() => { refetch(); setMostrarNueva(false); setModalExito("Recepción creada correctamente"); }}
        />
      )}

      {rowEliminando && (
        <ModalConfirmacion
          isOpen={true} tipo="eliminar"
          titulo="¿Seguro que quieres eliminar esta recepción?"
          mensaje={`${rowEliminando.folio} — ${rowEliminando.supplierNombre}. Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          onConfirmar={() => { handleEliminar(rowEliminando.id); setRowEliminando(null); }}
          onCancelar={() => setRowEliminando(null)}
        />
      )}

      {rowCancelando && (
        <ModalConfirmacion
          isOpen={true} tipo="eliminar"
          titulo="¿Cancelar esta recepción confirmada?"
          mensaje={`${rowCancelando.folio} — se revertirá el stock que esta recepción había sumado. El registro se conserva como historial cancelado.`}
          textoConfirmar="Cancelar recepción"
          onConfirmar={handleCancelar}
          onCancelar={() => setRowCancelando(null)}
        />
      )}

      {modalExito && (
        <ModalConfirmacion isOpen={true} tipo="exito" titulo={modalExito} onCancelar={() => setModalExito("")} />
      )}
    </div>
  );
}