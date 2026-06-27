import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
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

const LIMIT = 10;
const API_URL = import.meta.env.VITE_API_URL;

const ACTION_TO_LABEL = {
  CREATE:        "Confirmado",
  UPDATE:        "Pendiente",
  DELETE:        "Cancelado",
  TOGGLE_ACTIVE: "Draft",
};

const ACTION_TO_TEXT = {
  CREATE:        "Entrada",
  UPDATE:        "Ajuste",
  DELETE:        "Salida",
  TOGGLE_ACTIVE: "Toggle",
};

const OPCIONES_TIPO = [
  { label: "Todos los movimientos", value: "" },
  { label: "Entradas (CREATE)",     value: "CREATE" },
  { label: "Ajustes (UPDATE)",      value: "UPDATE" },
  { label: "Salidas (DELETE)",      value: "DELETE" },
];

const OPCIONES_FECHA = [
  { label: "Todo el tiempo", value: "" },
  { label: "Hoy",            value: "hoy" },
  { label: "Esta semana",    value: "semana" },
  { label: "Este mes",       value: "mes" },
];

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

function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  );
}

function fmtDateFull(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", {
      weekday: "long", year: "numeric", month: "long", day: "2-digit",
    }) +
    " " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

function filtrarPorFecha(items, rango) {
  if (!rango) return items;
  const ahora = new Date();
  return items.filter((l) => {
    const fecha = new Date(l.createdAt || l.timestamp);
    if (rango === "hoy")    return fecha.toDateString() === ahora.toDateString();
    if (rango === "semana") {
      const inicio = new Date(ahora);
      inicio.setDate(ahora.getDate() - ahora.getDay());
      inicio.setHours(0, 0, 0, 0);
      return fecha >= inicio;
    }
    if (rango === "mes") {
      return (
        fecha.getMonth()    === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      );
    }
    return true;
  });
}

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

function extraerStockActual(det) {
  const s = det?.stock ?? det?.stockNuevo ?? det?.newStock ?? det?.after?.stock;
  return s !== undefined && s !== null ? Number(s) : null;
}


function ModalDetalleMovimiento({ isOpen, onClose, log, onAjustar }) {
  if (!isOpen || !log) return null;

  const det         = log.details || {};
  const sku         = det.sku    || det.before?.sku    || "—";
  const nombre      = det.nombre || det.before?.nombre || det.after?.nombre || "—";
  const stockActual = extraerStockActual(det);
  const cambios     = Array.isArray(det.changes) ? det.changes : [];

  const footerModal = (
    <>
      <Boton variante="fantasma" onClick={onClose}>Cerrar</Boton>
      <Boton variante="claro" onClick={() => { onClose(); onAjustar({ sku: sku !== "—" ? sku : "" }); }}>
        <i className="bi bi-pencil-square" /> Ajustar Stock
      </Boton>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo="Detalle del Movimiento" footer={footerModal} ancho="max-w-lg">
      <div className="flex flex-col gap-5">

        <div className="flex items-center gap-3">
          <Etiquetas contenido={ACTION_TO_LABEL[log.action] || "Default"} />
          <span className="text-sm text-oscuro/60 dark:text-blanco/50">
            {ACTION_TO_TEXT[log.action] || log.action}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-lila/5 dark:bg-oscuro/40 border border-lila/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">SKU</p>
            <p className="text-sm font-mono font-bold text-lila">{sku}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Producto</p>
            <p className="text-sm font-medium text-oscuro dark:text-blanco">{nombre}</p>
          </div>
          {stockActual !== null && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Stock resultante</p>
              <p className={`text-lg font-bold ${getColorStock(stockActual)}`}>{stockActual}</p>
            </div>
          )}
          {det.stockMinimo !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Stock mínimo</p>
              <p className="text-sm font-medium text-oscuro dark:text-blanco">{det.stockMinimo}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Usuario</p>
            <p className="text-sm text-oscuro dark:text-blanco">{log.usuario || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Referencia</p>
            <p className="text-xs font-mono text-oscuro/60 dark:text-lila-soft">
              {log.resourceId ? `#${log.resourceId.slice(-8).toUpperCase()}` : "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Fecha y hora</p>
            <p className="text-sm text-oscuro dark:text-blanco capitalize">
              {fmtDateFull(log.createdAt || log.timestamp)}
            </p>
          </div>
        </div>

        {cambios.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-2">
              Campos modificados ({cambios.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cambios.map((c) => (
                <span key={c}
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: "rgba(167,139,250,0.12)", border: "0.5px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
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
      <div className="mb-5 px-3 py-2 rounded-lg text-xs"
        style={{ background: "rgba(167,139,250,0.08)", border: "0.5px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
        <i className="bi bi-info-circle mr-1.5" />
        Este ajuste quedará registrado en el Kardex con tu usuario y el motivo indicado.
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
            <td colSpan={8} className="text-center py-14 text-sm opacity-50 text-oscuro dark:text-lila">
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
                className="border-b hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors cursor-pointer"
                title="Clic para ver detalle">
                <td className="p-4 text-center text-xs font-mono text-lila">{f.sku}</td>
                <td className="p-4 text-center text-sm font-medium text-oscuro dark:text-blanco">{f.nombre}</td>
                <td className="p-4 text-center"><Etiquetas contenido={f.categoria} /></td>
                <td className="p-4 text-center text-sm text-oscuro/70 dark:text-blanco/60">{f.talla}</td>
                <td className={`p-4 text-center text-sm font-bold ${getColorStock(f.stock)}`}>{f.stock}</td>
                <td className="p-4 text-center text-xs text-oscuro/50 dark:text-blanco/40">{f.stockMinimo}</td>
                <td className="p-4 text-center"><Etiquetas contenido={etiqueta} /></td>
                <td className="p-4 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAjustarClick({ sku: f.sku, talla: f.talla }); }}
                    className="relative group bg-transparent border-none cursor-pointer text-md outline-none transition-all opacity-70 hover:opacity-100 text-lila-mid hover:text-amarillo dark:text-lila-soft dark:hover:text-amarillo"
                    title="Ajustar stock"
                  >
                    <i className="bi bi-pencil inline-block transition-transform group-hover:scale-125" />
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none bg-oscuro text-blanco">
                      Ajustar stock
                    </span>
                  </button>
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
      <div className="flex flex-col gap-5">

        <div className="flex items-center gap-3">
          <Etiquetas contenido={etiqueta} />
          <span className="text-sm text-oscuro/60 dark:text-blanco/50 capitalize">{estado}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-lila/5 dark:bg-oscuro/40 border border-lila/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">SKU</p>
            <p className="text-sm font-mono font-bold text-lila">{fila.sku}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Producto</p>
            <p className="text-sm font-medium text-oscuro dark:text-blanco">{fila.nombre}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Talla / Variante</p>
            <p className="text-sm text-oscuro dark:text-blanco">{fila.talla}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Categoría</p>
            <p className="text-sm text-oscuro dark:text-blanco">{fila.categoria}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Stock actual</p>
            <p className={`text-2xl font-bold ${getColorStock(fila.stock)}`}>{fila.stock}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-oscuro/40 dark:text-blanco/30 mb-1">Stock mínimo</p>
            <p className="text-2xl font-bold text-oscuro dark:text-blanco">{fila.stockMinimo}</p>
          </div>
        </div>

        {estado === "critico" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(208,78,55,0.08)", border: "0.5px solid rgba(208,78,55,0.3)", color: "#D04E37" }}>
            <i className="bi bi-exclamation-triangle" />
            Stock por debajo del mínimo requerido. Se recomienda reponer inventario.
          </div>
        )}
        {estado === "bajo" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(224,218,102,0.08)", border: "0.5px solid rgba(224,218,102,0.3)", color: "#E0DA66" }}>
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
  const { token, loading: authLoading } = useAuth();

  const [vistaActiva,  setVistaActiva]  = useState("kardex");
  const [productosDB,  setProductosDB]  = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [totalLogs,    setTotalLogs]    = useState(0);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState(null);
  const [refreshKey,   setRefreshKey]   = useState(0);

  const [busqueda,     setBusqueda]     = useState("");
  const [filtroTipo,   setFiltroTipo]   = useState("");
  const [filtroFecha,  setFiltroFecha]  = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [logSeleccionado, setLogSeleccionado] = useState(null);
  const [isDetalleKardexOpen, setIsDetalleKardexOpen] = useState(false);

  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [isDetalleStockOpen, setIsDetalleStockOpen] = useState(false);

  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [ajusteSku,    setAjusteSku]    = useState("");
  const [ajusteTalla,  setAjusteTalla]  = useState("");
  const [guardando,    setGuardando]    = useState(false);

  const [modalConf, setModalConf] = useState({ isOpen: false });
  const [toast,     setToast]     = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ message, type });

  const abrirDetalleKardex = (log) => {
    setLogSeleccionado(log);
    setIsDetalleKardexOpen(true);
  };

  const abrirDetalleStock = (fila) => {
    setFilaSeleccionada(fila);
    setIsDetalleStockOpen(true);
  };

  const abrirAjuste = ({ sku = "", talla = "" } = {}) => {
    setAjusteSku(sku);
    setAjusteTalla(talla);
    setIsAjusteOpen(true);
  };

  const handleCambiarVista = (vista) => {
    setVistaActiva(vista);
    setBusqueda("");
    setFiltroTipo("");
    setFiltroFecha("");
    setFiltroEstado("");
  };

  useEffect(() => {
    api.get("/products")
      .then((result) => {
        const items = result.items || result.data?.items || (Array.isArray(result) ? result : []);
        setProductosDB(items);
      })
      .catch((err) => console.error("Error productos:", err));
  }, [refreshKey]);

  const fetchAuth = useCallback(
    (url) => fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }),
    [token]
  );

  useEffect(() => {
    if (authLoading || !token) return;
    const fetchLogs = async () => {
      try {
        setCargando(true);
        setError(null);
        const params = new URLSearchParams({
          page: String(paginaActual), limit: String(LIMIT), resource: "products",
          ...(busqueda   && { q:      busqueda   }),
          ...(filtroTipo && { action: filtroTipo }),
        });
        const res = await fetchAuth(`${API_URL}/audit?${params}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Error ${res.status}`);
        }
        const data = await res.json();
        setLogs(filtrarPorFecha((data.items || []).slice(0, LIMIT), filtroFecha));
        setTotalLogs(data.total || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchLogs();
  }, [authLoading, token, busqueda, filtroTipo, filtroFecha, paginaActual, refreshKey, fetchAuth]);

  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroTipo, filtroFecha]);

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

  const textoRango = totalLogs === 0
    ? "0"
    : `${(paginaActual - 1) * LIMIT + 1} – ${Math.min(paginaActual * LIMIT, totalLogs)}`;

  const handleCambiarPagina = (page) => {
    const totalPaginas = Math.max(1, Math.ceil(totalLogs / LIMIT));
    if (page === "‹")      setPaginaActual((c) => Math.max(1, c - 1));
    else if (page === "›") setPaginaActual((c) => Math.min(totalPaginas, c + 1));
    else                   setPaginaActual(Number(page));
  };

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

  const encabezadosKardex = ["Movimiento", "SKU / Producto", "Referencia", "Stock", "Usuario", "Fecha", "Acciones"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })} />

      <Encabezado titulo="Inventario" onActualizar={() => setRefreshKey((k) => k + 1)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjetas label="Valor Inventario (Costo)"
          value={`$${valorCosto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
          sub="Capital invertido" accent="#a78bfa" icon="bi bi-currency-dollar" />
        <Tarjetas label="Valor Inventario (Venta)"
          value={`$${valorVenta.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
          sub="Ganancia potencial" accent="#84B140" icon="bi bi-graph-up-arrow" />
        <Tarjetas label="Artículos Totales"
          value={articulosTotales.toLocaleString("es-MX")}
          sub="Unidades físicas bajo techo" accent="#38bdf8" icon="bi bi-boxes" />
        <Tarjetas label="Alertas Críticas" value={alertasCriticas}
          sub={alertasCriticas > 0 ? "Productos en stock mínimo" : "Sin alertas activas"}
          accent={alertasCriticas > 0 ? "#D04E37" : "#84B140"}
          icon={alertasCriticas > 0 ? "bi bi-exclamation-triangle" : "bi bi-shield-check"} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl border border-lila/20 bg-blanco dark:bg-bg-card">
          <button
            onClick={() => handleCambiarVista("kardex")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              vistaActiva === "kardex"
                ? "bg-lila text-oscuro shadow-sm"
                : "text-oscuro/60 dark:text-blanco/50 hover:text-oscuro dark:hover:text-blanco"
            }`}
          >
            <i className="bi bi-journal-text" /> Kardex
          </button>
          <button
            onClick={() => handleCambiarVista("stock")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              vistaActiva === "stock"
                ? "bg-lila text-oscuro shadow-sm"
                : "text-oscuro/60 dark:text-blanco/50 hover:text-oscuro dark:hover:text-blanco"
            }`}
          >
            <i className="bi bi-boxes" /> Stock
          </button>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-between ml-2">
          <p className="text-xs text-oscuro/50 dark:text-blanco/40 hidden sm:block">
            {vistaActiva === "kardex"
              ? "Clic en una fila para ver el detalle · usa el ícono para ajustar stock."
              : "Clic en una fila para ver el detalle · usa el ícono para ajustar stock."
            }
          </p>
    
        </div>
      </div>

      {vistaActiva === "kardex" ? (
        <ToolBar
          busqueda={busqueda} setBusqueda={setBusqueda}
          placeholderBuscar="Buscar por SKU, producto, usuario…"
          filtro={filtroFecha} setFiltro={setFiltroFecha}
          opcionesFiltro={OPCIONES_FECHA} placeholderFiltro="Rango de fechas"
          filtro2={filtroTipo} setFiltro2={setFiltroTipo}
          opcionesFiltro2={OPCIONES_TIPO} placeholderFiltro2="Tipo de movimiento"
        />
      ) : (
        <ToolBar
          busqueda={busqueda} setBusqueda={setBusqueda}
          placeholderBuscar="Buscar por SKU o nombre de producto…"
          filtro={filtroEstado} setFiltro={setFiltroEstado}
          opcionesFiltro={OPCIONES_ESTADO_STOCK} placeholderFiltro="Estado de stock"
        />
      )}

      {vistaActiva === "kardex" ? (
        <>
          <Tabla encabezados={encabezadosKardex}>
            {cargando ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-sm opacity-50 text-oscuro dark:text-lila">
                  <i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando historial…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-rojo">
                  <i className="bi bi-exclamation-circle mr-2" />{error}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-sm opacity-50 text-oscuro dark:text-lila">
                  <i className="bi bi-inbox mr-2" />Sin movimientos que coincidan con los filtros
                </td>
              </tr>
            ) : (
              logs.map((l) => {
                const det         = l.details || {};
                const sku         = det.sku    || det.before?.sku    || "—";
                const nombre      = det.nombre || det.before?.nombre || det.after?.nombre || "—";
                const stockActual = extraerStockActual(det);
                const refId       = l.resourceId ? `#${l.resourceId.slice(-6).toUpperCase()}` : "—";

                return (
                  <tr key={l.id}
                    onClick={() => abrirDetalleKardex(l)}
                    className="border-b hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors cursor-pointer"
                    title="Clic para ver detalle">
                    <td className="p-3 md:p-4 text-center">
                      <Etiquetas contenido={ACTION_TO_LABEL[l.action] || "Default"} />
                      <span className="block text-[10px] text-oscuro/40 dark:text-blanco/30 mt-0.5">
                        {ACTION_TO_TEXT[l.action] || l.action}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-center">
                      <span className="block text-xs font-mono text-lila">{sku}</span>
                      <span className="block text-xs text-oscuro dark:text-blanco/80 truncate max-w-[120px] mx-auto">{nombre}</span>
                    </td>
                    <td className="p-3 md:p-4 text-center font-mono text-xs text-oscuro/50 dark:text-lila-soft/60 hidden lg:table-cell">
                      {refId}
                    </td>
                    <td className="p-3 md:p-4 text-center text-sm font-bold">
                      {stockActual !== null
                        ? <span className={getColorStock(stockActual)}>{stockActual}</span>
                        : <span className="text-oscuro/30 dark:text-blanco/20 text-xs">—</span>
                      }
                    </td>
                    <td className="p-3 md:p-4 text-center text-sm text-oscuro dark:text-blanco">
                      {l.usuario || "—"}
                    </td>
                    <td className="p-3 md:p-4 text-center text-xs text-oscuro/50 dark:text-lila-soft/60">
                      {fmtDateShort(l.createdAt || l.timestamp)}
                    </td>
                    <td className="p-3 md:p-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirAjuste({ sku: sku !== "—" ? sku : "" }); }}
                        className="relative group bg-transparent border-none cursor-pointer text-md outline-none transition-all opacity-70 hover:opacity-100 text-lila-mid hover:text-amarillo dark:text-lila-soft dark:hover:text-amarillo"
                        title="Ajustar stock"
                      >
                        <i className="bi bi-pencil inline-block transition-transform group-hover:scale-125" />
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none bg-oscuro text-blanco">
                          Ajustar stock
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </Tabla>

          <Paginacion
            paginaActual={paginaActual} totalRegistros={totalLogs}
            rangoSiguiente={textoRango} limit={LIMIT}
            onCambiarPagina={handleCambiarPagina}
            exportTitulo="Kardex de Inventario"
            exportColumnas={[
              { header: "Movimiento", key: "movimiento", width: 16 },
              { header: "SKU",        key: "sku",        width: 14 },
              { header: "Producto",   key: "producto",   width: 28 },
              { header: "Stock",      key: "stock",      width: 8  },
              { header: "Referencia", key: "referencia", width: 14 },
              { header: "Usuario",    key: "usuario",    width: 20 },
              { header: "Fecha",      key: "fecha",      width: 22 },
            ]}
            exportFilas={logs.map((l) => {
              const det         = l.details || {};
              const stockActual = extraerStockActual(det);
              return {
                movimiento:  ACTION_TO_TEXT[l.action] || l.action,
                sku:         det.sku    || det.before?.sku    || "—",
                producto:    det.nombre || det.before?.nombre || "—",
                stock:       stockActual !== null ? String(stockActual) : "—",
                referencia:  l.resourceId ? `#${l.resourceId.slice(-6).toUpperCase()}` : "—",
                usuario:     l.usuario || "—",
                fecha:       fmtDateShort(l.createdAt || l.timestamp),
              };
            })}
          />
        </>
      ) : (
        <TablaStock
          productosDB={productosDB}
          busqueda={busqueda}
          filtroEstado={filtroEstado}
          onFilaClick={abrirDetalleStock}
          onAjustarClick={abrirAjuste}
        />
      )}

      

            <ModalDetalleMovimiento
        isOpen={isDetalleKardexOpen}
        onClose={() => setIsDetalleKardexOpen(false)}
        log={logSeleccionado}
        onAjustar={abrirAjuste}
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
