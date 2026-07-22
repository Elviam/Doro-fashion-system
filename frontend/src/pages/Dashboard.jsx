import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import Etiquetas from "../components/Etiquetas";
import GraficaVentas from "../components/GraficaVentas";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";

const API_URL = import.meta.env.VITE_API_URL;
const PERIODOS = [[1, "Hoy"], [7, "7 días"], [30, "30 días"]];
const dinero = (value) => `$${Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
const porcentaje = (value) => value === null || value === undefined ? "Sin base previa" : `${value >= 0 ? "+" : ""}${Number(value).toFixed(1)}% vs. periodo anterior`;
const fecha = (value) => new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function Panel({ children, className = "" }) {
  return <section className={`rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--ivory-deep)] p-4 shadow-sm dark:bg-[var(--noir-soft)] ${className}`}>{children}</section>;
}

function CargandoTabla() {
  return <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]"><i className="bi bi-arrow-repeat animate-spin text-base" />Cargando</div>;
}

export default function Dashboard() {
  useTitulo("Dashboard");
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard/summary?days=${days}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!response.ok) throw new Error("No se pudo actualizar el dashboard.");
      setData(await response.json());
      setLoading(false);
    } catch (err) { setData(null); }
  }, [days]);

  useEffect(() => { cargar(); }, [cargar]);
  const metrics = data?.metrics || {};
  const maxIngresoTop = Math.max(1, ...(data?.topProductos || []).map((product) => product.ingreso));

  return <div className="min-h-screen space-y-5 bg-[var(--snow)] p-4 font-body text-[var(--noir)] transition-colors duration-300 dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] md:p-6">
    <Encabezado titulo="Dashboard" />

    <p className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Resumen operativo y comercial</p><div className="sticky top-0 z-10 ml-auto w-fit"><div className="flex rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] p-0.5 shadow-sm dark:bg-[var(--noir-soft)]">{PERIODOS.map(([value, label]) => <button key={value} type="button" onClick={() => setDays(value)} className={`px-3 py-1.5 text-xs font-semibold ${days === value ? "bg-[var(--gold)] text-[var(--noir)]" : "text-[var(--gold-dark)] dark:text-[var(--gold-light)]"}`}>{label}</button>)}</div></div>

    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjetas label="Ingresos confirmados" value={loading ? "—" : dinero(metrics.ingresos)} sub={loading ? "—" : porcentaje(metrics.variacionIngresos)} icon="bi bi-cash-coin" accent="#7A9959" onClick={() => navigate("/ventas")} />
        <Tarjetas label="Pedidos por enviar" value={loading ? "—" : metrics.pedidosPorEnviar || 0} sub="Requieren preparación" icon="bi bi-box-seam" accent="#C9A84C" onClick={() => navigate("/preparar-pedidos")} />
        <Tarjetas label="Bajo stock" value={loading ? "—" : metrics.bajoStock || 0} sub="Requieren reabastecimiento" icon="bi bi-exclamation-triangle" accent="#B5644B" onClick={() => navigate("/inventario")} />
        <Tarjetas label="Ventas canceladas" value={loading ? "—" : metrics.canceladas || 0} sub="En el periodo seleccionado" icon="bi bi-x-circle" accent="#B5644B" onClick={() => navigate("/ventas")} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Estadísticas comerciales</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Ticket promedio</p><p className="mt-1 text-xl font-display font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{loading ? "—" : dinero(metrics.ticketPromedio)}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Por pedido</p></div>
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Unidades vendidas</p><p className="mt-1 text-xl font-display font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{loading ? "—" : metrics.unidadesVendidas || 0}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Pedidos confirmados</p></div>
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Utilidad estimada</p><p className="mt-1 text-xl font-display font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{loading ? "—" : dinero(metrics.utilidad)}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Margen {loading ? "—" : `${Number(metrics.margen || 0).toFixed(1)}%`}</p></div>
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Clientes</p><p className="mt-1 text-xl font-display font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{loading ? "—" : metrics.clientesTotales || 0}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{loading ? "—" : `${metrics.clientesNuevos || 0} nuevos · ${metrics.clientesRecurrentes || 0} recurrentes`}</p></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Inventario y cumplimiento</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Inventario valorizado</p><p className="mt-1 text-xl font-display font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{loading ? "—" : dinero(metrics.valorInventario)}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{loading ? "—" : `${metrics.unidadesInventario || 0} unidades a costo`}</p></div>
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Pedidos pendientes</p><p className="mt-1 text-xl font-display font-semibold text-[var(--noir)] dark:text-[var(--snow)]">{loading ? "—" : metrics.pedidosPendientes || 0}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Requieren seguimiento</p></div>
          <div className="rounded-[2px] border border-[var(--border-gold-20)] bg-[var(--snow)] p-3 dark:bg-[var(--noir-soft)]"><p className="text-xs uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Pedidos atrasados</p><p className="mt-1 text-xl font-display font-semibold text-rojo">{loading ? "—" : metrics.pedidosAtrasados || 0}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Más de 48 horas</p></div>
        </div>
      </section>

      <Panel><div className="mb-4 flex items-start justify-between"><div><h2 className="font-display text-lg font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Tendencia de ventas</h2><p className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Ingresos de pedidos confirmados</p></div><strong className="text-lg text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{dinero(metrics.ingresos)}</strong></div>{loading ? <div className="h-40 animate-pulse bg-[var(--gold-08)]" /> : <GraficaVentas data={data?.salesTrend || []} />}</Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="order-1"><h2 className="mb-4 font-display text-lg font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Más vendidos</h2><div className="space-y-3">{(data?.topProductos || []).length ? data.topProductos.map((product, index) => <div key={product.id} className="space-y-1.5"><div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center bg-[var(--gold-08)] text-xs font-bold text-[var(--gold-dark)]">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.nombre}</p><p className="text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">{product.unidades} unidades</p></div><strong className="text-xs text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{dinero(product.ingreso)}</strong></div><div className="ml-9 h-1.5 overflow-hidden rounded-[2px] bg-[var(--gold-08)]"><div className="h-full rounded-[2px] bg-[var(--gold)]" style={{ width: `${(product.ingreso / maxIngresoTop) * 100}%` }} /></div></div>) : <p className="py-6 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Sin ventas confirmadas.</p>}</div></section>
        <section className="order-2 lg:col-span-2"><h2 className="mb-4 font-display text-lg font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Tallas con bajo stock</h2>{loading ? <CargandoTabla /> : <Tabla encabezados={["SKU", "Producto", "Talla", "Stock", "Mínimo", "Faltan", "Vendidas"]}>{(data?.lowStockProducts || []).length ? data.lowStockProducts.map((product) => <tr key={product.id} onClick={() => navigate("/inventario")} className="cursor-pointer hover:bg-[var(--gold-08)]"><td className="p-3 font-mono text-xs">{product.sku}</td><td className="p-3 text-sm">{product.nombre}</td><td className="p-3 text-center font-semibold">{product.talla}</td><td className="p-3 text-center font-semibold text-rojo">{product.stock}</td><td className="p-3 text-center">{product.minimo}</td><td className="p-3 text-center font-semibold text-rojo">{product.deficit}</td><td className="p-3 text-center">{product.unidadesVendidas}</td></tr>) : <tr><td colSpan={7} className="p-8 text-center text-sm">Sin alertas de inventario.</td></tr>}</Tabla>}</section>
      </div>

      <section><h2 className="mb-4 font-display text-lg font-semibold text-[var(--noir)] dark:text-[var(--snow)]">Pedidos recientes</h2>{loading ? <CargandoTabla /> : <Tabla encabezados={["Pedido", "Cliente", "Total", "Estado", "Fecha"]}>{(data?.recentSales || []).map((sale) => <tr key={sale.id} onClick={() => navigate("/ventas")} className="cursor-pointer hover:bg-[var(--gold-08)]"><td className="p-3 font-mono text-xs">{sale.numeroPedido}</td><td className="p-3 text-sm">{sale.cliente}</td><td className="p-3 font-semibold">{dinero(sale.total)}</td><td className="p-3"><Etiquetas contenido={sale.estado} /></td><td className="p-3 text-xs">{fecha(sale.createdAt)}</td></tr>)}</Tabla>}</section>
    </>
  </div>;
}
