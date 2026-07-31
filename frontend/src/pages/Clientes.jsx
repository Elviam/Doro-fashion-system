import { useEffect, useState } from "react";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import ToolBar from "../components/ToolBar";
import Paginacion from "../components/Paginacion";
import Encabezado from "../components/Encabezado";
import { staffApi } from "../services/api";
import useTitulo from "../hooks/useTitulo";

import ModalClientes from "../components/ModalClientes";

const LIMIT = 10;
const encabezadosClientes = ["Nombre", "Correo", "Registro", "Compras", "Última compra"];

const formatearFecha = (fecha) => fecha
  ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(fecha))
  : "—";

export default function Clientes() {
  useTitulo("Clientes");

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, registradosUltimaSemana: 0 });
  const [search, setSearch] = useState("");
  const [paginaActiva, setPaginaActiva] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null); 

  const handleVerCliente = (cliente) => setClienteSeleccionado(cliente);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("page", String(paginaActiva));
    params.set("limit", String(LIMIT));
    if (search.trim()) params.set("q", search.trim());
    return params.toString();
  };

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const queryString = buildQuery();
        const data = await staffApi.get(`/clients?${queryString}`);
        const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
        setRows(items);
        setTotalRegistros(typeof data.total === "number" ? data.total : items.length);
        setStats(data.stats || { total: data.total ?? items.length, registradosUltimaSemana: 0 });

      } catch (error) {
        console.error("Error cargando clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, [search, paginaActiva, refresh]);

  useEffect(() => {
    setPaginaActiva(1);
  }, [search]);

  const handleCambiarPagina = (page) => {
    if (page === "‹") {
      setPaginaActiva((current) => Math.max(1, current - 1));
    } else if (page === "›") {
      const totalPaginas = Math.max(1, Math.ceil(totalRegistros / LIMIT));
      setPaginaActiva((current) => Math.min(totalPaginas, current + 1));
    } else {
      setPaginaActiva(Number(page));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--snow)] dark:bg-[var(--noir-soft)]">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">
        
        <Encabezado 
          titulo="Clientes" 
          onActualizar={() => setRefresh((prev) => prev + 1)} 
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 max-w-2xl">
          <Tarjetas
            label="Total de clientes"
            value={stats.total}
            sub="Cuentas registradas"
            icon="bi bi-people"
          />
          <Tarjetas
            label="Nuevos clientes"
            value={stats.registradosUltimaSemana}
            sub="Registrados en los últimos 7 días"
            accent="#84B140"
            icon="bi bi-person-plus"
          />
        </div>

        <ToolBar
          busqueda={search}
          setBusqueda={setSearch}
          placeholderBuscar="Buscar por nombre, correo o teléfono..."
        />

        <Tabla encabezados={encabezadosClientes}>
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center py-10 text-sm lg:text-base font-body text-[var(--noir-soft)]">
                <i className="bi bi-arrow-repeat spinner-cargando mr-2 text-[var(--noir-soft)] dark:text-[var(--ash)]" />Cargando clientes...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-10 text-sm lg:text-base font-body text-[var(--noir-soft)]">
                No hay resultados
              </td>
            </tr>
          ) : (
            rows.map((usuario) => (
              <tr
                key={usuario.id}
                onClick={() => handleVerCliente(usuario)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") handleVerCliente(usuario);
                }}
                tabIndex={0}
                role="button"
                className="border-b transition-colors border-[var(--border-gold-20)] hover:bg-[var(--gold-08)] dark:hover:bg-[var(--gold-08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
              >
                <td className="p-4 text-center text-sm lg:text-base whitespace-nowrap font-medium font-body text-[var(--noir)] dark:text-[var(--snow)]">{usuario.nombre}</td>
                <td className="p-4 text-center text-sm lg:text-base whitespace-nowrap font-body text-[var(--noir-soft)] dark:text-[var(--snow)]">{usuario.email}</td>
                <td className="p-4 text-center text-sm lg:text-base whitespace-nowrap font-body text-[var(--noir)] dark:text-[var(--snow)]">{formatearFecha(usuario.createdAt)}</td>
                <td className="p-4 text-center text-sm lg:text-base whitespace-nowrap font-body text-[var(--noir)] dark:text-[var(--snow)]">{usuario.totalCompras ?? 0}</td>
                <td className="p-4 text-center text-sm lg:text-base whitespace-nowrap font-body text-[var(--noir)] dark:text-[var(--snow)]">{formatearFecha(usuario.ultimaCompra)}</td>
              </tr>
            ))
          )}
        </Tabla>

        <Paginacion
          paginaActual={paginaActiva}
          totalRegistros={totalRegistros}
          rangoSiguiente={`${totalRegistros === 0 ? 0 : (paginaActiva - 1) * LIMIT + 1} – ${Math.min(paginaActiva * LIMIT, totalRegistros)}`}
          onCambiarPagina={handleCambiarPagina}
          exportTitulo="Clientes"
          exportColumnas={[
            { header: "Nombre",   key: "nombre",   width: 28 },
            { header: "Email",    key: "email",    width: 28 },
            { header: "Registro", key: "registro", width: 16 },
            { header: "Compras", key: "compras", width: 12 },
            { header: "Última compra", key: "ultimaCompra", width: 18 },
          ]}
          exportFilas={rows.map((c) => ({
            nombre:   c.nombre,
            email:    c.email,
            registro: formatearFecha(c.createdAt),
            compras: c.totalCompras ?? 0,
            ultimaCompra: formatearFecha(c.ultimaCompra),
          }))}
        />

      </div>

      {clienteSeleccionado && (
        <ModalClientes
          cliente={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
        />
      )}
    </div>
  );
}
