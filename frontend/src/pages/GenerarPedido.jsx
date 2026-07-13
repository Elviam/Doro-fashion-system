import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { fetchSuppliers } from "../services/suppliers.service";
import { crearPedido, enviarPedido } from "../services/pedidos.service";
import Encabezado from "../components/Encabezado";
import Toast from "../components/Toast";
import useTitulo from "../hooks/useTitulo";

function obtenerVariantesBajas(producto) {
  const inventario = Array.isArray(producto.inventario)
    ? producto.inventario
    : Array.isArray(producto.variants)
    ? producto.variants
    : [];

  const minimo = Number(producto.stockMinimo) || 5;
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
      estadoStock: (v.stock ?? 0) === 0
        ? "sinUnidades"
        : (v.stock ?? 0) < minimo
        ? "critico"
        : (v.stock ?? 0) <= ideal
        ? "bajo"
        : "normal",
    }));
}

export default function GenerarPedido() {
  useTitulo("Generar pedido");
  const navigate = useNavigate();
  const location = useLocation();

  const [filas, setFilas] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [proveedores, setProveedores] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [estadoStock, setEstadoStock] = useState("");
  const [nombrePedido, setNombrePedido] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    setCargando(true);
    Promise.all([api.get("/products"), fetchSuppliers({ activo: true, limit: 100 })])
      .then(([resultProductos, resultProveedores]) => {
        const items =
          resultProductos.items || resultProductos.data?.items || (Array.isArray(resultProductos) ? resultProductos : []);
        const filasBajas = items
          .filter((p) => p.activo !== false)
          .flatMap(obtenerVariantesBajas)
          .sort((a, b) => b.stockRequerido - a.stockRequerido);

        setFilas(filasBajas);

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

  const textoBusqueda = busqueda.trim().toLowerCase();
  const filasVisibles = filas.filter((fila) => {
    const coincideBusqueda = !textoBusqueda ||
      fila.sku?.toLowerCase().includes(textoBusqueda) ||
      fila.nombre?.toLowerCase().includes(textoBusqueda);
    const coincideProveedor = !supplierId || fila.supplierId === supplierId;
    const coincideEstado = !estadoStock || fila.estadoStock === estadoStock;
    return coincideBusqueda && coincideProveedor && coincideEstado;
  });

  const construirItems = () =>
    filasSeleccionadas.map((f) => ({
      productId: f.productId,
      talla: f.talla,
      cantidad: Number(cantidades[f.id]),
      costoUnitario: f.precioCompra,
    }));

  const hayCantidadInvalida = () => filasSeleccionadas.some((f) => !Number.isInteger(Number(cantidades[f.id])) || Number(cantidades[f.id]) < 1);

  const handleGuardarBorrador = async () => {
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

  const tabs = [
    { label: "Resumen", icon: "resumen", active: location.pathname === "/reabastecimiento", onClick: () => navigate("/reabastecimiento") },
    { label: "Generar pedido", icon: "generarPedido", active: location.pathname === "/reabastecimiento/generar-pedido", onClick: () => navigate("/reabastecimiento/generar-pedido") },
    { label: "Mis pedidos", icon: "misPedidos", active: location.pathname === "/reabastecimiento/pedidos", onClick: () => navigate("/reabastecimiento/pedidos") },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-28 sm:pb-8 flex flex-col gap-6 font-body">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />

      <Encabezado titulo="Generar pedido" tabs={tabs} />

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

      <div className="flex flex-row items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por SKU o nombre de producto..."
            className="w-full h-11 rounded-[2px] pl-10 pr-3 text-sm outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltroAbierto(true)}
          className="shrink-0 h-11 px-2.5 sm:px-3 rounded-[2px] border text-xs lg:text-sm font-bold font-body transition-colors border-[var(--border-gold-40)] text-[var(--gold-dark)] hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)] dark:hover:bg-[var(--gold-08)]"
        >
          <i className="bi bi-funnel mr-2" />Filtrar
        </button>
      </div>

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
            ) : filasVisibles.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10">No hay productos que coincidan con la búsqueda o los filtros.</td></tr>
            ) : (
              filasVisibles.map((fila) => (
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
                  <td className="p-4 text-center font-medium text-[var(--noir-soft)] dark:text-[var(--snow)]">{fila.nombre}</td>
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

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={handleGuardarBorrador}
          disabled={guardando}
          className="flex items-center justify-center gap-2 bg-transparent text-[var(--gold-dark)] border border-[var(--border-gold-40)] rounded-[2px] px-5 py-2.5 text-xs lg:text-sm font-bold font-body transition-all duration-300 active:scale-95 cursor-pointer hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)] disabled:opacity-50"
        >
          <i className="bi bi-save" /> Guardar como borrador
        </button>

        {supplierId && (
          <button
            onClick={handleEnviarProveedor}
            disabled={guardando}
            className="flex items-center justify-center gap-2 bg-[var(--gold)] text-[var(--noir)] rounded-[2px] px-5 py-2.5 text-xs lg:text-sm font-bold font-body transition-all duration-300 active:scale-95 cursor-pointer hover:opacity-90 disabled:opacity-50 shadow-md"
          >
            <i className="bi bi-send" /> Enviar pedido a proveedor
          </button>
        )}
      </div>

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
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
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
