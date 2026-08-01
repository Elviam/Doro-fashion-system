import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";
import {
  MODULE_LABELS,
  getPermissionModule,
  getPermissionPresentation,
  isPermissionVisibleInModal,
  sortPermissionGroups,
  sortPermissions,
} from "../config/permissionPresentation";

const MODULOS_PERMISOS = {
  auth: "Acceso",
  dashboard: "Dashboard",
  users: "Personal",
  clients: "Clientes",
  suppliers: "Proveedores",
  products: "Productos",
  inventory: "Inventario",
  reabastecimiento: "Reabastecimiento",
  pedidos: "Pedidos",
  recepciones: "Recepción de mercancía",
  fulfillment: "Pedidos de clientes",
  ventas: "Ventas",
  audit: "Auditoría",
  permissions: "Configuración",
  roles: "Configuración",
  tienda: "Tienda"
};

export const RECURSOS_PERMISOS = {
  auth: "acceso", dashboard: "dashboard", users: "personal", clients: "clientes",
  suppliers: "proveedores", products: "productos", inventory: "inventario", pedidos: "pedidos",
  recepciones: "pedidos y recepciones", ventas: "ventas", audit: "auditoría",
  fulfillment: "preparación de pedidos",
  permissions: "permisos", roles: "roles", tienda: "tienda"
};

RECURSOS_PERMISOS.recepciones = "recepciones de mercancía";

RECURSOS_PERMISOS.reabastecimiento = "reabastecimiento";

const ACCIONES_PERMISOS = {
  read: "Ver", create: "Crear", update: "Editar", delete: "Eliminar",
  confirm: "Confirmar", enviar: "Marcar como enviado", cancel: "Cancelar",
  seed: "Configurar", me: "Ver"
};

export function getPermissionLabel(code) {
  const presentation = getPermissionPresentation(code);
  if (presentation) return presentation.label;
  const [resource, action] = code.split(":");
  return `${ACCIONES_PERMISOS[action] || action} ${RECURSOS_PERMISOS[resource] || resource}`;
}

export default function FormUsuarios({ data, onGuardar, onClose, usuarioLogeado, esNuevo = false, rolesDisponibles: rolesDispProp = [], permisosDisponibles = [], isOpen = true }) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    usuario: "",
    password: "",
    roleId: "",
    activo: true,
    revokedPermissions: [],
    grantedPermissions: []
  });

  const [errores, setErrores] = useState({});
  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [permisoPendiente, setPermisoPendiente] = useState(null);
  const [mostrarAjustesPermisos, setMostrarAjustesPermisos] = useState(false);

  const getRolesDisponibles = () => {
    return rolesDispProp
      .filter((rol) => ['ADMIN', 'BODEGUERO'].includes(rol.codigo || rol.id))
      .filter((rol) => usuarioLogeado?.isPrimaryAdmin || rol.codigo !== 'ADMIN')
      .map((rol) => ({
        id: rol.id,
        codigo: rol.codigo,
        nombre: rol.nombre,
        permissions: rol.permissions || []
      }));
  };

  const rolesOpciones = getRolesDisponibles();

  useEffect(() => {
    const inicial = {
      nombre: data?.nombre || "",
      apellido: data?.apellido || "",
      email: data?.email || "",
      usuario: data?.usuario || "",
      password: "", // Siempre vacío al iniciar
      roleId: data?.roleId || rolesOpciones.find((rol) => rol.codigo === "BODEGUERO")?.id || "",
      activo: data ? data.activo !== false : true,
      revokedPermissions: data?.revokedPermissions || [],
      grantedPermissions: data?.grantedPermissions || []
    };
    
    setFormData(inicial);
    setEstadoOriginal(JSON.stringify(inicial));
    setErrores({});
  }, [data]);

  useEffect(() => {
    if (!data && !formData.roleId && rolesOpciones.length > 0) {
      const roleBodeguero = rolesOpciones.find((rol) => rol.codigo === "BODEGUERO");
      if (roleBodeguero) {
        setFormData((prev) => ({ ...prev, roleId: roleBodeguero.id }));
      }
    }
  }, [data, rolesDispProp]);

  const handleIntentarCerrar = () => {
    const estadoActual = JSON.stringify(formData);
    
    if (estadoActual !== estadoOriginal) {
      setConfirmarDescartar(true);
    } else {
      if (typeof onClose === 'function') onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === "Escape" && isOpen && !confirmarDescartar) {
        handleIntentarCerrar();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmarDescartar, formData, estadoOriginal, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "roleId" ? { revokedPermissions: [], grantedPermissions: [] } : {})
    }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!formData.nombre.trim()) nuevosErrores.nombre = "El nombre es requerido";
    if (!formData.apellido.trim()) nuevosErrores.apellido = "El apellido es requerido";
    if (!formData.email.trim()) nuevosErrores.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nuevosErrores.email = "Email inválido";
    
    if (!formData.usuario.trim()) nuevosErrores.usuario = "El usuario es requerido";
    if (esNuevo && !formData.password.trim()) nuevosErrores.password = "La contraseña es requerida";
    if (formData.password && formData.password.length < 6) nuevosErrores.password = "Mínimo 6 caracteres";
    if (!formData.roleId) nuevosErrores.roleId = "Selecciona un rol";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardarClick = (e) => {
    e.preventDefault();
    if (validar()) {
      const datosAEnviar = { ...formData };
      
      if (!esNuevo && !datosAEnviar.password) {
        delete datosAEnviar.password;
      }
      const esPropiaCuenta = data?.id === usuarioLogeado?.id;
      const esAdministrador = (data?.role || rolSeleccionado?.codigo) === 'ADMIN';
      if (esPropiaCuenta) {
        delete datosAEnviar.roleId;
        delete datosAEnviar.activo;
        delete datosAEnviar.revokedPermissions;
        delete datosAEnviar.grantedPermissions;
      }
      if (esAdministrador) {
        delete datosAEnviar.revokedPermissions;
        delete datosAEnviar.grantedPermissions;
      }
      
      onGuardar(datosAEnviar);
    }
  };

  const puedeEditar = usuarioLogeado?.role === "ADMIN";
  const rolSeleccionado = rolesOpciones.find((rol) => rol.id === formData.roleId);
  const esPropiaCuenta = data?.id === usuarioLogeado?.id;
  const esCuentaAdmin = (data?.role || rolSeleccionado?.codigo) === "ADMIN";
  const puedeAdministrarCuentaAdmin = usuarioLogeado?.isPrimaryAdmin === true;
  const permisosConfigurables = (permisosDisponibles.length > 0
    ? permisosDisponibles
    : (rolSeleccionado?.permissions || []).map((code) => ({ code })))
    .filter(({ code }) => isPermissionVisibleInModal(code));
  const permisosAgrupados = permisosConfigurables.reduce((grupos, permiso) => {
    const modulo = getPermissionModule(permiso.code);
    grupos[modulo] = [...(grupos[modulo] || []), permiso];
    return grupos;
  }, {});
  const permisosActivos = [
    ...(rolSeleccionado?.permissions || []).filter((code) => !formData.revokedPermissions.includes(code)),
    ...formData.grantedPermissions
  ].filter((code, index, permisos) => permisos.indexOf(code) === index);
  const puedeModificarPermisos = usuarioLogeado?.role === "ADMIN" && !esCuentaAdmin && !esPropiaCuenta;

  const togglePermiso = (code) => {
    if (!puedeModificarPermisos) return;
    const esPermisoDelRol = rolSeleccionado?.permissions.includes(code);
    const estaAsignado = esPermisoDelRol
      ? !formData.revokedPermissions.includes(code)
      : formData.grantedPermissions.includes(code);

    if (!esPermisoDelRol && !estaAsignado) {
      setPermisoPendiente(code);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      ...(esPermisoDelRol
        ? {
            revokedPermissions: prev.revokedPermissions.includes(code)
              ? prev.revokedPermissions.filter((permission) => permission !== code)
              : [...prev.revokedPermissions, code]
          }
        : { grantedPermissions: prev.grantedPermissions.filter((permission) => permission !== code) })
    }));
  };

  const confirmarPermisoAdicional = () => {
    if (!permisoPendiente) return;
    setFormData((prev) => ({ ...prev, grantedPermissions: [...prev.grantedPermissions, permisoPendiente] }));
    setPermisoPendiente(null);
  };
  
  if ((!puedeEditar && !esNuevo) || (esCuentaAdmin && !esPropiaCuenta && !puedeAdministrarCuentaAdmin)) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} ancho="max-w-md" titulo={<span className="text-xl font-display font-bold text-[var(--noir)] dark:text-[var(--snow)] block m-0">Acceso Denegado</span>}>
        <div className="p-6 text-center text-[var(--noir-soft)] dark:text-[var(--ash)]">
          <i className="bi bi-shield-lock text-4xl mb-3 block text-rojo"></i>
          <p>No tienes permisos suficientes para editar perfiles de usuario.</p>
          <Boton className="mt-6 w-full flex justify-center" onClick={onClose}>Entendido</Boton>
        </div>
      </Modal>
    );
  }

  const tituloPersonalizado = (
    <span className="text-base sm:text-lg lg:text-xl font-display font-bold uppercase tracking-wide sm:tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0 block pr-2">
      {esNuevo ? "Agregar integrante" : "Editar integrante"}
    </span>
  );

  const footerAcciones = (
    <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 w-full">
      <Boton
        variante="secundario"
        onClick={handleIntentarCerrar}
        tipo="button"
        className="border-[var(--border-gold-40)] bg-transparent text-[var(--gold-dark)] hover:bg-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] dark:bg-transparent dark:text-[var(--ash)] dark:hover:bg-[var(--gold-15)] dark:hover:text-[var(--ash)]"
      >
        <i className="bi bi-x-lg" /> Cancelar
      </Boton>
      <Boton
        variante="claro"
        onClick={handleGuardarClick}
        tipo="button"
      >
        <i className="bi bi-save" />
        <span className="whitespace-nowrap">{esNuevo ? "Crear usuario" : "Guardar cambios"}</span>
      </Boton>
    </div>
  );

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleIntentarCerrar} 
        ancho="max-w-2xl"
        titulo={tituloPersonalizado}
        footer={footerAcciones}
      >
        <div className="font-body pt-1 pb-2 sm:pt-2 sm:pb-4">
          
          {Object.keys(errores).length > 0 && (
            <div className="mb-4 sm:mb-6 px-3 py-2.5 sm:px-4 sm:py-3 rounded-[2px] text-xs sm:text-sm lg:text-base font-semibold border bg-rojo/10 text-red-700 dark:text-rojo border-rojo/20 flex items-center">
              <i className="bi bi-exclamation-triangle-fill mr-2"></i>
              Por favor, corrige los errores antes de continuar.
            </div>
          )}

          <form className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
            
            {/* Sección: Datos Personales */}
            <div className={`
              p-4 sm:p-5 rounded-[2px] border transition-colors shadow-sm
              bg-[var(--snow)] border-[var(--border-gold-40)]
              dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
            `}>
              <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                <i className="bi bi-person-vcard"></i> Datos Personales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre(s)" name="nombre" value={formData.nombre} onChange={handleChange} requerido />
                <Input label="Apellidos" name="apellido" value={formData.apellido} onChange={handleChange} requerido />
                <div className="sm:col-span-2">
                  <Input label="Correo Electrónico" tipo="email" name="email" value={formData.email} onChange={handleChange} placeholder="correo@empresa.com" requerido />
                </div>
              </div>
            </div>

            {/* Sección: Credenciales */}
            <div className={`
              p-4 sm:p-5 rounded-[2px] border transition-colors shadow-sm
              bg-[var(--snow)] border-[var(--border-gold-40)]
              dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
            `}>
              <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                <i className="bi bi-key"></i> Credenciales de Acceso
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Nombre de Usuario (Login)" 
                  name="usuario" 
                  value={formData.usuario} 
                  onChange={handleChange} 
                  deshabilitado={!esNuevo} 
                  placeholder={!esNuevo ? "No se puede cambiar" : "m.lopez"} 
                  requerido 
                />
                <div className="flex flex-col gap-1.5">
                  <label className="pl-1 text-[11px] font-tag uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                    {esNuevo ? "Contraseña temporal" : "Nueva contraseña"} {esNuevo && <span className="text-rojo">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={esNuevo ? "Mínimo 6 caracteres" : "Opcional (dejar en blanco para no cambiar)"}
                      className="w-full rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-4 py-2.5 pr-11 text-sm text-[var(--noir)] transition-all focus:border-[var(--gold-dark)] focus:outline-none dark:border-[var(--border-gold-20)] dark:bg-[var(--noir)] dark:text-[var(--snow)]"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--gold-dark)] hover:text-[var(--noir)] dark:text-[var(--gold-light)]"
                      aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      <i className={`bi ${mostrarPassword ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                  {esNuevo && <p className="pl-1 text-[11px] text-[var(--noir-soft)] dark:text-[var(--ash)]">Solo se puede ver antes de guardar.</p>}
                </div>
              </div>
            </div>

            {/* Sección: Permisos */}
            <div className={`
              p-4 sm:p-5 rounded-[2px] border transition-colors shadow-sm
              bg-[var(--snow)] border-[var(--border-gold-40)]
              dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
            `}>
              <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                <i className="bi bi-shield-lock"></i> Rol y Estado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Rol del integrante"
                  name="roleId" 
                  tipo="select"
                  opciones={rolesOpciones.map((rol) => ({ value: rol.id, label: rol.nombre }))}
                  value={formData.roleId} 
                  onChange={handleChange} 
                  deshabilitado={esPropiaCuenta || (esCuentaAdmin && !puedeAdministrarCuentaAdmin)}
                  abrirHaciaArriba={true}
                />
                <Input 
                  label="Estado de la Cuenta" 
                  name="activo" 
                  tipo="select"
                  opciones={["Activo", "Inactivo"]}
                  value={formData.activo ? "Activo" : "Inactivo"} 
                  onChange={(e) => handleChange({ target: { name: 'activo', type: 'checkbox', checked: e.target.value === "Activo" } })} 
                  deshabilitado={esPropiaCuenta || data?.isPrimaryAdmin === true || (esCuentaAdmin && !puedeAdministrarCuentaAdmin)}
                  abrirHaciaArriba={true}
                />
              </div>

              {rolSeleccionado && (
                <div className="mt-5 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-4 dark:border-[var(--border-gold-20)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-tag text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Permisos del integrante</p>
                      <p className="mt-1 text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">
                        {rolSeleccionado.codigo === "ADMIN" ? "Administrador: los permisos se heredan del rol y no se editan individualmente." : "Bodeguero: permisos operativos de almacén."}
                      </p>
                    </div>
                    <span className="w-fit rounded-[2px] border border-[var(--border-gold-30)] bg-[var(--snow)] px-2.5 py-1 font-tag text-xs font-semibold text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir)] dark:text-[var(--gold-light)]">{permisosActivos.length} activos</span>
                  </div>

                  {rolSeleccionado.codigo !== "ADMIN" && (
                    <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2 text-sm sm:grid-cols-2">
                      {permisosActivos.map((code) => (
                        <span key={code} className="flex items-center gap-2 text-[var(--noir-soft)] dark:text-[var(--ash)]"><i className="bi bi-check-circle-fill text-[var(--gold-dark)] dark:text-[var(--gold-light)]" />{getPermissionLabel(code)}</span>
                      ))}
                    </div>
                  )}

                  {rolSeleccionado.codigo !== "ADMIN" && <div className="mt-4 flex justify-center border-t border-[var(--border-gold-25)] pt-4 dark:border-[var(--border-gold-20)]">
                    <Boton
                      variante="claro"
                      onClick={() => setMostrarAjustesPermisos(true)}
                      tipo="button"
                      className="w-full sm:w-auto"
                    >
                      <i className="bi bi-shield-gear" /> Ajustar permisos
                    </Boton>
                  </div>}
                </div>
              )}
            </div>

          </form>
        </div>
      </Modal>

      {mostrarAjustesPermisos && rolSeleccionado && (
        <Modal
          isOpen={true}
          onClose={() => setMostrarAjustesPermisos(false)}
          ancho="max-w-2xl"
          titulo="Ajustar permisos"
          footer={
            <div className="flex w-full justify-end">
              <Boton variante="claro" className="px-4 py-2 text-xs" onClick={() => setMostrarAjustesPermisos(false)}>Listo</Boton>
            </div>
          }
        >
          <div className="font-body">
            <div className="mb-5 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-4">
              <p className="font-tag text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{rolSeleccionado.nombre}</p>
              <p className="mt-1 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Los permisos marcados están activos. Añadir un permiso fuera del rol requiere confirmación.</p>
            </div>

            <div className="space-y-3">
              {sortPermissionGroups(Object.entries(permisosAgrupados))
                .map(([modulo, permisos]) => (
                <details key={modulo} className="group rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-tag text-sm font-semibold uppercase tracking-wider text-[var(--noir)] dark:text-[var(--snow)]">
                    <span>{MODULE_LABELS[modulo] || MODULOS_PERMISOS[modulo] || modulo}</span>
                    <i className="bi bi-chevron-down text-[var(--gold-dark)] transition-transform group-open:rotate-180 dark:text-[var(--gold-light)]" />
                  </summary>
                  <div className="border-t border-[var(--border-gold-25)] px-4 py-2 dark:border-[var(--border-gold-20)]">
                    {sortPermissions(permisos).map((permiso) => {
                      const esPermisoDelRol = rolSeleccionado.permissions.includes(permiso.code);
                      const asignado = esPermisoDelRol
                        ? !formData.revokedPermissions.includes(permiso.code)
                        : formData.grantedPermissions.includes(permiso.code);
                      return (
                        <label key={permiso.code} className={`flex items-center justify-between gap-4 border-b border-[var(--border-gold-20)] py-3 last:border-b-0 ${puedeModificarPermisos ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                          <span className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">{getPermissionLabel(permiso.code)}</span>
                          <input
                            type="checkbox"
                            checked={asignado}
                            disabled={!puedeModificarPermisos}
                            onChange={() => togglePermiso(permiso.code)}
                            className="h-4 w-4 shrink-0 accent-[var(--gold-dark)]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>

            {!puedeModificarPermisos && !esNuevo && data?.id === usuarioLogeado?.id && (
              <p className="mt-4 text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">No puedes modificar los permisos de tu propia cuenta.</p>
            )}
          </div>
        </Modal>
      )}

      {confirmarDescartar && (
        <ModalConfirmacion
          isOpen={true}
          tipo="confirmar"
          titulo="¿Descartar cambios?"
          mensaje="Los cambios no guardados se perderán. ¿Deseas salir de todas formas?"
          textoConfirmar="Descartar"
          textoCancelar="Seguir editando"
          onConfirmar={(e) => {
            if (e) e.preventDefault();
            setConfirmarDescartar(false);
            if (typeof onClose === 'function') onClose();
          }}
          onCancelar={(e) => {
            if (e) e.preventDefault();
            setConfirmarDescartar(false);
          }}
        />
      )}

      {permisoPendiente && (
        <ModalConfirmacion
          isOpen={true}
          tipo="confirmar"
          titulo="¿Otorgar permiso adicional?"
          mensaje={`Darás el permiso “${getPermissionLabel(permisoPendiente)}” a este integrante, además de los permisos de su rol.`}
          textoConfirmar="Otorgar permiso"
          textoCancelar="Cancelar"
          onConfirmar={confirmarPermisoAdicional}
          onCancelar={() => setPermisoPendiente(null)}
        />
      )}
    </>
  );
}
