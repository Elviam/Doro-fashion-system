import { useState, useEffect } from "react";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";

function obtenerVariantesBajas(producto) {
  const inventario = Array.isArray(producto.inventario)
    ? producto.inventario
    : Array.isArray(producto.variants)
    ? producto.variants
    : [];

  const minimo = Number(producto.stockMinimo ?? 0);
  const ideal = Number(producto.stockIdeal) || 0;

  return inventario
    .map((v) => ({
      id: `${producto.id}-${v.talla}`,
      productoId: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      talla: v.talla,
      stockActual: v.stock ?? 0,
      stockMinimo: minimo,
      stockIdeal: ideal,
      stockRequerido: ideal - (v.stock ?? 0),
      precioCompra: Number(producto.precioCompra) || 0,
    }))
    .filter((fila) => fila.stockActual <= fila.stockMinimo);
}
export default function Reabastecimiento() {
  useTitulo("Resumen");

  const [productosDB, setProductosDB] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setCargando(true);
    api
      .get("/products")
      .then((result) => {
        const items =
          result.items || result.data?.items || (Array.isArray(result) ? result : []);
        setProductosDB(items);
      })
      .catch((err) => console.error("Error productos:", err))
      .finally(() => setCargando(false));
  }, [refreshKey]);

  const filasReabastecimiento = productosDB
    .filter((p) => p.activo !== false)
    .flatMap(obtenerVariantesBajas)
    .sort((a, b) => b.stockRequerido - a.stockRequerido);

  const valorReabastecimiento = filasReabastecimiento.reduce(
    (acc, fila) => acc + fila.stockRequerido * fila.precioCompra,
    0
  );

  const productosUnicosBajos = new Set(
    filasReabastecimiento.map((f) => f.productoId)
  ).size;

const encabezadosTabla = [
    { label: "SKU", key: "sku" },
    { label: "Producto", key: "nombre" },
    { label: "Talla", key: "talla" },
    { label: "Stock Actual", key: "stockActual" },
    { label: "Stock Requerido", key: "stockRequerido" },
    { label: "Stock Ideal", key: "stockIdeal" },
  ];

  const renderFila = (fila) => {
    const esCritico = fila.stockActual <= fila.stockMinimo;
    const claseNumero = esCritico
      ? "text-[var(--color-rojo-dark)] dark:text-[var(--color-rojo)]"
      : "text-[var(--noir-soft)] dark:text-[var(--snow)]";

    return (
      <tr
        key={fila.id}
        className="border-b transition-colors duration-200 border-[var(--border-gold-20)] hover:bg-[var(--gold-08)]"
      >
        <td className="py-2 px-4 text-center font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{fila.sku}</td>
        <td className="py-2 px-4 text-center font-body text-sm font-medium text-[var(--noir-soft)] dark:text-[var(--snow)]">{fila.nombre}</td>
        <td className="py-2 px-4 text-center font-body text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{fila.talla}</td>
        <td className="py-2 px-4 text-center font-body text-sm font-bold">
          <span className={claseNumero}>{fila.stockActual}</span>
        </td>
        <td className="py-2 px-4 text-center font-body text-sm text-[var(--noir-soft)] dark:text-[var(--snow)]">
          {fila.stockRequerido}
        </td>
        <td className="py-2 px-4 text-center font-body text-sm text-[var(--noir-soft)] dark:text-[var(--snow)]">
          {fila.stockIdeal}
        </td>
      </tr>
    );
  };

 return (
    <div className="p-4 sm:p-6 lg:p-8 pb-8 flex flex-col gap-6 font-body">

      <Encabezado
        titulo="Resumen"
        onActualizar={() => setRefreshKey((k) => k + 1)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tarjetas
          label="Valor de Reabastecimiento Aproximado"
          value={`$${valorReabastecimiento.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`}
          sub="Inversión necesaria para surtir productos bajos/críticos"
          accent="#C9A84C"
          icon="bi bi-cash-stack"
        />
        <Tarjetas
          label="Total Productos Bajo Stock"
          value={productosUnicosBajos}
          sub={productosUnicosBajos > 0 ? "Requieren reposición" : "Todo en orden"}
          accent={productosUnicosBajos > 0 ? "#D04E37" : "#84B140"}
          icon={productosUnicosBajos > 0 ? "bi bi-exclamation-triangle" : "bi bi-shield-check"}
        />
      </div>

      <div className="max-h-[31rem] overflow-y-auto rounded-[2px] custom-scrollbar">
        <Tabla
          encabezados={encabezadosTabla}
          datos={filasReabastecimiento}
          renderRow={renderFila}
          sortableFields={["sku", "nombre", "talla", "stockActual", "stockRequerido"]}
          cargando={cargando}
          entidad="productos por reabastecer"
        />
      </div>
    </div>
  );
}
