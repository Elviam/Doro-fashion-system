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
import GraficaVentas from "../components/GraficaVentas";
import ModalVentas from "../components/ModalVentas";

const LIMIT = 10;

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

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const formatMoney = (n) => `$${Number(n).toLocaleString("es-MX")}`;

export default function Ventas() {
  const { usuario } = useContext(AuthContext);
  const puedeActualizar = usuario?.permissions?.includes("ventas:update");

  const [ventas, setVentas]               = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [filtroEstado, setFiltroEstado]   = useState("");
  const [busqueda, setBusqueda]           = useState("");
  const [paginaActiva, setPaginaActiva]   = useState(1);
  const [ventaDetalle, setVentaDetalle]   = useState(null);
  const [ventaCancelando, setVentaCancelando] = useState(null);
  const [modalExito, setModalExito]       = useState("");
  const [refresh, setRefresh]             = useState(0);

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

  const totalIngresos = ventas
    .filter((v) => v.estado === "pagado")
    .reduce((acc, v) => acc + v.total, 0);

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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">
        
        <Encabezado 
          titulo="Ventas" 
          onActualizar={() => setRefresh((r) => r + 1)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full mb-8 -mt-6!">
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
            accent="#7EC9ED"
            icon="bi bi-cash-coin"
          />
        </div>

        {/* Gráfica 30 días */}
        <div className={`
          rounded-xl p-6 border shadow-lg mb-6 transition-colors
          bg-blanco border-morado/20
          dark:bg-bg-card dark:border-lila/10
        `}>
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div>
              <p className={`text-sm transition-colors text-morado/80 dark:text-lila-soft`}>
                Tendencia · últimos 30 días
              </p>
              <p className={`text-xs mt-1 transition-colors text-gris dark:text-text-muted`}>
                Monto total de ventas confirmadas
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] tracking-[2px] uppercase font-semibold transition-colors text-morado dark:text-lila-soft`}>
                Total 30d
              </p>
              <p className={`text-lg font-bold tabular-nums transition-colors text-oscuro dark:text-blanco`}>
                {formatMoney(totalIngresos)}
              </p>
            </div>
          </div>
          <GraficaVentas data={generarDatos30Dias(ventas)} />
        </div>

        <ToolBar
          filtro={filtroEstado}
          setFiltro={setFiltroEstado}
          opcionesFiltro={OPCIONES_ESTADO}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          placeholderBuscar="Buscar por ID, cliente o email..."
        />

        <Tabla encabezados={["N° Pedido", "Fecha", "Cliente", "Método pago", "Artículos", "Total", "Estado", "Acciones"]}>
          {cargando ? (
            <tr>
              <td colSpan={8} className={`text-center py-10 text-sm opacity-50 transition-colors text-morado dark:text-lila`}>
                Cargando ventas...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8} className={`text-center py-10 text-sm opacity-50 transition-colors text-morado dark:text-lila`}>
                No hay resultados
              </td>
            </tr>
          ) : rows.map((v) => (
            <tr key={v.id} className={`
              border-b transition-colors
              border-morado/5 hover:bg-lila/30
              dark:border-lila/5 dark:hover:bg-oscuro/40
            `}>
              <td className="p-4 text-center text-sm font-poppins font-bold whitespace-nowrap transition-colors text-morado/70 dark:text-lila-soft">
                {v.numeroPedido || `#${v.id.slice(0, 8).toUpperCase()}`}
              </td>
              <td className="p-4 text-center text-sm whitespace-nowrap">
                {formatFecha(v.createdAt)}
              </td>
              <td className="p-4 text-center text-sm whitespace-nowrap">
                <div className="leading-tight">
                  <div className="font-medium">{v.cliente?.nombre}</div>
                  <div className="text-xs transition-colors text-gris dark:text-text-muted">{v.cliente?.email}</div>
                </div>
              </td>
              <td className="p-4 text-center whitespace-nowrap">
                {{
                  tarjeta: <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-azul/10 text-azul border-azul/30">Tarjeta</span>,
                  oxxo:    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amarillo/10 text-amarillo border-amarillo/30">OXXO</span>,
                  spei:    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-verde/10 text-verde border-verde/30">SPEI</span>,
                }[v.metodoPago] ?? <span className="text-sm capitalize">{v.metodoPago}</span>}
              </td>
              <td className="p-4 text-center text-sm whitespace-nowrap">
                {v.items?.reduce((a, i) => a + i.cantidad, 0)} uds.
              </td>
              <td className="p-4 text-center text-sm font-bold text-verde whitespace-nowrap tabular-nums">
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