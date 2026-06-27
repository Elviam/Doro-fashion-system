import { useState, useEffect } from "react";
import { canPerformAction } from "../utils/permissionMapper";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";

export default function FormUsuarios({ data, onGuardar, onClose, usuarioLogeado, esNuevo = false, rolesDisponibles: rolesDispProp = [], isOpen = true }) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    usuario: "",
    password: "",
    roleId: "VENDEDOR",
    activo: true
  });

  const [errores, setErrores] = useState({});
  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  const getRolesDisponibles = () => {
    if (rolesDispProp && rolesDispProp.length > 0) {
      return rolesDispProp
        .filter(rol => {
          const esAdmin = usuarioLogeado?.roleId === "role_admin" || usuarioLogeado?.roleId === "ADMIN";
          const rolId = rol.id || rol.nombre;
          if (rolId === "CLIENTE") return false;
          if (!esAdmin && rolId === "GERENTE") return false;
          return true;
        })
        .map(rol => ({ id: rol.id || rol.nombre, nombre: rol.nombre || rol.id }));
    }

    const rolesBase = ["BODEGUERO", "VENDEDOR"];
    const esAdmin = canPerformAction(usuarioLogeado?.permissions, 'roles', 'create') || usuarioLogeado?.roleId === "role_admin";
    const esGerente = canPerformAction(usuarioLogeado?.permissions, 'users', 'create') || usuarioLogeado?.roleId === "GERENTE";
    
    if (esAdmin) return [{ id: "GERENTE", nombre: "GERENTE" }, { id: "BODEGUERO", nombre: "BODEGUERO" }, { id: "VENDEDOR", nombre: "VENDEDOR" }];
    if (esGerente) return rolesBase.map(r => ({ id: r, nombre: r }));
    return [];
  };

  const rolesOpciones = getRolesDisponibles();

  useEffect(() => {
    const inicial = {
      nombre: data?.nombre || "",
      apellido: data?.apellido || "",
      email: data?.email || "",
      usuario: data?.usuario || "",
      password: "", // Siempre vacío al iniciar
      roleId: data?.roleId || data?.role || "VENDEDOR",
      activo: data ? data.activo !== false : true
    };
    
    setFormData(inicial);
    setEstadoOriginal(JSON.stringify(inicial));
    setErrores({});
  }, [data]);

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
      [name]: type === "checkbox" ? checked : value
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
      
      onGuardar(datosAEnviar);
    }
  };

  const puedeEditar = usuarioLogeado?.roleId === "role_admin" || usuarioLogeado?.roleId === "GERENTE";

  if (!puedeEditar && !esNuevo) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} ancho="max-w-md" titulo={<span className="text-xl font-bold text-morado dark:text-blanco block m-0">Acceso Denegado</span>}>
        <div className="p-6 text-center text-gris dark:text-lila-soft">
          <i className="bi bi-shield-lock text-4xl mb-3 block text-rojo"></i>
          <p>No tienes permisos suficientes para editar perfiles de usuario.</p>
          <Boton className="mt-6 w-full flex justify-center" onClick={onClose}>Entendido</Boton>
        </div>
      </Modal>
    );
  }

  const tituloPersonalizado = (
    <span className="text-xl font-bold uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0 block">
      {esNuevo ? "Crear Usuario" : "Editar Usuario"}
    </span>
  );

  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
        <i className="bi bi-x-lg"></i> Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardarClick} tipo="button">
        <i className="bi bi-save"></i> {esNuevo ? "Crear usuario" : "Guardar cambios"}
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
        <div className="font-poppins pt-2 pb-4">
          
          {Object.keys(errores).length > 0 && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm font-semibold border bg-rojo/10 text-rojo border-rojo/20 flex items-center">
              <i className="bi bi-exclamation-triangle-fill mr-2"></i>
              Por favor, corrige los errores antes de continuar.
            </div>
          )}

          <form className="flex flex-col gap-8">
            
            {/* Sección: Datos Personales */}
            <div className={`
              p-5 rounded-xl border transition-colors shadow-sm
              bg-blanco border-morado/20
              dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
            `}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
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
              p-5 rounded-xl border transition-colors shadow-sm
              bg-blanco border-morado/20
              dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
            `}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
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
                <Input 
                  label={esNuevo ? "Contraseña" : "Nueva Contraseña"} 
                  tipo="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder={esNuevo ? "••••••••" : "Opcional (Dejar en blanco para no cambiar)"} 
                  requerido={esNuevo} 
                />
              </div>
            </div>

            {/* Sección: Permisos */}
            <div className={`
              p-5 rounded-xl border transition-colors shadow-sm
              bg-blanco border-morado/20
              dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
            `}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
                <i className="bi bi-shield-lock"></i> Rol y Estado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Rol en el Sistema" 
                  name="roleId" 
                  tipo="select"
                  opciones={rolesOpciones.map(r => r.id)}
                  value={formData.roleId} 
                  onChange={handleChange} 
                  abrirHaciaArriba={true}
                />
                <Input 
                  label="Estado de la Cuenta" 
                  name="activo" 
                  tipo="select"
                  opciones={["Activo", "Inactivo"]}
                  value={formData.activo ? "Activo" : "Inactivo"} 
                  onChange={(e) => handleChange({ target: { name: 'activo', type: 'checkbox', checked: e.target.value === "Activo" } })} 
                  abrirHaciaArriba={true}
                />
              </div>
            </div>

          </form>
        </div>
      </Modal>

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
    </>
  );
}