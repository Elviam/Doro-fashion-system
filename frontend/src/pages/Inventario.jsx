import { useState, useEffect } from "react";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import Paginacion from "../components/Paginacion";
import ToolBar from "../components/ToolBar";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Etiquetas from "../components/Etiquetas";
import Boton from "../components/Boton";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Toast from "../components/Toast";

const OPCIONES_ESTADO_STOCK = [
  { label: "Todos",   value: "" },
  { label: "Crítico", value: "critico" },
  { label: "Bajo",    value: "bajo" },
  { label: "Normal",  value: "normal" },
];

const MOTIVOS_AJUSTE = [
  "Conteo físico anual",
  "Prenda dañada en exhibición",
  "Robo o extravío",
  "Error de captura",
  "Merma / deterioro",
  "Devolución de cliente",
  "Otro",
];

const TIPOS_AJUSTE = ["Sumar (+)", "Restar (−)", "Fijar valor exacto"];

function calcularStockTotal(inventario) {
  if (!Array.isArray(inventario)) return 0;
  return inventario.reduce((acc, item) => acc + (item.stock || 0), 0);
}

function labelToTipo(label) {
  if (label.startsWith("Sumar"))  return "sumar";
  if (label.startsWith("Restar")) return "restar";
  return "fijar";
}

function getEstadoStock(stock, minimo) {
  if (stock <= minimo)     return "critico";
  if (stock <= minimo * 2) return "bajo";
  return "normal";
}

function getColorStock(stock) {
  if (stock <= 10) return "text-rojo";
  if (stock <= 30) return "text-amarillo";
  return "text-verde";
}

// ── Botón de ajuste inline ──
function BtnAjuste({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative group bg-transparent border-none cursor-pointer text-lg lg:text-xl outline-none transition-all opacity-70 hover:opacity-100 text-noir-soft hover:text-gold-dark dark:text-ash dark:hover:text-gold-light"
      title="Ajustar stock"
    >
      <i className="bi bi-pencil inline-block transition-transform group-hover:scale-125" />
      <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-body px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-xl z-50 pointer-events-none bg-noir text-snow dark:bg-noir-soft dark:border dark:border-gold/20">
        Ajustar stock
      </span>
    </button>
  );
}

function ModalAjusteManual({ isOpen, onClose, onGuardar, guardando, skuInicial = "", tallaInicial = "" }) {
  const [form, setForm] = useState({
    sku: "", talla: "", cantidad: "",
    tipo: "Sumar (+)", motivo: "", motivoCustom: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        sku:   skuInicial   || "",
        talla: tallaInicial || "",
      }));
    }
  }, [isOpen, skuInicial, tallaInicial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validar = () => {
    const e = {};
    if (!form.sku.trim())
      e.sku = "El SKU es obligatorio.";
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      e.cantidad = "Ingresa una cantidad válida mayor a 0.";
    const motivoFinal = form.motivo === "Otro" ? form.motivoCustom : form.motivo;
    if (!motivoFinal.trim())
      e.motivo = "El motivo es obligatorio.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validar()) return;
    const motivoFinal = form.motivo === "Otro" ? form.motivoCustom : form.motivo;
    onGuardar({
      sku:      form.sku,
      talla:    form.talla,
      cantidad: Number(form.cantidad),
      tipo:     labelToTipo(form.tipo),
      motivo:   motivoFinal,
    });
  };

  const handleClose = () => {
    setForm({ sku: "", talla: "", cantidad: "", tipo: "Sumar (+)", motivo: "", motivoCustom: "" });
    setErrors({});
    onClose();
  };

  const footerModal = (
    <>
      <Boton variante="oscuro" onClick={handleClose}>Cancelar</Boton>
      <Boton variante="claro" onClick={handleSubmit} tipo="button">
        {guardando
          ? <><i className="bi bi-arrow-repeat animate-spin" /> Guardando…</>
          : <><i className="bi bi-check2" /> Aplicar Ajuste</>
        }
      </Boton>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} titulo="Ajuste Manual de Stock" footer={footerModal} ancho="max-w-md">
      <div className="mb-5 px-3 py-2 rounded-[2px] text-xs font-body bg-gold/10 border border-gold/30 text-gold-dark dark:text-gold-light">
        <i className="bi bi-info-circle mr-1.5" />
        Este ajuste quedará registrado en la Auditoría con tu usuario y el motivo indicado.
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input label="SKU" name="sku" value={form.sku}
              onChange={(e) => handleChange({ target: { name: "sku", value: e.target.value.toUpperCase() } })}
              placeholder="ej. SKU-001" requerido />
            {errors.sku && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.sku}</p>}
          </div>
          <Input label="Talla / Variante" name="talla" value={form.talla}
            onChange={handleChange} placeholder="ej. M, 32" />
        </div>

        <Input label="Tipo de ajuste" tipo="select" name="tipo" value={form.tipo}
          onChange={handleChange} opciones={TIPOS_AJUSTE} requerido />

        <div>
          <Input label="Cantidad" tipo="number" name="cantidad" value={form.cantidad}
            onChange={handleChange} placeholder="0" requerido />
          {errors.cantidad && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.cantidad}</p>}
        </div>

        <div>
          <Input label="Motivo" tipo="select" name="motivo" value={form.motivo}
            onChange={handleChange} opciones={MOTIVOS_AJUSTE}
            placeholder="Selecciona un motivo…" requerido />
          {errors.motivo && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.motivo}</p>}
        </div>

        {form.motivo === "Otro" && (
          <div>
            <Input label="Especifica el motivo" name="motivoCustom" value={form.motivoCustom}
              onChange={handleChange} placeholder="Describe el motivo…" requerido />
            {errors.motivo && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.motivo}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function TablaStock({ productosDB, busqueda, filtroEstado, onFilaClick, onAjustarClick }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const LIMIT_STOCK = 10;

  const filas = productosDB.flatMap((p) => {
    if (!Array.isArray(p.inventario) || p.inventario.length === 0) {
      return [{
        id: p.id, sku: p.sku || "—", nombre: p.nombre || "—",
        categoria: p.categoria || "—", talla: "Única",
        stock: 0, stockMinimo: Number(p.stockMinimo) || 5,
        activo: p.activo !== false,
      }];
    }
    return p.inventario.map((inv) => ({
      id: p.id, sku: p.sku || "—", nombre: p.nombre || "—",
      categoria: p.categoria || "—",
      talla: inv.talla || inv.variante || "Única",
      stock: inv.stock || 0,
      stockMinimo: Number(p.stockMinimo) || 5,
      activo: p.activo !== false,
    }));
  });

  const filasFiltradas = filas
    .filter((f) =>
      busqueda === "" ||
      f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.sku.toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter((f) => {
      if (!filtroEstado) return true;
      return getEstadoStock(f.stock, f.stockMinimo) === filtroEstado;
    });

  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroEstado]);

  const start          = (paginaActual - 1) * LIMIT_STOCK;
  const filasPaginadas = filasFiltradas.slice(start, start + LIMIT_STOCK);
  const textoRango     = filasFiltradas.length === 0
    ? "0"
    : `${start + 1} – ${Math.min(paginaActual * LIMIT_STOCK, filasFiltradas.length)}`;

  const handleCambiarPagina = (page) => {
    const total = Math.max(1, Math.ceil(filasFiltradas.length / LIMIT_STOCK));
    if (page === "‹")      setPaginaActual((c) => Math.max(1, c - 1));
    else if (page === "›") setPaginaActual((c) => Math.min(total, c + 1));
    else                   setPaginaActual(Number(page));
  };

  const encabezados = ["SKU", "Producto", "Categoría", "Talla / Variante", "Stock", "Mínimo", "Estado", "Acciones"];

  return (
    <>
      <Tabla encabezados={encabezados}>
        {filasPaginadas.length === 0 ? (
          <tr>
            <td colSpan={8} className="text-center py-14 text-sm lg:text-base text-noir-soft dark:text-ash">
              <i className="bi bi-inbox mr-2" />Sin resultados
            </td>
          </tr>
        ) : (
          filasPaginadas.map((f, i) => {
            const estado   = getEstadoStock(f.stock, f.stockMinimo);
            const etiqueta = estado === "critico" ? "Inactivo" : estado === "bajo" ? "Pendiente" : "Activo";
            return (
              <tr key={`${f.id}-${f.talla}-${i}`}
                onClick={() => onFilaClick(f)}
                className="border-b border-gold/20 hover:bg-gold/8 transition-colors cursor-pointer"
                title="Clic para ver detalle">
                <td className="p-4 text-center text-xs lg:text-sm font-mono text-gold-dark dark:text-gold-light">{f.sku}</td>
                <td className="p-4 text-center text-sm lg:text-base font-medium text-noir dark:text-snow">{f.nombre}</td>
                <td className="p-4 text-center"><Etiquetas contenido={f.categoria} /></td>
                <td className="p-4 text-center text-sm lg:text-base text-noir-soft dark:text-ash">{f.talla}</td>
                <td className={`p-4 text-center text-sm lg:text-base font-bold ${getColorStock(f.stock)}`}>{f.stock}</td>
                <td className="p-4 text-center text-xs lg:text-sm text-noir-soft dark:text-ash">{f.stockMinimo}</td>
                <td className="p-4 text-center"><Etiquetas contenido={etiqueta} /></td>
                <td className="p-4 text-center">
                  <BtnAjuste onClick={(e) => { e.stopPropagation(); onAjustarClick({ sku: f.sku, talla: f.talla }); }} />
                </td>
              </tr>
            );
          })
        )}
      </Tabla>

      <Paginacion
        paginaActual={paginaActual} totalRegistros={filasFiltradas.length}
        rangoSiguiente={textoRango} limit={LIMIT_STOCK}
        onCambiarPagina={handleCambiarPagina}
        exportTitulo="Stock por Producto y Talla"
        exportColumnas={[
          { header: "SKU",       key: "sku",       width: 14 },
          { header: "Producto",  key: "nombre",    width: 28 },
          { header: "Categoría", key: "categoria", width: 16 },
          { header: "Talla",     key: "talla",     width: 12 },
          { header: "Stock",     key: "stock",     width: 8  },
          { header: "Mínimo",    key: "minimo",    width: 8  },
          { header: "Estado",    key: "estado",    width: 10 },
        ]}
        exportFilas={filasFiltradas.map((f) => ({
          sku: f.sku, nombre: f.nombre, categoria: f.categoria,
          talla: f.talla, stock: f.stock, minimo: f.stockMinimo,
          estado: getEstadoStock(f.stock, f.stockMinimo),
        }))}
      />
    </>
  );
}

function ModalDetalleStock({ isOpen, onClose, fila, onAjustar }) {
  if (!isOpen || !fila) return null;

  const estado   = getEstadoStock(fila.stock, fila.stockMinimo);
  const etiqueta = estado === "critico" ? "Inactivo" : estado === "bajo" ? "Pendiente" : "Activo";

  const footerModal = (
    <>
      <Boton variante="fantasma" onClick={onClose}>Cerrar</Boton>
      <Boton variante="claro" onClick={() => { onClose(); onAjustar({ sku: fila.sku, talla: fila.talla }); }}>
        <i className="bi bi-pencil-square" /> Ajustar Stock
      </Boton>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo="Detalle de Stock" footer={footerModal} ancho="max-w-md">
      <div className="flex flex-col gap-5 font-body">

        <div className="flex items-center gap-3">
          <Etiquetas contenido={etiqueta} />
          <span className="text-sm lg:text-base text-noir-soft dark:text-ash capitalize">{estado}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-[2px] bg-gold/8 border border-gold/40 dark:bg-noir/40 dark:border-gold/20">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">SKU</p>
            <p className="text-sm font-mono font-bold text-gold-dark dark:text-gold-light">{fila.sku}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Producto</p>
            <p className="text-sm lg:text-base font-medium text-noir dark:text-snow">{fila.nombre}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Talla / Variante</p>
            <p className="text-sm lg:text-base text-noir dark:text-snow">{fila.talla}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Categoría</p>
            <p className="text-sm lg:text-base text-noir dark:text-snow">{fila.categoria}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock actual</p>
            <p className={`text-2xl font-bold ${getColorStock(fila.stock)}`}>{fila.stock}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-noir-soft dark:text-ash mb-1">Stock mínimo</p>
            <p className="text-2xl font-bold text-noir dark:text-snow">{fila.stockMinimo}</p>
          </div>
        </div>

        {estado === "critico" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-xs font-body bg-rojo/10 border border-rojo/30 text-rojo-dark dark:text-rojo">
            <i className="bi bi-exclamation-triangle" />
            Stock por debajo del mínimo requerido. Se recomienda reponer inventario.
          </div>
        )}
        {estado === "bajo" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-xs font-body bg-amarillo/10 border border-amarillo/30 text-amarillo-dark dark:text-amarillo">
            <i className="bi bi-exclamation-circle" />
            Stock bajo. Considera reabastecer pronto.
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Inventario() {
  useTitulo("Inventario");

  const [productosDB,  setProductosDB]  = useState([]);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const [busqueda,     setBusqueda]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [filaSeleccionada,   setFilaSeleccionada]   = useState(null);
  const [isDetalleStockOpen, setIsDetalleStockOpen] = useState(false);

  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [ajusteSku,    setAjusteSku]    = useState("");
  const [ajusteTalla,  setAjusteTalla]  = useState("");
  const [guardando,    setGuardando]    = useState(false);

  const [modalConf, setModalConf] = useState({ isOpen: false });
  const [toast,     setToast]     = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ message, type });

  const abrirDetalleStock = (fila) => { setFilaSeleccionada(fila); setIsDetalleStockOpen(true); };

  const abrirAjuste = ({ sku = "", talla = "" } = {}) => {
    setAjusteSku(sku);
    setAjusteTalla(talla);
    setIsAjusteOpen(true);
  };

  useEffect(() => {
    api.get("/products")
      .then((result) => {
        const items = result.items || result.data?.items || (Array.isArray(result) ? result : []);
        setProductosDB(items);
      })
      .catch((err) => console.error("Error productos:", err));
  }, [refreshKey]);

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
      const producto = productosDB.find(
        (p) => p.sku?.toLowerCase() === datos.sku.toLowerCase()
      );
      if (!producto) throw new Error(`No se encontró ningún producto con SKU: ${datos.sku}`);

      const stockActual = calcularStockTotal(producto.inventario);
      let nuevoStock;
      if (datos.tipo === "sumar")  nuevoStock = stockActual + datos.cantidad;
      if (datos.tipo === "restar") nuevoStock = Math.max(0, stockActual - datos.cantidad);
      if (datos.tipo === "fijar")  nuevoStock = datos.cantidad;

      await api.patch(`/products/${producto.id}`, {
        stock: nuevoStock,
        _ajusteManual: {
          tipo: datos.tipo, cantidad: datos.cantidad,
          talla: datos.talla, motivo: datos.motivo,
        },
      });

      setIsAjusteOpen(false);
      setRefreshKey((k) => k + 1);
      showToast(`Stock de "${producto.nombre}" actualizado: ${stockActual} → ${nuevoStock}`, "success");
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
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-body">

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

      <p className="text-xs lg:text-sm text-noir-soft dark:text-ash">
        Clic en una fila para ver el detalle · usa el ícono para ajustar stock · el historial de movimientos vive en <strong>Auditoría</strong>.
      </p>

      <ToolBar
        busqueda={busqueda} setBusqueda={setBusqueda}
        placeholderBuscar="Buscar por SKU o nombre de producto…"
        filtro={filtroEstado} setFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO_STOCK} placeholderFiltro="Estado de stock"
      />

      <TablaStock
        productosDB={productosDB}
        busqueda={busqueda}
        filtroEstado={filtroEstado}
        onFilaClick={abrirDetalleStock}
        onAjustarClick={abrirAjuste}
      />

      <ModalDetalleStock
        isOpen={isDetalleStockOpen}
        onClose={() => setIsDetalleStockOpen(false)}
        fila={filaSeleccionada}
        onAjustar={abrirAjuste}
      />

      <ModalAjusteManual
        isOpen={isAjusteOpen}
        onClose={() => setIsAjusteOpen(false)}
        onGuardar={handleGuardarAjuste}
        guardando={guardando}
        skuInicial={ajusteSku}
        tallaInicial={ajusteTalla}
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