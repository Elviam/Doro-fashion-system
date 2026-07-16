import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import ToolBar from "../components/ToolBar";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Toast from "../components/Toast";
import TablaInventario from "../components/TablaInventario";
import ModalDetalleProducto from "../components/ModalDetalleProducto";
import ModalAjusteInventario from "../components/ModalAjusteInventario";

const OPCIONES_ESTADO_STOCK = [
  { label: "Todos",   value: "" },
  { label: "Crítico", value: "critico" },
  { label: "Bajo",    value: "bajo" },
  { label: "Normal",  value: "normal" },
];

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (item.stock || 0), 0);
}

export default function Inventario() {
  useTitulo("Inventario");
  const [searchParams, setSearchParams] = useSearchParams();

  const [productosDB, setProductosDB] = useState([]);
  const [refreshKey,  setRefreshKey]  = useState(0);
  const [cargando,    setCargando]    = useState(true);

  const [busqueda,     setBusqueda]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [isVerOpen,    setIsVerOpen]    = useState(false);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [guardando,    setGuardando]    = useState(false);

  const [modalConf, setModalConf] = useState({ isOpen: false });
  const [toast,     setToast]     = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ message, type });

  const abrirVer     = (producto) => { setProductoSeleccionado(producto); setIsVerOpen(true); };
  const abrirEditar  = (producto) => { setProductoSeleccionado(producto); setIsEditarOpen(true); };

  useEffect(() => {
    setCargando(true);
    api.get("/products")
      .then((result) => {
        const items = result.items || result.data?.items || (Array.isArray(result) ? result : []);
        setProductosDB(items);
      })
      .catch((err) => console.error("Error productos:", err))
      .finally(() => setCargando(false));
  }, [refreshKey]);

  // Si venimos de "Registrar Stock"/"Guardar y Registrar Inventario" (?editar=<id>)
  useEffect(() => {
    const idEditar = searchParams.get("editar");
    if (!idEditar || productosDB.length === 0) return;
    const producto = productosDB.find((p) => String(p.id) === String(idEditar));
    if (producto) {
      abrirEditar(producto);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, productosDB]);

  const valorCosto = productosDB.reduce((acc, p) =>
    acc + calcularStockTotal(p.inventario) * (Number(p.precioCompra) || 0), 0);
  const valorVenta = productosDB.reduce((acc, p) =>
    acc + calcularStockTotal(p.inventario) * (Number(p.precioVenta || p.pVenta) || 0), 0);
  const articulosTotales = productosDB.reduce(
    (acc, p) => acc + calcularStockTotal(p.inventario), 0);
  const alertasCriticas = productosDB.filter((p) => {
    const stock  = calcularStockTotal(p.inventario);
    const minimo = Number(p.stockMinimo) || 5;
    return stock <= minimo && p.activo !== false;
  }).length;

  const handleGuardarAjuste = async (datos) => {
    setGuardando(true);
    try {
      const producto = productosDB.find((p) => p.id === datos.productoId);
      if (!producto) throw new Error("No se encontró el producto.");

      const inventarioActual = Array.isArray(producto.inventario) ? [...producto.inventario] : [];
      const nuevoInventario = inventarioActual.map((item) => ({ ...item }));

      const tallas = Array.isArray(datos.tallas) ? datos.tallas : [datos.talla].filter(Boolean);
      const resumen = tallas.map((talla) => {
        const idx = nuevoInventario.findIndex((i) => i.talla === talla);
        const cantidadAnterior = idx >= 0 ? Number(nuevoInventario[idx].stock || 0) : 0;
        const cantidadNueva = datos.valoresPorTalla
          ? Number(datos.valoresPorTalla[talla])
          : Number(datos.cantidad);

        if (idx >= 0) {
          nuevoInventario[idx] = { ...nuevoInventario[idx], stock: cantidadNueva };
        } else {
          nuevoInventario.push({ talla, stock: cantidadNueva });
        }

        return { talla, cantidadAnterior, cantidadNueva };
      });

      const stockTotalNuevo = nuevoInventario.reduce((acc, it) => acc + Number(it.stock || 0), 0);

      await api.patch(`/products/${producto.id}`, {
        inventario: nuevoInventario,
        stock: stockTotalNuevo,
        _ajusteManual: {
          tallas: resumen.map(({ talla, cantidadAnterior, cantidadNueva }) => ({ talla, cantidadAnterior, cantidadNueva })),
          tipo: datos.tipo,
          cantidad: Number(datos.cantidad),
          motivo: datos.motivo,
          notas: datos.notas,
          evidencia: datos.evidencia,
        },
      });

      setIsEditarOpen(false);
      setRefreshKey((k) => k + 1);
      const detalle = resumen.map(({ talla, cantidadAnterior, cantidadNueva }) => `${talla}: ${cantidadAnterior} → ${cantidadNueva}`).join(", ");
      showToast(`Stock de "${producto.nombre}" actualizado: ${detalle}`, "success");
    } catch (err) {
      setModalConf({
        isOpen: true, tipo: "confirmar", titulo: "Error al ajustar",
        mensaje: err.message || "No se pudo aplicar el ajuste.",
        textoConfirmar: "Entendido",
        onConfirmar: () => setModalConf({ isOpen: false }),
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-16 flex flex-col gap-6 font-body">

      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })} />

      <Encabezado titulo="Inventario" onActualizar={() => setRefreshKey((k) => k + 1)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjetas label="Valor Inventario (Costo)"
          value={`$${valorCosto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
          sub="Capital invertido" accent="#C9A84C" icon="bi bi-currency-dollar" />
        <Tarjetas label="Valor Inventario (Venta)"
          value={`$${valorVenta.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
          sub="Ganancia potencial" accent="#84B140" icon="bi bi-graph-up-arrow" />
        <Tarjetas label="Artículos Totales"
          value={articulosTotales.toLocaleString("es-MX")}
          sub="Unidades físicas bajo techo" accent="#538f96" icon="bi bi-boxes" />
        <Tarjetas label="Alertas Críticas" value={alertasCriticas}
          sub={alertasCriticas > 0 ? "Productos en stock mínimo" : "Sin alertas activas"}
          accent={alertasCriticas > 0 ? "#D04E37" : "#84B140"}
          icon={alertasCriticas > 0 ? "bi bi-exclamation-triangle" : "bi bi-shield-check"} />
      </div>

      <ToolBar
        busqueda={busqueda} setBusqueda={setBusqueda}
        placeholderBuscar="Buscar por SKU o nombre de producto…"
        filtro={filtroEstado} setFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO_STOCK} placeholderFiltro="Estado de stock"
      />

      <TablaInventario
        productosDB={productosDB}
        busqueda={busqueda}
        filtroEstado={filtroEstado}
        cargando={cargando}
        onVer={abrirVer}
        onEditar={abrirEditar}
      />

      <ModalDetalleProducto
        isOpen={isVerOpen}
        onClose={() => setIsVerOpen(false)}
        producto={productoSeleccionado}
        onEditar={abrirEditar}
      />

      <ModalAjusteInventario
        isOpen={isEditarOpen}
        onClose={() => setIsEditarOpen(false)}
        onGuardar={handleGuardarAjuste}
        guardando={guardando}
        producto={productoSeleccionado}
      />

      <ModalConfirmacion
        isOpen={modalConf.isOpen} tipo={modalConf.tipo}
        titulo={modalConf.titulo} mensaje={modalConf.mensaje}
        textoConfirmar={modalConf.textoConfirmar || "Aceptar"}
        onConfirmar={() => {
          if (modalConf.onConfirmar) modalConf.onConfirmar();
          else setModalConf({ ...modalConf, isOpen: false });
        }}
        onCancelar={() => setModalConf({ ...modalConf, isOpen: false })}
      />
    </div>
  );
}
