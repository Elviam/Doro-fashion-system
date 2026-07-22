import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { fetchSuppliers } from "../services/suppliers.service";
import { crearPedido, enviarPedido } from "../services/pedidos.service";
import Encabezado from "../components/Encabezado";
import Toast from "../components/Toast";
import useTitulo from "../hooks/useTitulo";
import { useAuth } from "../hooks/useAuth";
import { canPerformAction } from "../utils/permissionMapper";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";

function obtenerInventario(producto) {
  const inventario = Array.isArray(producto.inventario)
    ? producto.inventario
    : Array.isArray(producto.variants)
    ? producto.variants
    : [];

  return inventario;
}

function obtenerVariantesBajas(producto) {
  const inventario = obtenerInventario(producto);

  const minimo = Number(producto.stockMinimo ?? 0);
  const ideal = Number(producto.stockIdeal) || 0;

  return inventario
    .filter((v) => (v.stock ?? 0) < minimo)
    .map((v) => ({
      id: `${producto.id}-${v.talla}`,
      productId: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      talla: v.talla,
      stockActual: v.stock ?? 0,
      stockRequerido: Math.max(0, minimo - (v.stock ?? 0)),
      precioCompra: Number(producto.precioCompra) || 0,
      supplierId: producto.supplierId || "",
      sugerido: true,
      estadoStock: (v.stock ?? 0) === 0
        ? "sinUnidades"
        : (v.stock ?? 0) < minimo
        ? "critico"
        : (v.stock ?? 0) <= ideal
        ? "bajo"
        : "normal",
    }));
}

async function fetchProductos() {
  const limite = 100;
  const primeraPagina = await api.get(`/products?limit=${limite}`);
  const primerosItems = primeraPagina.items || primeraPagina.data?.items || (Array.isArray(primeraPagina) ? primeraPagina : []);
  const total = Number(primeraPagina.total ?? primerosItems.length);
  const paginasRestantes = Math.ceil(total / limite) - 1;

  if (paginasRestantes <= 0) return primerosItems;

  const resultados = await Promise.all(
    Array.from({ length: paginasRestantes }, (_, index) => api.get(`/products?limit=${limite}&page=${index + 2}`))
  );
  return [...primerosItems, ...resultados.flatMap((resultado) => resultado.items || resultado.data?.items || [])];
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function puntajeCoincidenciaProducto(producto, termino) {
  const sku = normalizarTexto(producto.sku);
  const nombre = normalizarTexto(producto.nombre);
  const palabrasNombre = nombre.split(/\s+/);
  const terminos = termino.split(/\s+/).filter(Boolean);

  if (!terminos.every((palabra) => sku.includes(palabra) || nombre.includes(palabra))) return null;

  if (sku === termino) return 0;
  if (nombre === termino) return 1;
  if (sku.startsWith(termino)) return 2;
  if (nombre.startsWith(termino)) return 3;
  if (terminos.every((terminoIndividual) => palabrasNombre.some((palabra) => palabra.startsWith(terminoIndividual)))) return 4;
  if (terminos.every((terminoIndividual) => sku.startsWith(terminoIndividual) || palabrasNombre.some((palabra) => palabra.startsWith(terminoIndividual)))) return 5;
  if (sku.includes(termino)) return 5;
  if (nombre.includes(termino)) return 6;
  return 7;
}

export default function GenerarPedido() {
  useTitulo("Generar pedido");
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeCrear = canPerformAction(usuario?.permissions, "recepciones", "create");
  const puedeEnviar = canPerformAction(usuario?.permissions, "recepciones", "enviar");

  const [filas, setFilas] = useState([]);
  const [productosActivos, setProductosActivos] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [proveedores, setProveedores] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [filtroProveedorId, setFiltroProveedorId] = useState("");
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [estadoStock, setEstadoStock] = useState("");
  const [nombrePedido, setNombrePedido] = useState("");
  const [productoManualId, setProductoManualId] = useState("");
  const [tallaManual, setTallaManual] = useState("");
  const [cantidadManual, setCantidadManual] = useState(1);
  const [busquedaProductoManual, setBusquedaProductoManual] = useState("");
  const [sugerenciasProductoAbiertas, setSugerenciasProductoAbiertas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    setCargando(true);
    Promise.all([fetchProductos(), fetchSuppliers({ activo: true, limit: 100 })])
      .then(([items, resultProveedores]) => {
        const productosDisponibles = items;
        const filasBajas = productosDisponibles
          .filter((p) => p.activo !== false)
          .flatMap(obtenerVariantesBajas)
          .sort((a, b) => b.stockRequerido - a.stockRequerido);

        setFilas(filasBajas);
        setProductosActivos(productosDisponibles);

        const cantidadesIniciales = {};
        filasBajas.forEach((f) => (cantidadesIniciales[f.id] = ""));
        setCantidades(cantidadesIniciales);

        setProveedores(resultProveedores.items || []);
      })
      .catch((err) => console.error("Error al cargar datos:", err))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    api.get("/recepciones/next-folio")
      .then((result) => setNombrePedido(result.folio || ""))
      .catch((err) => console.error("Error al obtener el nombre del pedido:", err));
  }, []);

  const toggleSeleccion = (id) => setSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCantidadChange = (id, valor) => {
    if (valor === "") {
      setCantidades((prev) => ({ ...prev, [id]: "" }));
      return;
    }
    const num = parseInt(valor, 10);
    if (!Number.isNaN(num) && num >= 1) {
      setSeleccionados((prev) => ({ ...prev, [id]: true }));
    }
    setCantidades((prev) => ({ ...prev, [id]: Number.isNaN(num) ? "" : Math.max(1, num) }));
  };

  const filasSeleccionadas = filas.filter((f) => seleccionados[f.id]);
  const productoManual = productosActivos.find((producto) => producto.id === productoManualId);
  const terminoBusquedaProducto = normalizarTexto(busquedaProductoManual);
  const productosManualesFiltrados = terminoBusquedaProducto
    ? productosActivos
      .map((producto) => ({ producto, puntaje: puntajeCoincidenciaProducto(producto, terminoBusquedaProducto) }))
      .filter(({ puntaje }) => puntaje !== null)
      .sort((a, b) => a.puntaje - b.puntaje || a.producto.nombre.localeCompare(b.producto.nombre, "es"))
      .map(({ producto }) => producto)
    : [];
  const tallasManuales = productoManual
    ? [...new Set([
        ...(TALLAS_POR_CATEGORIA[productoManual.categoria] || ["Unitalla"]),
        ...obtenerInventario(productoManual).map((variante) => variante.talla).filter(Boolean),
      ])]
    : [];
  const proveedoresSeleccionados = [...new Set(filasSeleccionadas.map((fila) => fila.supplierId).filter(Boolean))];
  const requiereProveedorManual = filasSeleccionadas.length > 0 && (
    proveedoresSeleccionados.length !== 1 || filasSeleccionadas.some((fila) => !fila.supplierId)
  );
  const proveedorComunId = requiereProveedorManual ? "" : proveedoresSeleccionados[0] || "";
  const seleccionProveedorKey = filasSeleccionadas.map((fila) => `${fila.id}:${fila.supplierId}`).sort().join("|");
  const proveedorSeleccionado = proveedores.find((proveedor) => proveedor.id === supplierId);
  const totalPiezasSeleccionadas = filasSeleccionadas.reduce((total, fila) => total + Number(cantidades[fila.id] || 0), 0);
  const totalPedido = filasSeleccionadas.reduce((total, fila) => total + Number(cantidades[fila.id] || 0) * Number(fila.precioCompra || 0), 0);

  useEffect(() => {
    setSupplierId(proveedorComunId);
  }, [proveedorComunId, seleccionProveedorKey]);

  const seleccionarProductoManual = (producto) => {
    setProductoManualId(producto.id);
    setBusquedaProductoManual(`${producto.sku} — ${producto.nombre}`);
    setTallaManual("");
    setSugerenciasProductoAbiertas(false);
  };

  const handleBusquedaProductoManual = (valor) => {
    setBusquedaProductoManual(valor);
    setProductoManualId("");
    setTallaManual("");
    setSugerenciasProductoAbiertas(true);
  };

  const handleAgregarProducto = () => {
    if (!productoManual) return showToast("Selecciona un producto.", "error");
    if (!tallaManual) return showToast("Selecciona una talla.", "error");
    if (!Number.isInteger(Number(cantidadManual)) || Number(cantidadManual) < 1) {
      return showToast("Ingresa una cantidad válida mayor a 0.", "error");
    }

    const filaExistente = filas.find((fila) => fila.productId === productoManual.id && fila.talla === tallaManual);
    const id = filaExistente?.id || `manual-${productoManual.id}-${tallaManual}`;
    if (!filaExistente) {
      setFilas((prev) => ([
        ...prev,
        {
          id,
          productId: productoManual.id,
          sku: productoManual.sku,
          nombre: productoManual.nombre,
          talla: tallaManual,
          stockActual: obtenerInventario(productoManual).find((variante) => variante.talla === tallaManual)?.stock ?? 0,
          stockRequerido: 0,
          precioCompra: Number(productoManual.precioCompra) || 0,
          supplierId: productoManual.supplierId || "",
          estadoStock: "manual",
          sugerido: false,
        },
      ]));
    }
    setSeleccionados((prev) => ({ ...prev, [id]: true }));
    setCantidades((prev) => ({ ...prev, [id]: Number(cantidadManual) }));
    setProductoManualId("");
    setTallaManual("");
    setCantidadManual(1);
    setBusquedaProductoManual("");
    setSugerenciasProductoAbiertas(false);
    showToast("Producto agregado a Pedido actual.", "success");
  };

  const quitarDelPedido = (fila) => {
    setSeleccionados((prev) => ({ ...prev, [fila.id]: false }));
    setCantidades((prev) => ({ ...prev, [fila.id]: "" }));
    if (!fila.sugerido) setFilas((prev) => prev.filter((item) => item.id !== fila.id));
  };

  const filasVisibles = filas.filter((fila) => {
    const coincideProveedor = !filtroProveedorId || fila.supplierId === filtroProveedorId;
    const coincideEstado = !estadoStock || fila.estadoStock === estadoStock;
    return coincideProveedor && coincideEstado;
  });
  const filasSugeridasVisibles = filasVisibles.filter((fila) => fila.sugerido);

  const construirItems = () =>
    filasSeleccionadas.map((f) => ({
      productId: f.productId,
      talla: f.talla,
      cantidad: Number(cantidades[f.id]),
      costoUnitario: f.precioCompra,
    }));

  const hayCantidadInvalida = () => filasSeleccionadas.some((f) => !Number.isInteger(Number(cantidades[f.id])) || Number(cantidades[f.id]) < 1);

  const handleGuardarBorrador = async () => {
    if (!puedeCrear) return showToast("No tienes permiso para crear pedidos.", "error");
    if (filasSeleccionadas.length === 0) return showToast("Selecciona al menos un producto.", "error");
    if (hayCantidadInvalida()) return showToast("Ingresa una cantidad válida para cada producto seleccionado.", "error");
    setGuardando(true);
    try {
      await crearPedido({ supplierId: supplierId || null, items: construirItems(), folio: nombrePedido });
      showToast("Pedido guardado como borrador.", "success");
      navigate("/reabastecimiento/pedidos");
    } catch (err) {
      showToast(err.message || "No se pudo guardar el pedido.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleEnviarProveedor = async () => {
    if (!puedeCrear || !puedeEnviar) return showToast("No tienes permiso para enviar pedidos.", "error");
    if (filasSeleccionadas.length === 0) return showToast("Selecciona al menos un producto.", "error");
    if (hayCantidadInvalida()) return showToast("Ingresa una cantidad válida para cada producto seleccionado.", "error");
    if (!supplierId) return showToast("Selecciona un proveedor primero.", "error");
    setGuardando(true);
    try {
      const pedido = await crearPedido({ supplierId, items: construirItems(), folio: nombrePedido });
      await enviarPedido(pedido.id);
      showToast("Pedido enviado al proveedor.", "success");
      navigate("/reabastecimiento/pedidos");
    } catch (err) {
      showToast(err.message || "No se pudo enviar el pedido.", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-8 flex flex-col gap-6 font-body">
      <Toast message={toast.message} type={toast.type} icon={toast.type === "success" ? "bi-check-lg" : undefined} onClose={() => setToast({ message: "", type: "success" })} />

      <Encabezado titulo="Generar pedido" />

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs lg:text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
          Nombre del pedido:
        </span>
        <input
          type="text"
          value={nombrePedido}
          onChange={(e) => setNombrePedido(e.target.value)}
          placeholder="RCP-001"
          className="h-11 min-w-0 flex-1 lg:flex-none lg:w-1/2 rounded-[2px] px-3 text-sm outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
          aria-label="Nombre del pedido"
        />
      </div>

      <section className="order-10 rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
            <div>
              <h2 className="text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Pedido actual</h2>
              <p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Revisa cantidades, elimina artículos y confirma el proveedor antes de guardar o enviar.</p>
            </div>
            <div className="flex gap-4 text-right">
              <div><p className="text-[10px] font-tag uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Piezas</p><p className="font-bold text-[var(--noir)] dark:text-[var(--snow)]">{totalPiezasSeleccionadas}</p></div>
              <div><p className="text-[10px] font-tag uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Total</p><p className="font-bold text-[var(--noir)] dark:text-[var(--snow)]">${totalPedido.toLocaleString("es-MX")}</p></div>
            </div>
          </div>

          {filasSeleccionadas.length === 0 ? (
            <div className="p-10 text-center">
              <i className="bi bi-cart-x text-3xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
              <p className="mt-3 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Aún no agregas productos al pedido.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-[var(--ivory-deep)] dark:bg-[var(--gold-08)]">
                    <tr className="border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                      <th className="p-3 text-left font-tag text-[11px] uppercase tracking-wider">Producto</th>
                      <th className="p-3 text-center font-tag text-[11px] uppercase tracking-wider">Talla</th>
                      <th className="p-3 text-center font-tag text-[11px] uppercase tracking-wider">Cantidad (Piezas)</th>
                      <th className="p-3 text-right font-tag text-[11px] uppercase tracking-wider">Costo unit.</th>
                      <th className="p-3 text-right font-tag text-[11px] uppercase tracking-wider">Subtotal</th>
                      <th className="p-3 text-center font-tag text-[11px] uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasSeleccionadas.map((fila) => {
                      const cantidad = Number(cantidades[fila.id] || 0);
                      return (
                        <tr key={fila.id} className="border-b border-[var(--border-gold-20)]">
                          <td className="p-3"><p className="font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{fila.nombre}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{fila.sku} · <span className="uppercase">{fila.sugerido ? "Sugerido" : "Agregado manualmente"}</span></p></td>
                          <td className="p-3 text-center">{fila.talla}</td>
                          <td className="p-3 text-center"><input type="number" min="1" value={cantidades[fila.id] ?? ""} onChange={(e) => handleCantidadChange(fila.id, e.target.value)} className="h-9 w-20 rounded-[2px] text-center outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]" /></td>
                          <td className="p-3 text-right">${Number(fila.precioCompra || 0).toLocaleString("es-MX")}</td>
                          <td className="p-3 text-right font-semibold">${(cantidad * Number(fila.precioCompra || 0)).toLocaleString("es-MX")}</td>
                          <td className="p-3 text-center"><button type="button" onClick={() => quitarDelPedido(fila)} className="text-xs font-bold text-red-700 dark:text-rojo hover:underline"><i className="bi bi-trash3 mr-1" />Quitar</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 p-4">
                <div className="rounded-[2px] border p-4 bg-[var(--gold-08)] border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
                  {requiereProveedorManual ? (
                    <label className="block text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Los productos tienen proveedores distintos. Elige el proveedor del pedido.
                      <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-2 h-10 w-full max-w-md rounded-[2px] px-3 text-sm normal-case font-body outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"><option value="">Selecciona un proveedor</option>{proveedores.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}</select>
                    </label>
                  ) : <p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Proveedor del pedido: <strong>{proveedorSeleccionado?.nombre || "Sin proveedor asignado"}</strong></p>}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {puedeCrear && <button onClick={handleGuardarBorrador} disabled={guardando} className="px-5 py-2.5 text-xs font-bold rounded-[2px] border border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:text-[var(--gold-light)] disabled:opacity-50"><i className="bi bi-save mr-2" />Guardar borrador</button>}
                  {puedeCrear && puedeEnviar && <button onClick={handleEnviarProveedor} disabled={guardando || !supplierId} className="px-5 py-2.5 text-xs font-bold rounded-[2px] bg-[var(--gold)] text-[var(--noir)] disabled:opacity-50"><i className="bi bi-send mr-2" />Enviar a {proveedorSeleccionado?.nombre || "proveedor"}</button>}
                </div>
              </div>
            </>
          )}
      </section>

      <>

      <section className="order-5 rounded-[2px] border p-4 bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Agregar producto</h2>
            <p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Busca cualquier producto activo y agrega una talla aunque todavía no tenga inventario.</p>
          </div>
          <div className="relative w-full sm:w-[30rem] text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Buscar producto
            <input
              type="search"
              value={busquedaProductoManual}
              onChange={(e) => handleBusquedaProductoManual(e.target.value)}
              onFocus={() => terminoBusquedaProducto && setSugerenciasProductoAbiertas(true)}
              onBlur={() => setSugerenciasProductoAbiertas(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && productosManualesFiltrados.length > 0) {
                  e.preventDefault();
                  seleccionarProductoManual(productosManualesFiltrados[0]);
                }
                if (e.key === "Escape") setSugerenciasProductoAbiertas(false);
              }}
              placeholder="Escribe SKU o nombre, por ejemplo: blusa o 102..."
              role="combobox"
              aria-expanded={sugerenciasProductoAbiertas && productosManualesFiltrados.length > 0}
              aria-controls="sugerencias-productos-pedido"
              aria-autocomplete="list"
              className="mt-1.5 h-10 w-full rounded-[2px] px-3 text-sm normal-case font-body outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
            />
            {sugerenciasProductoAbiertas && terminoBusquedaProducto && (
              <div id="sugerencias-productos-pedido" role="listbox" className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-[2px] border shadow-lg bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
                {productosManualesFiltrados.length > 0 ? productosManualesFiltrados.map((producto) => (
                  <button
                    key={producto.id}
                    type="button"
                    role="option"
                    aria-selected={producto.id === productoManualId}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => seleccionarProductoManual(producto)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left normal-case transition-colors hover:bg-[var(--gold-08)]"
                  >
                    <span className="min-w-0"><strong className="block truncate text-sm text-[var(--noir)] dark:text-[var(--snow)]">{producto.nombre}</strong><span className="block truncate text-[11px] font-body font-medium text-[var(--noir-soft)] dark:text-[var(--ash)]">SKU: {producto.sku || "Sin SKU"}</span></span>
                    <span className="flex items-center gap-2 shrink-0">{producto.activo === false && <span className="rounded-[2px] border border-red-600/40 bg-red-600/10 px-2 py-1 text-[10px] font-bold text-red-700 dark:border-rojo/40 dark:text-rojo">Inactivo</span>}<i className="bi bi-plus-circle text-[var(--gold-dark)] dark:text-[var(--gold-light)]" /></span>
                  </button>
                )) : <p className="px-3 py-3 normal-case font-body font-medium text-[var(--noir-soft)] dark:text-[var(--ash)]">No encontramos productos activos con esa búsqueda.</p>}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_7rem_auto] gap-3 items-end">
          <div className="min-h-11 rounded-[2px] border px-3 py-2 bg-[var(--ivory-deep)] border-[var(--border-gold-25)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]">
            {productoManual ? <><p className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Producto seleccionado{productoManual.activo === false ? " · Inactivo" : ""}</p><p className="mt-0.5 truncate text-sm font-semibold normal-case text-[var(--noir)] dark:text-[var(--snow)]">{productoManual.sku} — {productoManual.nombre}</p></> : <p className="pt-1 text-xs font-body normal-case text-[var(--noir-soft)] dark:text-[var(--ash)]">Busca y selecciona un producto para continuar.</p>}
          </div>
          <label className="hidden">
            Producto
            <select
              value={productoManualId}
              onChange={(e) => {
                setProductoManualId(e.target.value);
                setTallaManual("");
              }}
              className="mt-1.5 w-full h-11 rounded-[2px] px-3 text-sm normal-case font-body outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
            >
              <option value="">Selecciona un producto</option>
              {productosManualesFiltrados.map((producto) => <option key={producto.id} value={producto.id}>{producto.sku} — {producto.nombre}</option>)}
            </select>
          </label>

          <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Talla
            <select
              value={tallaManual}
              onChange={(e) => setTallaManual(e.target.value)}
              disabled={!productoManual}
              className="mt-1.5 w-full h-11 rounded-[2px] px-3 text-sm normal-case font-body outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-50 dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
            >
              <option value="">Selecciona una talla</option>
              {tallasManuales.map((talla) => {
                const stockActual = obtenerInventario(productoManual).find((variante) => variante.talla === talla)?.stock ?? 0;
                return <option key={talla} value={talla}>{talla} · Stock actual {stockActual}</option>;
              })}
            </select>
          </label>

          <label className="text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">
            Cantidad (Piezas)
            <input
              type="number"
              min="1"
              value={cantidadManual}
              onChange={(e) => setCantidadManual(e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1.5 w-full h-11 rounded-[2px] px-3 text-sm font-body outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
            />
          </label>

          {puedeCrear && (
          <button
            type="button"
            onClick={handleAgregarProducto}
            className="h-11 px-4 rounded-[2px] bg-[var(--gold)] text-[var(--noir)] text-xs font-bold font-body transition-opacity hover:opacity-90"
          >
            <i className="bi bi-plus-lg mr-1" /> Agregar
          </button>
          )}
        </div>
      </section>

      <div className="hidden">
        <button
          type="button"
          onClick={() => setFiltroAbierto(true)}
          className="shrink-0 h-11 px-2.5 sm:px-3 rounded-[2px] border text-xs lg:text-sm font-bold font-body transition-colors border-[var(--border-gold-40)] text-[var(--gold-dark)] hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)] dark:hover:bg-[var(--gold-08)]"
        >
          <i className="bi bi-funnel mr-2" />Filtrar
        </button>
      </div>

      <div className="hidden">
        <h2 className="mb-3 text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Productos sugeridos con bajo stock</h2>
        <div className="overflow-x-auto rounded-[2px] border bg-[var(--snow)] border-[var(--border-gold-40)] shadow-md dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-[var(--ivory-deep)] border-[var(--border-gold-40)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]">
              <th className="p-4 text-center w-12"></th>
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">SKU</th>
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">Producto</th>
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">Talla</th>
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">Stock Actual</th>
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">Stock requerido</th>
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">Cantidad a pedir</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)]">
            {cargando ? (
              <tr><td colSpan={7} className="text-center py-10"><i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando productos...</td></tr>
            ) : filasSugeridasVisibles.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10">No hay productos sugeridos que coincidan con los filtros.</td></tr>
            ) : (
              filasSugeridasVisibles.map((fila) => (
                <tr key={fila.id} className="border-b border-[var(--border-gold-20)] hover:bg-[var(--gold-08)]">
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={!!seleccionados[fila.id]}
                      onChange={() => toggleSeleccion(fila.id)}
                      className="w-4 h-4 accent-[var(--gold)] cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-center">{fila.sku}</td>
                  <td className="p-4 text-center font-medium text-[var(--noir-soft)] dark:text-[var(--snow)]">
                    {fila.nombre}
                    {!fila.sugerido && <span className="block mt-1 text-[10px] font-tag uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Agregado manualmente</span>}
                  </td>
                  <td className="p-4 text-center">{fila.talla}</td>
                  <td className="p-4 text-center font-semibold">{fila.stockActual}</td>
                  <td className="p-4 text-center font-semibold">{fila.stockRequerido}</td>
                  <td className="p-4 text-center">
                    <input
                      type="number"
                      min={1}
                      value={cantidades[fila.id] ?? ""}
                      onChange={(e) => handleCantidadChange(fila.id, e.target.value)}
                      className="w-20 h-9 rounded-[2px] text-center outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {requiereProveedorManual && filasSeleccionadas.length > 0 && (
          <div className="flex-1 rounded-[2px] border p-3 bg-[var(--gold-08)] border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
            <p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] mb-2">Los productos seleccionados tienen proveedores distintos. Elige a quién enviar este pedido.</p>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full sm:max-w-sm h-10 rounded-[2px] px-3 text-sm font-body outline-none bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
            >
              <option value="">Selecciona un proveedor</option>
              {proveedores.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>)}
            </select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:ml-auto">
          {puedeCrear && (
          <button
            onClick={handleGuardarBorrador}
            disabled={guardando}
            className="flex items-center justify-center gap-2 bg-transparent text-[var(--gold-dark)] border border-[var(--border-gold-40)] rounded-[2px] px-5 py-2.5 text-xs lg:text-sm font-bold font-body transition-all duration-300 active:scale-95 cursor-pointer hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)] disabled:opacity-50"
          >
            <i className="bi bi-save" /> Guardar como borrador
          </button>
          )}

        {puedeCrear && puedeEnviar && filasSeleccionadas.length > 0 && (
          <button
            onClick={handleEnviarProveedor}
            disabled={guardando || !supplierId}
            className="flex items-center justify-center gap-2 bg-[var(--gold)] text-[var(--noir)] rounded-[2px] px-5 py-2.5 text-xs lg:text-sm font-bold font-body transition-all duration-300 active:scale-95 cursor-pointer hover:opacity-90 disabled:opacity-50 shadow-md"
          >
            <i className="bi bi-send" /> Enviar a proveedor {proveedorSeleccionado?.nombre || "seleccionado"}
          </button>
        )}
        </div>
      </div>
      </div>
      </>

      {filtroAbierto && (
        <div className="fixed inset-x-0 bottom-0 top-[80px] sm:top-[88px] z-40 bg-black/30" onClick={() => setFiltroAbierto(false)}>
          <aside
            className="absolute right-0 top-0 bottom-0 w-[calc(100%-1rem)] xs:w-[22rem] sm:w-[24rem] lg:w-[26rem] max-w-full overflow-y-auto p-4 sm:p-6 shadow-2xl bg-[var(--snow)] dark:bg-[var(--noir-soft)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b pb-4 border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)]">
              <h2 className="text-lg font-display font-bold uppercase tracking-wider text-[var(--noir)] dark:text-[var(--snow)]">Filtrar productos por:</h2>
              <button type="button" onClick={() => setFiltroAbierto(false)} aria-label="Cerrar filtros" className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <label className="block mt-6 text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">
              Proveedor
              <select
                value={filtroProveedorId}
                onChange={(e) => setFiltroProveedorId(e.target.value)}
                className="mt-2 w-full h-11 rounded-[2px] px-3 text-sm outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
              >
                <option value="">Todos</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
            <label className="block mt-5 text-xs font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)]">
              Estado
              <select
                value={estadoStock}
                onChange={(e) => setEstadoStock(e.target.value)}
                className="mt-2 w-full h-11 rounded-[2px] px-3 text-sm outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
              >
                <option value="">Todos</option>
                <option value="sinUnidades">Sin unidades</option>
                <option value="critico">Crítico</option>
                <option value="bajo">Bajo</option>
              </select>
            </label>
          </aside>
        </div>
      )}
    </div>
  );
}
