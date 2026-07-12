import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { fetchSuppliers } from "../services/suppliers.service";
import { crearPedido, enviarPedido } from "../services/pedidos.service";
import Encabezado from "../components/Encabezado";
import Toast from "../components/Toast";

function obtenerVariantesBajas(producto) {
  const inventario = Array.isArray(producto.inventario)
    ? producto.inventario
    : Array.isArray(producto.variants)
    ? producto.variants
    : [];

  const minimo = Number(producto.stockMinimo) || 5;

  return inventario
    .filter((v) => (v.stock ?? 0) <= minimo)
    .map((v) => ({
      id: `${producto.id}-${v.talla}`,
      productId: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      talla: v.talla,
      stockActual: v.stock ?? 0,
      stockRequerido: Math.max(0, minimo - (v.stock ?? 0)),
      precioCompra: Number(producto.precioCompra) || 0,
    }));
}

export default function GenerarPedido() {
  const navigate = useNavigate();
  const location = useLocation();

  const [filas, setFilas] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [proveedores, setProveedores] = useState([]);
  const [supplierId, setSupplierId] = useState("");
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
        const filasBajas = items.filter((p) => p.activo !== false).flatMap(obtenerVariantesBajas);

        setFilas(filasBajas);

        const cantidadesIniciales = {};
        filasBajas.forEach((f) => (cantidadesIniciales[f.id] = f.stockRequerido || 1));
        setCantidades(cantidadesIniciales);

        setProveedores(resultProveedores.items || []);
      })
      .catch((err) => console.error("Error al cargar datos:", err))
      .finally(() => setCargando(false));
  }, []);

  const toggleSeleccion = (id) => setSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCantidadChange = (id, valor) => {
    const num = Math.max(1, parseInt(valor, 10) || 1);
    setCantidades((prev) => ({ ...prev, [id]: num }));
  };

  const filasSeleccionadas = filas.filter((f) => seleccionados[f.id]);

  const construirItems = () =>
    filasSeleccionadas.map((f) => ({
      productId: f.productId,
      talla: f.talla,
      cantidad: cantidades[f.id] || 1,
      costoUnitario: f.precioCompra,
    }));

  const handleGuardarBorrador = async () => {
    if (filasSeleccionadas.length === 0) return showToast("Selecciona al menos un producto.", "error");
    setGuardando(true);
    try {
      await crearPedido({ supplierId: supplierId || null, items: construirItems() });
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
    if (!supplierId) return showToast("Selecciona un proveedor primero.", "error");
    setGuardando(true);
    try {
      const pedido = await crearPedido({ supplierId, items: construirItems() });
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
    { label: "Resumen", active: location.pathname === "/reabastecimiento", onClick: () => navigate("/reabastecimiento") },
    { label: "Mis pedidos", active: location.pathname === "/reabastecimiento/pedidos", onClick: () => navigate("/reabastecimiento/pedidos") },
    { label: "Generar pedido", active: location.pathname === "/reabastecimiento/generar-pedido", onClick: () => navigate("/reabastecimiento/generar-pedido") },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-body">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />

      <Encabezado titulo="Reabastecimiento" tabs={tabs} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs lg:text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] shrink-0">
          Proveedor (opcional)
        </label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="h-11 rounded-[2px] px-3 text-sm outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] max-w-xs"
        >
          <option value="">Sin proveedor asignado</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
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
              <th className="p-4 text-center font-tag text-[11px] lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--noir-soft)] dark:text-[var(--gold-light)]">Cantidad a pedir</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)]">
            {cargando ? (
              <tr><td colSpan={6} className="text-center py-10"><i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando productos...</td></tr>
            ) : filas.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10">No hay productos bajos de stock.</td></tr>
            ) : (
              filas.map((fila) => (
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
                  <td className="p-4 text-center">
                    <input
                      type="number"
                      min={1}
                      value={cantidades[fila.id] ?? 1}
                      onChange={(e) => handleCantidadChange(fila.id, e.target.value)}
                      disabled={!seleccionados[fila.id]}
                      className="w-20 h-9 rounded-[2px] text-center outline-none font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--noir)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] disabled:opacity-40"
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
    </div>
  );
}