import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";
import { canPerformAction } from "../utils/permissionMapper";

import Toast from "../components/Toast";
import Tarjetas from "../components/Tarjetas";
import Etiquetas from "../components/Etiquetas";
import ToolBar from "../components/ToolBar";
import AccionesTabla from "../components/AccionesTabla";
import Paginacion from "../components/Paginacion";
import Tabla from "../components/Tabla";
import ModalConfirmacion from "../components/ModalConfirmacion";
import AvatarUser from "../components/AvatarUser";
import useTitulo from "../hooks/useTitulo";
import Encabezado from "../components/Encabezado";

import ModalUsuarios from "../components/ModalUsuarios";
import FormUsuarios from "../components/FormUsuarios";

const LIMIT = 10;

export default function Usuarios() {
  useTitulo("Personal");
  const { usuario: usuarioLogeado } = useContext(AuthContext);
  
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  
  const [usuariosDB, setUsuariosDB] = useState([]);
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
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);

  const [modalConf, setModalConf] = useState({
    isOpen: false, tipo: "eliminar", titulo: "", mensaje: "", textoConfirmar: "Eliminar", onConfirmar: () => {}
  });

  const opcionesFiltroUsuarios = [
    { value: "", label: "Todos" },
    { value: true, label: "Activos" },
    { value: false, label: "Inactivos" }
  ];

  const encabezadosUsuarios = [
    { label: "", key: "avatar" },
    { label: "Usuario", key: "usuario" },
    { label: "Nombre", key: "nombre" },
    { label: "Email", key: "email" },
    { label: "Rol", key: "rol" },
    { label: "Estado", key: "estado" },
    { label: "Acciones", key: "acciones" }
  ];

  const fetchUsuarios = async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError("");
      const result = await api.get('/users');
      const datosReales = result.items || result.data?.items || (Array.isArray(result) ? result : []);
      setUsuariosDB(datosReales);
    } catch (err) {
      setError(err.message || "Error al cargar los usuarios");
      mostrarToast("Error al cargar usuarios", "error");
    } finally {
      setCargando(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const result = await api.get('/roles');
      const datosReales = result.items || result.data?.items || result.data || (Array.isArray(result) ? result : []);
      setRolesDB(datosReales);
    } catch (err) {
      console.error("Error al cargar roles:", err);
    }
  };

  const fetchPermisos = async () => {
    try {
      const result = await api.get('/permissions?limit=100');
      const datosReales = result.items || result.data?.items || result.data || (Array.isArray(result) ? result : []);
      setPermisosDB(datosReales);
    } catch (err) {
      console.error("Error al cargar permisos:", err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
    fetchPermisos();
  }, []);

  useEffect(() => { setPaginaActiva(1); }, [filtro, busqueda]);

  useEffect(() => {
    if (isModalFormAbierto) {
      fetchRoles();
      fetchPermisos();
    }
  }, [isModalFormAbierto]);

  const datosFiltrados = usuariosDB
    .filter((row) => {
      if (row.roleId === 'CLIENTE' || row.role === 'CLIENTE') return false;
      if (filtro === "") return true;
      return row.activo === filtro;
    })
    .filter((row) => 
      busqueda === "" || 
      (row.nombre && row.nombre.toLowerCase().includes(busqueda.toLowerCase())) || 
      (row.usuario && row.usuario.toLowerCase().includes(busqueda.toLowerCase())) ||
      (row.email && row.email.toLowerCase().includes(busqueda.toLowerCase()))
    );

  const usuariosSinClientes = usuariosDB.filter(u => u.roleId !== 'CLIENTE' && u.role !== 'CLIENTE');
  const activos = usuariosSinClientes.filter((u) => u.activo !== false).length;
  const inactivos = usuariosSinClientes.filter((u) => u.activo === false).length;

  const start = (paginaActiva - 1) * LIMIT;
  const datosPaginados = datosFiltrados.slice(start, start + LIMIT);
  const textoRango = datosFiltrados.length === 0 ? "0" : `${start + 1} – ${Math.min(paginaActiva * LIMIT, datosFiltrados.length)}`;

  const mostrarToast = (mensaje, tipo = "exito") => {
    setToastMessage(mensaje);
    setToastType(tipo);
  };

  const puedeAgregar = canPerformAction(usuarioLogeado?.permissions, 'users', 'create');
  const puedeEditar = canPerformAction(usuarioLogeado?.permissions, 'users', 'update');
  const puedeBorrar = canPerformAction(usuarioLogeado?.permissions, 'users', 'delete');
  const handleVerDetalles = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setIsModalVerAbierto(true);
  };

  const handleAbrirFormCrear = () => {
    setUsuarioAEditar(null);
    setIsModalFormAbierto(true);
  };

  const handleAbrirFormEditar = (usuario) => {
    if (!puedeEditar) {
      mostrarToast("No tienes permisos para editar usuarios", "error");
      return;
    }
    setUsuarioAEditar(usuario);
    setIsModalFormAbierto(true);
  };

  const handleAbrirConfirmacionBorrar = (usuario) => {
    if (!puedeBorrar) {
      mostrarToast("No tienes permisos para eliminar usuarios", "error");
      return;
    }
    if (usuario.id === usuarioLogeado?.id) {
      mostrarToast("No puedes eliminar tu propio usuario", "error");
      return;
    }
    
    setModalConf({
      isOpen: true,
      tipo: "eliminar",
      titulo: "Eliminar Usuario",
      mensaje: `¿Estás seguro de que deseas eliminar a ${usuario.nombre} ${usuario.apellido}?`,
      textoConfirmar: "Eliminar",
      onConfirmar: () => handleEliminarUsuario(usuario.id)
    });
  };

  const handleGuardarUsuario = async (formData) => {
    try {
      setGuardando(true);
      const esEdicion = !!usuarioAEditar;
      
      if (esEdicion) {
        await api.patch(`/users/${usuarioAEditar.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      
      setIsModalFormAbierto(false);
      setUsuarioAEditar(null);
      await fetchUsuarios(true);

      setTimeout(() => {
        setModalConf({
          isOpen: true,
          tipo: "exito",
          titulo: esEdicion ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
          mensaje: "",
          textoConfirmar: "", 
          textoCancelar: "Cerrar",
          onConfirmar: null
        });
        
        setTimeout(() => setModalConf(prev => ({ ...prev, isOpen: false })), 1800);
      }, 100);

    } catch (err) {
      mostrarToast(err.message || "Error al guardar usuario", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarUsuario = async (usuarioId) => {
    try {
      setGuardando(true);
      await api.delete(`/users/${usuarioId}`);
      mostrarToast("Usuario eliminado correctamente", "exito");
      setModalConf({ ...modalConf, isOpen: false });
      setIsModalVerAbierto(false); 
      await fetchUsuarios(true);
    } catch (err) {
      mostrarToast(err.message || "Error al eliminar usuario", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPagina = (page) => {
    const totalPaginas = Math.ceil(datosFiltrados.length / LIMIT);
    if (page === "‹") setPaginaActiva((prev) => Math.max(1, prev - 1));
    else if (page === "›") setPaginaActiva((prev) => Math.min(totalPaginas, prev + 1));
    else setPaginaActiva(Number(page));
  };

  const renderRow = (row, i) => (
    <tr
      key={i}
      onClick={() => handleVerDetalles(row)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleVerDetalles(row);
      }}
      tabIndex={0}
      role="button"
      className="border-b border-[var(--border-gold-20)] hover:bg-[var(--gold-08)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
    >
      <td className="p-4 text-center"><AvatarUser nombre={row.nombre} apellido={row.apellido} rol={row.role || row.roleId} /></td>
      <td className="p-4 text-center text-sm font-medium text-[var(--noir)] dark:text-[var(--snow)]">{row.usuario || "-"}</td>
      <td className="p-4 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{row.nombre} {row.apellido || ""}</td>
      <td className="p-4 text-center text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{row.email || "-"}</td>
      <td className="p-4 text-center"><Etiquetas contenido={row.role || row.roleId || "Sin rol"} /></td>
      <td className="p-4 text-center"><Etiquetas contenido={row.activo !== false ? "Activo" : "Inactivo"} /></td>
      <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
        <AccionesTabla 
          onVer={() => handleVerDetalles(row)}
          onEditar={puedeEditar ? () => handleAbrirFormEditar(row) : null}
          onEliminar={puedeBorrar && row.id !== usuarioLogeado?.id ? () => handleAbrirConfirmacionBorrar(row) : null}
        />
      </td>
    </tr>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--snow)] dark:bg-[var(--noir-soft)]">
      <div className="relative flex-1 space-y-6 p-6 lg:p-8 transition-colors duration-300">
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />
      <Encabezado titulo="Personal" onActualizar={() => fetchUsuarios()} />

      {error && !cargando && (
        <div className="rounded-[2px] border border-rojo/40 bg-rojo/10 px-4 py-3 font-body text-sm text-rojo" role="alert">
          {error}
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Tarjetas label="Total del personal" value={usuariosSinClientes.length} sub="Cuentas internas de D'oro" icon="bi bi-people" onClick={() => setFiltro("")} isActive={filtro === ""} />
        <Tarjetas label="Personal activo" value={activos} sub={`${usuariosSinClientes.length ? Math.round(activos / usuariosSinClientes.length * 100) : 0}% del total`} accent="#84B140" icon="bi bi-check-circle" onClick={() => setFiltro(filtro === true ? "" : true)} isActive={filtro === true} />
        <Tarjetas label="Personal inactivo" value={inactivos} sub={`${usuariosSinClientes.length ? Math.round(inactivos / usuariosSinClientes.length * 100) : 0}% del total`} accent="#EF4444" icon="bi bi-x-circle" onClick={() => setFiltro(filtro === false ? "" : false)} isActive={filtro === false} />
      </div>

      <ToolBar 
        filtro={filtro} setFiltro={setFiltro} opcionesFiltro={opcionesFiltroUsuarios}
        busqueda={busqueda} setBusqueda={setBusqueda} placeholderBuscar="Buscar por usuario, nombre o correo..."
        textoBoton={puedeAgregar ? "+ Integrante" : null} accionBoton={puedeAgregar ? handleAbrirFormCrear : null}
      />

      <Tabla encabezados={encabezadosUsuarios} datos={datosPaginados} renderRow={renderRow} sortableFields={["usuario", "nombre", "email", "rol"]} cargando={cargando} entidad="personal" />

      <Paginacion
        paginaActual={paginaActiva} totalRegistros={datosFiltrados.length} rangoSiguiente={textoRango} limit={LIMIT} onCambiarPagina={handleCambiarPagina}
        exportTitulo="Personal de D'oro"
        exportColumnas={[{ header: "Usuario", key: "usuario", width: 15 }, { header: "Nombre", key: "nombre", width: 20 }, { header: "Email", key: "email", width: 25 }, { header: "Rol", key: "rol", width: 15 }, { header: "Estado", key: "estado", width: 12 }]}
        exportFilas={datosFiltrados.map((u) => ({ usuario: u.usuario || "-", nombre: `${u.nombre || ""} ${u.apellido || ""}`.trim(), email: u.email || "-", rol: u.role || u.roleId || "Sin rol", estado: u.activo !== false ? "Activo" : "Inactivo" }))}
      />

      {isModalVerAbierto && (
        <ModalUsuarios 
          data={usuarioSeleccionado}
          usuarioLogeado={usuarioLogeado}
          onClose={() => setIsModalVerAbierto(false)}
          onEditar={(u) => handleAbrirFormEditar(u)}
          onEliminar={(u) => handleAbrirConfirmacionBorrar(u)}
        />
      )}

      {isModalFormAbierto && (
        <>
          {guardando && (
            <div className="fixed inset-0 bg-oscuro/50 backdrop-blur-sm z-110 flex flex-col items-center justify-center">
              <i className="bi bi-arrow-repeat animate-spin text-4xl text-lila mb-2"></i>
              <p className="text-blanco font-bold">Guardando usuario...</p>
            </div>
          )}
          <FormUsuarios 
            data={usuarioAEditar}
            onGuardar={handleGuardarUsuario}
            onClose={() => setIsModalFormAbierto(false)}
            usuarioLogeado={usuarioLogeado}
            esNuevo={!usuarioAEditar}
            rolesDisponibles={rolesDB}
            permisosDisponibles={permisosDB}
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
    </div>
  );
}
