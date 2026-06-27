import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";
import { canPerformAction } from "../utils/permissionMapper";

import Toast from "../components/Toast";
import Tarjetas from "../components/Tarjetas";
import ToolBar from "../components/ToolBar";
import AccionesTabla from "../components/AccionesTabla";
import Paginacion from "../components/Paginacion";
import Tabla from "../components/Tabla";
import ModalConfirmacion from "../components/ModalConfirmacion";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";

import ModalRoles from "../components/ModalRoles";
import FormRoles from "../components/FormRoles";
import FormPermisoNuevo from "../components/FormPermisoNuevo";
import ModalPermisos from "../components/ModalPermisos";

const LIMIT = 10;

export default function Roles() {
  useTitulo("Roles");
  const { usuario: usuarioLogeado } = useContext(AuthContext);

  const esAdmin = usuarioLogeado?.roleId === "role_admin" || 
                  usuarioLogeado?.roleId === "ADMIN" ||
                  canPerformAction(usuarioLogeado?.permissions, 'roles', 'read');

  const [busqueda, setBusqueda] = useState("");
  const [rolesDB, setRolesDB] = useState([]);
  const [permisosDB, setPermisosDB] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("exito");
  const [paginaActiva, setPaginaActiva] = useState(1);

  const [isModalVerAbierto, setIsModalVerAbierto] = useState(false);
  const [isModalFormAbierto, setIsModalFormAbierto] = useState(false);
  const [isModalPermisosAbierto, setIsModalPermisosAbierto] = useState(false);
  const [isModalNuevoPermisoAbierto, setIsModalNuevoPermisoAbierto] = useState(false);
  
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [rolAEditar, setRolAEditar] = useState(null);

  const [modalConf, setModalConf] = useState({
    isOpen: false, tipo: "eliminar", titulo: "", mensaje: "", textoConfirmar: "Eliminar", onConfirmar: () => {}
  });

  const encabezadosRoles = [
    { label: "Nombre", key: "nombre" },
    { label: "Descripción", key: "descripcion" },
    { label: "Permisos", key: "permisos" },
    { label: "Creado", key: "createdAt" },
    { label: "Acciones", key: "acciones" }
  ];

  const fetchRolesYPermisos = async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError("");
      const [rolesRes, permisosRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions')
      ]);
      setRolesDB(rolesRes.items || rolesRes.data?.items || (Array.isArray(rolesRes) ? rolesRes : []));
      setPermisosDB(permisosRes.items || permisosRes.data?.items || (Array.isArray(permisosRes) ? permisosRes : []));
    } catch (err) {
      setError(err.message || "Error al cargar roles y permisos");
      mostrarToast("Error al cargar datos", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!esAdmin) {
      setError("No tienes permisos para acceder a esta página. Solo administradores pueden gestionar roles.");
      return;
    }
    fetchRolesYPermisos();
  }, [esAdmin]);

  useEffect(() => { setPaginaActiva(1); }, [busqueda]);

  const datosFiltrados = rolesDB.filter((row) =>
    busqueda === "" ||
    (row.nombre && row.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (row.descripcion && row.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalPermisos = permisosDB.length;
  const promPermisosPorRol = rolesDB.length > 0
    ? Math.round(rolesDB.reduce((sum, rol) => sum + (rol.permissions?.length || 0), 0) / rolesDB.length)
    : 0;

  const start = (paginaActiva - 1) * LIMIT;
  const datosPaginados = datosFiltrados.slice(start, start + LIMIT);
  const textoRango = datosFiltrados.length === 0 ? "0" : `${start + 1} – ${Math.min(paginaActiva * LIMIT, datosFiltrados.length)}`;

  const mostrarToast = (mensaje, tipo = "exito") => { setToastMessage(mensaje); setToastType(tipo); };

  const handleVerDetalles = (rol) => { setRolSeleccionado(rol); setIsModalVerAbierto(true); };
  const handleAbrirFormCrear = () => { setRolAEditar(null); setIsModalFormAbierto(true); };
  const handleAbrirFormEditar = (rol) => { setRolAEditar(rol); setIsModalFormAbierto(true); setIsModalVerAbierto(false); };
  const handleAbrirPermisos = (rol) => { setRolSeleccionado(rol); setIsModalPermisosAbierto(true); setIsModalVerAbierto(false); };

  const handleAbrirConfirmacionBorrar = (rol) => {
    setIsModalVerAbierto(false);
    setModalConf({
      isOpen: true,
      tipo: "eliminar",
      titulo: "Eliminar Rol",
      mensaje: `¿Estás seguro de que deseas eliminar el rol "${rol.nombre}"?`,
      textoConfirmar: "Eliminar",
      onConfirmar: () => handleEliminarRol(rol.id)
    });
  };

  const handleGuardarRol = async (formData) => {
    try {
      setGuardando(true);
      const esEdicion = !!rolAEditar;
      if (esEdicion) await api.patch(`/roles/${rolAEditar.id}`, formData);
      else await api.post('/roles', formData);

      setIsModalFormAbierto(false);
      setRolAEditar(null);
      await fetchRolesYPermisos(true);

      setTimeout(() => {
        setModalConf({
          isOpen: true, tipo: "exito",
          titulo: esEdicion ? "Rol actualizado correctamente" : "Rol creado correctamente",
          mensaje: "", textoConfirmar: "", textoCancelar: "Cerrar", onConfirmar: null
        });
        setTimeout(() => setModalConf(prev => ({ ...prev, isOpen: false })), 1800);
      }, 100);

    } catch (err) {
      mostrarToast(err.message || "Error al guardar rol", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarRol = async (rolId) => {
    try {
      setGuardando(true);
      await api.delete(`/roles/${rolId}`);
      mostrarToast("Rol eliminado correctamente", "exito");
      setModalConf({ ...modalConf, isOpen: false });
      await fetchRolesYPermisos(true);
    } catch (err) {
      mostrarToast(err.message || "Error al eliminar rol", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleActualizarPermisos = async (permisosSeleccionados) => {
    try {
      setGuardando(true);
      await api.patch(`/roles/${rolSeleccionado.id}`, { permissions: permisosSeleccionados });
      setIsModalPermisosAbierto(false);
      await fetchRolesYPermisos(true);
      
      setTimeout(() => {
        setModalConf({
          isOpen: true, tipo: "exito",
          titulo: "Permisos actualizados correctamente",
          mensaje: "", textoConfirmar: "", textoCancelar: "Cerrar", onConfirmar: null
        });
        setTimeout(() => setModalConf(prev => ({ ...prev, isOpen: false })), 1800);
      }, 100);
      
    } catch (err) {
      mostrarToast(err.message || "Error al actualizar permisos", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearPermiso = async (formData) => {
    try {
      setGuardando(true);
      await api.post('/permissions', formData);
      setIsModalNuevoPermisoAbierto(false);
      await fetchRolesYPermisos(true);
      
      setTimeout(() => {
        setModalConf({
          isOpen: true, tipo: "exito",
          titulo: "Permiso creado correctamente",
          mensaje: "", textoConfirmar: "", textoCancelar: "Cerrar", onConfirmar: null
        });
        setTimeout(() => setModalConf(prev => ({ ...prev, isOpen: false })), 1800);
      }, 100);

    } catch (err) {
      mostrarToast(err.message || "Error al crear permiso", "error");
    } finally {
      setGuardando(false);
    }
  };

  const renderRow = (row, i) => (
    <tr key={i} className="border-b hover:bg-lila/30 dark:hover:bg-oscuro/40 transition-colors">
      <td className="p-4 text-left text-sm font-medium">{row.nombre || "-"}</td>
      <td className="p-4 text-left text-sm truncate max-w-xs">{row.descripcion || "-"}</td>
      <td className="p-4 text-center">
        <span className="px-3 py-1 bg-lila/20 text-morado dark:text-lila-soft rounded-full text-sm font-bold border border-lila/40">
          {row.permissions?.length || 0}
        </span>
      </td>
      <td className="p-4 text-center text-sm">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
      </td>
      <td className="p-4 align-middle whitespace-nowrap">
        <AccionesTabla
          onVer={() => handleVerDetalles(row)}
          onPermisos={() => handleAbrirPermisos(row)}
          onEditar={() => handleAbrirFormEditar(row)}
          onEliminar={() => handleAbrirConfirmacionBorrar(row)}
        />
      </td>
    </tr>
  );

  if (error && !cargando) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-rojo/20 border border-rojo text-rojo p-4 rounded-lg text-center">
          <i className="bi bi-exclamation-triangle mr-2"></i>{error}
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 text-blanco uppercase tracking-wide">Gestión de Roles</h1>
        <div className="flex justify-center items-center py-20"><i className="bi bi-hourglass-split text-4xl text-lila animate-spin"></i></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 relative">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <Encabezado titulo="Gestión de Roles" onActualizar={fetchRolesYPermisos} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-8">
        <Tarjetas label="Total de Roles" value={rolesDB.length} sub="Roles en el sistema" icon="bi bi-shield-check" />
        <Tarjetas label="Total de Permisos" value={totalPermisos} sub="Permisos disponibles" accent="#A3E378" icon="bi bi-key" />
        <Tarjetas label="Promedio de Permisos" value={promPermisosPorRol} sub="Por rol" accent="#FFB347" icon="bi bi-graph-up" />
      </div>

      <div className="mb-5 w-full">
        <ToolBar
          busqueda={busqueda} 
          setBusqueda={setBusqueda} 
          placeholderBuscar="Buscar por nombre o descripción..."
          textoBoton="+ Rol" 
          accionBoton={handleAbrirFormCrear}
          textoBoton2="+ Permiso" 
          accionBoton2={() => setIsModalNuevoPermisoAbierto(true)}
        />
      </div>

      <Tabla encabezados={encabezadosRoles} datos={datosPaginados} renderRow={renderRow} sortableFields={["nombre", "descripcion"]} />

      <Paginacion
        paginaActual={paginaActiva} totalRegistros={datosFiltrados.length} rangoSiguiente={textoRango} limit={LIMIT}
        onCambiarPagina={(p) => setPaginaActiva(p === "‹" ? Math.max(1, paginaActiva - 1) : p === "›" ? Math.min(Math.ceil(datosFiltrados.length / LIMIT), paginaActiva + 1) : Number(p))}
        exportTitulo="Gestión de Roles"
        exportColumnas={["nombre", "descripcion", "permisos", "createdAt"]}
      />

      {/* Modales */}
      {isModalVerAbierto && (
        <ModalRoles 
          rol={rolSeleccionado}
          onClose={() => setIsModalVerAbierto(false)}
          onEditar={(r) => handleAbrirFormEditar(r)}
          onEliminar={(r) => handleAbrirConfirmacionBorrar(r)}
          onGestionarPermisos={(r) => handleAbrirPermisos(r)}
        />
      )}

      {isModalFormAbierto && (
        <>
          {guardando && (
            <div className="fixed inset-0 bg-oscuro/50 backdrop-blur-sm z-110 flex flex-col items-center justify-center">
              <i className="bi bi-arrow-repeat animate-spin text-4xl text-lila mb-2"></i>
              <p className="text-blanco font-bold">Guardando rol...</p>
            </div>
          )}
          <FormRoles 
            rolData={rolAEditar}
            onGuardar={handleGuardarRol}
            onClose={() => setIsModalFormAbierto(false)}
          />
        </>
      )}

      {isModalNuevoPermisoAbierto && (
        <>
          {guardando && (
            <div className="fixed inset-0 bg-oscuro/50 backdrop-blur-sm z-110 flex flex-col items-center justify-center">
              <i className="bi bi-arrow-repeat animate-spin text-4xl text-lila mb-2"></i>
              <p className="text-blanco font-bold">Guardando permiso...</p>
            </div>
          )}
          <FormPermisoNuevo 
            onGuardar={handleCrearPermiso}
            onClose={() => setIsModalNuevoPermisoAbierto(false)}
          />
        </>
      )}

      {isModalPermisosAbierto && (
        <>
          {guardando && (
            <div className="fixed inset-0 bg-oscuro/50 backdrop-blur-sm z-110 flex flex-col items-center justify-center">
              <i className="bi bi-arrow-repeat animate-spin text-4xl text-lila mb-2"></i>
              <p className="text-blanco font-bold">Actualizando permisos...</p>
            </div>
          )}
          <ModalPermisos
            isOpen={true}
            onClose={() => { setIsModalPermisosAbierto(false); setRolSeleccionado(null); }}
            rol={rolSeleccionado}
            permisos={permisosDB} 
            onActualizar={handleActualizarPermisos}
          />
        </>
      )}

      {modalConf.isOpen && (
        <ModalConfirmacion
          isOpen={true}
          tipo={modalConf.tipo}
          titulo={modalConf.titulo}
          mensaje={modalConf.mensaje}
          textoConfirmar={modalConf.textoConfirmar}
          textoCancelar={modalConf.textoCancelar || "Cancelar"}
          onConfirmar={modalConf.onConfirmar}
          onCancelar={() => setModalConf({ ...modalConf, isOpen: false })}
        />
      )}
    </div>
  );
}