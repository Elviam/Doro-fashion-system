import { useEffect, useState } from "react";
import Etiquetas from "../components/Etiquetas";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import ToolBar from "../components/ToolBar";
import AccionesTabla from "../components/AccionesTabla";
import Paginacion from "../components/Paginacion";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Encabezado from "../components/Encabezado";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";

import ModalClientes from "../components/ModalClientes";
import FormClientes from "../components/FormClientes";

const LIMIT = 10;
const encabezadosClientes = ["Nombre", "RFC", "Email", "Teléfono", "Estado", "Acciones"];

const opcionesFiltroClientes = [
  { value: "", label: "Todos" },
  { value: "Activo", label: "Activos" },
  { value: "Inactivo", label: "Inactivos" }
];

export default function Clientes() {
  useTitulo("Clientes");

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [paginaActiva, setPaginaActiva] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null); 
  const [clienteForm, setClienteForm] = useState({ abierto: false, esNuevo: false, data: null }); 
  const [clienteEliminando, setClienteEliminando] = useState(null);
  const [modalExito, setModalExito] = useState("");

  const handleVerCliente = (cliente) => setClienteSeleccionado(cliente);
  
  const handleEditarCliente = (cliente) => {
    setClienteSeleccionado(null);
    setClienteForm({ abierto: true, esNuevo: false, data: cliente });
  };

  const handleNuevoCliente = () => {
    setClienteForm({ abierto: true, esNuevo: true, data: null });
  };

  const guardarCliente = async (datos) => {
    try {
      if (clienteForm.esNuevo) {
        await api.post("/clients", {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          rfc: datos.rfc,
          direccion: datos.direccion,
          contacto: datos.contacto,
          notas: datos.notas,
          activo: datos.activo !== false,
          roleId: "CLIENTE"
        });

        if (datos.usuario && datos.password) {
          await api.post("/users", {
            nombre: datos.nombre,
            apellido: "Cliente",
            email: datos.email,
            usuario: datos.usuario,
            password: datos.password,
            roleId: "CLIENTE",
            activo: datos.activo !== false, 
          });
        }
        setModalExito("Cliente creado correctamente");
      } else {
        await api.patch(`/clients/${datos.id}`, {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          rfc: datos.rfc,
          direccion: datos.direccion,
          contacto: datos.contacto,
          notas: datos.notas,
          activo: datos.activo !== false
        });
        setModalExito("Cliente actualizado correctamente");
      }
      setRefresh((prev) => prev + 1);
      setClienteForm({ abierto: false, esNuevo: false, data: null });
    } catch (error) {
      console.error("Error guardando cliente:", error);
      window.alert("No se pudo guardar el cliente. Revisa la consola.");
    }
  };

  const confirmEliminarCliente = async () => {
    if (!clienteEliminando) return;
    try {
      await api.delete(`/clients/${clienteEliminando.id}`);
      setRefresh((prev) => prev + 1);
      setModalExito("Cliente eliminado correctamente");
      setClienteEliminando(null);
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      window.alert("No se pudo eliminar el cliente. Revisa la consola.");
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("page", String(paginaActiva));
    params.set("limit", String(LIMIT));
    if (search.trim()) params.set("q", search.trim());
    if (statusFilter === "Activo") params.set("activo", "true");
    if (statusFilter === "Inactivo") params.set("activo", "false");
    return params.toString();
  };

  const getStatsFromItems = (items) => {
    const activos = items.filter((item) => item.estado === "Activo").length;
    const inactivos = items.filter((item) => item.estado === "Inactivo").length;
    return {
      total: items.length,
      activos,
      inactivos,
    };
  };

  const clientesFiltrados = rows.filter((cliente) => {
    const pasaFiltroEstado = statusFilter === "" || cliente.estado === statusFilter;
    const textoBuscado = (search || "").toLowerCase();
    const pasaFiltroBusqueda = 
      String(cliente.nombre || "").toLowerCase().includes(textoBuscado) ||
      String(cliente.rfc || "").toLowerCase().includes(textoBuscado) ||
      String(cliente.email || "").toLowerCase().includes(textoBuscado) ||
      String(cliente.telefono || "").toLowerCase().includes(textoBuscado);
    return pasaFiltroEstado && pasaFiltroBusqueda;
  });

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const queryString = buildQuery();
        const data = await api.get(`/clients?${queryString}`);
        const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
        const normalized = items.map((item) => ({
          ...item,
          estado: item.activo === false ? "Inactivo" : "Activo",
          rol: "CLIENTE",
        }));

        setRows(normalized);
        setTotalRegistros(typeof data.total === "number" ? data.total : normalized.length);
        setStats(getStatsFromItems(normalized));

      } catch (error) {
        console.error("Error cargando clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, [statusFilter, search, paginaActiva, refresh]);

  useEffect(() => {
    setPaginaActiva(1);
  }, [statusFilter, search]);

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
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 lg:p-8 space-y-6 transition-colors duration-300">
        
        <Encabezado 
          titulo="Clientes" 
          onActualizar={() => setRefresh((prev) => prev + 1)} 
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-8">
          <Tarjetas
            label="Total de clientes"
            value={stats.total}
            sub="Todos los clientes"
            icon="bi bi-people"
            onClick={() => { setStatusFilter(""); setPaginaActiva(1); }}
            isActive={statusFilter === ""}
          />
          <Tarjetas
            label="Clientes activos"
            value={stats.activos}
            sub={stats.total ? `${Math.round((stats.activos / stats.total) * 100)}% del total` : "0%"}
            accent="#22C55E"
            icon="bi bi-check-circle"
            onClick={() => { setStatusFilter(statusFilter === "Activo" ? "" : "Activo"); setPaginaActiva(1); }}
            isActive={statusFilter === "Activo"}
          />
          <Tarjetas
            label="Clientes inactivos"
            value={stats.inactivos}
            sub={stats.total ? `${Math.round((stats.inactivos / stats.total) * 100)}% del total` : "0%"}
            accent="#EF4444"
            icon="bi bi-x-circle"
            onClick={() => { setStatusFilter(statusFilter === "Inactivo" ? "" : "Inactivo"); setPaginaActiva(1); }}
            isActive={statusFilter === "Inactivo"}
          />
        </div>

        <ToolBar
          filtro={statusFilter}
          setFiltro={setStatusFilter}
          opcionesFiltro={opcionesFiltroClientes}
          busqueda={search}
          setBusqueda={setSearch}
          placeholderBuscar="Buscar por nombre, RFC, email o teléfono..."
          textoBoton="+ Cliente"
          accionBoton={handleNuevoCliente}
        />

        <Tabla encabezados={encabezadosClientes}>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-sm opacity-50 text-morado dark:text-lila">
                Cargando clientes...
              </td>
            </tr>
          ) : clientesFiltrados.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-sm opacity-50 text-morado dark:text-lila">
                No hay resultados
              </td>
            </tr>
          ) : (
            clientesFiltrados.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b transition-colors border-morado/5 dark:border-lila/5 hover:bg-lila/30 dark:hover:bg-oscuro/40"
              >
                <td className="p-4 text-center text-sm whitespace-nowrap font-medium text-oscuro dark:text-blanco">{usuario.nombre}</td>
                <td className="p-4 text-center text-sm whitespace-nowrap text-oscuro dark:text-blanco">{usuario.rfc}</td>
                <td className="p-4 text-center text-sm whitespace-nowrap text-gris dark:text-text-muted">{usuario.email}</td>
                <td className="p-4 text-center text-sm whitespace-nowrap text-oscuro dark:text-blanco">{usuario.telefono}</td>
                <td className="p-4 text-center whitespace-nowrap">
                  <Etiquetas contenido={usuario.estado} />
                </td>
                <td className="p-4 align-middle whitespace-nowrap">
                  <AccionesTabla
                    onVer={() => handleVerCliente(usuario)}
                    onEditar={() => handleEditarCliente(usuario)}
                    onEliminar={() => setClienteEliminando(usuario)}
                  />
                </td>
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
            { header: "RFC",      key: "rfc",      width: 18 },
            { header: "Email",    key: "email",    width: 28 },
            { header: "Teléfono", key: "telefono", width: 16 },
            { header: "Estado",   key: "estado",   width: 12 },
          ]}
          exportFilas={rows.map((c) => ({
            nombre:   c.nombre,
            rfc:      c.rfc,
            email:    c.email,
            telefono: c.telefono,
            estado:   c.estado,
          }))}
        />

      </div>

      {clienteSeleccionado && (
        <ModalClientes
          cliente={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
          onEditar={handleEditarCliente}
          onEliminar={setClienteEliminando}
        />
      )}

      {clienteForm.abierto && (
        <FormClientes
          cliente={clienteForm.data}
          esNuevo={clienteForm.esNuevo}
          onClose={() => setClienteForm({ abierto: false, esNuevo: false, data: null })}
          onGuardar={guardarCliente}
        />
      )}

      {clienteEliminando && (
        <ModalConfirmacion
          tipo="eliminar"
          titulo="¿Eliminar cliente?"
          mensaje={`${clienteEliminando.nombre || "Cliente"} será eliminado permanentemente.`}
          textoConfirmar="Eliminar"
          onConfirmar={confirmEliminarCliente}
          onCancelar={() => setClienteEliminando(null)}
        />
      )}

      {modalExito && (
        <ModalConfirmacion
          tipo="exito"
          titulo={modalExito}
          onCancelar={() => setModalExito("")}
        />
      )}
    </div>
  );
}