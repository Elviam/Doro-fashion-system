import { useEffect, useState, useCallback } from "react";
import Etiquetas from "../components/Etiquetas";
import Tarjetas from "../components/Tarjetas";
import Tabla from "../components/Tabla";
import ToolBar from "../components/ToolBar";
import AccionesTabla from "../components/AccionesTabla";
import Paginacion from "../components/Paginacion";
import ModalConfirmacion from "../components/ModalConfirmacion";
import Encabezado from "../components/Encabezado";
import FormProveedores from "../components/FormProveedores";
import ModalProveedores from "../components/ModalProveedores";

import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../services/suppliers.service";
import useTitulo from "../hooks/useTitulo";

const LIMIT = 10;
const encabezadosProveedores = ["Nombre", "RFC", "Giro", "Teléfono", "Estado", "Acciones"];
const opcionesFiltroProv = [
  { value: "", label: "Todos" },
  { value: "Activo", label: "Activos" },
  { value: "Inactivo", label: "Inactivos" },
];

export default function Proveedores() {
  useTitulo("Proveedores");

  // ─── Datos y Filtros ────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0 });
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [paginaActiva, setPaginaActiva] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // ─── Modales ──────────────────────────────────────────────────────────
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  // ─── Confirmación Global (Éxito y Eliminar) ───────────────────────────
  const [confirmacion, setConfirmacion] = useState({
    abierto: false, tipo: "confirmar", titulo: "", mensaje: "", textoConfirmar: "", onConfirmar: null,
  });
  const cerrarConfirmacion = () => setConfirmacion((prev) => ({ ...prev, abierto: false, onConfirmar: null }));

  // ─── Lógica de la API ─────────────────────────────────────────────────
  const cargarProveedores = useCallback(async () => {
    setCargando(true);
    setError(null);
    let activoParam;
    if (statusFilter === "Activo") activoParam = true;
    else if (statusFilter === "Inactivo") activoParam = false;

    try {
      const [paginada, todos] = await Promise.all([
        fetchSuppliers({ q: search, activo: activoParam, page: paginaActiva, limit: LIMIT }),
        fetchSuppliers({ limit: 100 }),
      ]);
      setUsuarios(paginada.items);
      setTotalRegistros(paginada.total);
      const activos = todos.items.filter((u) => u.estado === "Activo").length;
      const inactivos = todos.items.filter((u) => u.estado === "Inactivo").length;
      setStats({ total: todos.total, activos, inactivos });
    } catch (err) {
      setError(err.message || "Error al cargar proveedores");
    } finally {
      setCargando(false);
    }
  }, [search, statusFilter, paginaActiva]);

  useEffect(() => { cargarProveedores(); }, [cargarProveedores]);
  useEffect(() => { setPaginaActiva(1); }, [statusFilter, search]);

  const handleCambiarPagina = (page) => {
    if (page === "‹") setPaginaActiva((c) => Math.max(1, c - 1));
    else if (page === "›") {
      const max = Math.max(1, Math.ceil(totalRegistros / LIMIT));
      setPaginaActiva((c) => Math.min(max, c + 1));
    } else setPaginaActiva(Number(page));
  };

  // ─── Acciones de Modales ──────────────────────────────────────────────
  const handleNuevoProveedor = () => {
    setModoEdicion(false);
    setProveedorSeleccionado(null);
    setIsFormModalOpen(true);
  };

  const handleVerProveedor = (usuario) => {
    setProveedorSeleccionado(usuario);
    setIsDetalleModalOpen(true);
  };

  const handleEditarProveedor = (usuario) => {
    setIsDetalleModalOpen(false);
    setModoEdicion(true);
    setProveedorSeleccionado(usuario);
    setIsFormModalOpen(true);
  };

  // ─── Guardar y Eliminar ───────────────────────────────────────────────
  const handleGuardarProveedor = async (datosFormulario) => {
    try {
      if (modoEdicion) await updateSupplier(datosFormulario.id, datosFormulario);
      else await createSupplier(datosFormulario);

      setIsFormModalOpen(false);
      await cargarProveedores();

      setTimeout(() => {
        setConfirmacion({
          abierto: true,
          tipo: "exito",
          titulo: modoEdicion ? "Cambios guardados correctamente" : "Proveedor creado correctamente",
        });
        setTimeout(cerrarConfirmacion, 1800);
      }, 100);
    } catch (err) {
      setError(err.message || "Error al guardar el proveedor");
    }
  };

  const handleEliminarProveedor = (id) => {
    setIsDetalleModalOpen(false)
    setConfirmacion({
      abierto: true,
      tipo: "eliminar",
      titulo: "Eliminar proveedor",
      mensaje: "Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar este proveedor?",
      textoConfirmar: "Eliminar",
      onConfirmar: async () => {
        try {
          await deleteSupplier(id);
          cerrarConfirmacion();
          await cargarProveedores();
        } catch (err) {
          cerrarConfirmacion();
          setError(err.message || "Error al eliminar el proveedor");
        }
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Encabezado titulo="Proveedores" onActualizar={cargarProveedores} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 opacity-60 hover:opacity-100 transition-opacity">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-8">
        <Tarjetas 
          label="Total de proveedores" value={stats.total} sub="Todos los proveedores" icon="bi bi-building" 
          onClick={() => { setStatusFilter(""); setPaginaActiva(1); }} isActive={statusFilter === ""}
        />
        <Tarjetas
          label="Proveedores activos" value={stats.activos} sub={stats.total ? `${Math.round((stats.activos / stats.total) * 100)}% del total` : "0%"}
          accent="#22C55E" icon="bi bi-check-circle" onClick={() => { setStatusFilter(statusFilter === "Activo" ? "" : "Activo"); setPaginaActiva(1); }} isActive={statusFilter === "Activo"}
        />
        <Tarjetas
          label="Proveedores inactivos" value={stats.inactivos} sub={stats.total ? `${Math.round((stats.inactivos / stats.total) * 100)}% del total` : "0%"}
          accent="#EF4444" icon="bi bi-x-circle" onClick={() => { setStatusFilter(statusFilter === "Inactivo" ? "" : "Inactivo"); setPaginaActiva(1); }} isActive={statusFilter === "Inactivo"}
        />
      </div>

      {/* TOOLBAR */}
      <ToolBar
        filtro={statusFilter} setFiltro={setStatusFilter} opcionesFiltro={opcionesFiltroProv}
        busqueda={search} setBusqueda={setSearch} placeholderBuscar="Buscar por nombre, RFC, giro..."
        textoBoton="+ Proveedor" accionBoton={handleNuevoProveedor}
      />

      {/* TABLA */}
      <Tabla encabezados={encabezadosProveedores}>
        {cargando ? (
          <tr><td colSpan={6} className="text-center py-10 text-sm opacity-50 text-lila"><i className="bi bi-arrow-repeat animate-spin mr-2" />Cargando...</td></tr>
        ) : usuarios.length === 0 ? (
          <tr><td colSpan={6} className="text-center py-10 text-sm opacity-50 text-lila">No hay resultados</td></tr>
        ) : (
          usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors">
              <td className="p-4 text-center text-sm whitespace-nowrap font-medium">{usuario.nombre}</td>
              <td className="p-4 text-center text-sm whitespace-nowrap">{usuario.rfc}</td>
              <td className="p-4 text-center text-sm whitespace-nowrap">{usuario.giro}</td>
              <td className="p-4 text-center text-sm whitespace-nowrap">{usuario.telefono}</td>
              <td className="p-4 text-center whitespace-nowrap"><Etiquetas contenido={usuario.estado} /></td>
              <td className="p-4 align-middle whitespace-nowrap">
                <AccionesTabla
                  onVer={() => handleVerProveedor(usuario)}
                  onEditar={() => handleEditarProveedor(usuario)}
                  onEliminar={() => handleEliminarProveedor(usuario.id)}
                />
              </td>
            </tr>
          ))
        )}
      </Tabla>

      {/* PAGINACIÓN */}
      <Paginacion
        paginaActual={paginaActiva} totalRegistros={totalRegistros} limit={LIMIT}
        rangoSiguiente={`${totalRegistros === 0 ? 0 : (paginaActiva - 1) * LIMIT + 1} – ${Math.min(paginaActiva * LIMIT, totalRegistros)}`}
        onCambiarPagina={handleCambiarPagina} exportTitulo="Proveedores"
        exportColumnas={[
          { header: "Nombre", key: "nombre", width: 32 }, { header: "RFC", key: "rfc", width: 18 },
          { header: "Giro", key: "giro", width: 24 }, { header: "Teléfono", key: "telefono", width: 16 }, { header: "Estado", key: "estado", width: 12 },
        ]}
        exportFilas={usuarios.map((p) => ({ nombre: p.nombre, rfc: p.rfc, giro: p.giro, telefono: p.telefono, estado: p.estado }))}
      />

      {/* MODALES */}
      {isDetalleModalOpen && (
        <ModalProveedores 
          proveedor={proveedorSeleccionado}
          onClose={() => setIsDetalleModalOpen(false)}
          onEditar={(p) => handleEditarProveedor(p)}
          onEliminar={(id) => handleEliminarProveedor(id)}
        />
      )}

      {isFormModalOpen && (
        <FormProveedores 
          proveedor={proveedorSeleccionado}
          esNuevo={!modoEdicion}
          onClose={() => setIsFormModalOpen(false)}
          onGuardar={handleGuardarProveedor}
        />
      )}

      {confirmacion.abierto && (
        <ModalConfirmacion
          isOpen={true}
          tipo={confirmacion.tipo}
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          textoConfirmar={confirmacion.textoConfirmar}
          textoCancelar={confirmacion.textoCancelar || "Cancelar"}
          onConfirmar={confirmacion.onConfirmar}
          onCancelar={cerrarConfirmacion}
        />
      )}
    </div>
  );
}