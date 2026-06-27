import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";

export default function FormRoles({ rolData, onGuardar, onClose, isOpen = true }) {
  const esNuevo = !rolData;

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    permissions: []
  });

  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  useEffect(() => {
    const inicial = {
      nombre: rolData?.nombre || "",
      descripcion: rolData?.descripcion || "",
      permissions: rolData?.permissions || []
    };
    
    setFormData(inicial);
    setEstadoOriginal(JSON.stringify(inicial));
  }, [rolData, isOpen]);

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
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "nombre" ? value.toUpperCase() : value 
    }));
  };

  const handleGuardarClick = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;
    onGuardar(formData);
  };

  // Header
  const tituloPersonalizado = (
    <span className="text-xl font-bold uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0 block">
      {esNuevo ? "Crear Nuevo Rol" : "Editar Rol"}
    </span>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
        <i className="bi bi-x-lg"></i> Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardarClick} tipo="button" disabled={!formData.nombre.trim()}>
        <i className="bi bi-save"></i> {esNuevo ? "Crear rol" : "Guardar cambios"}
      </Boton>
    </div>
  );

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleIntentarCerrar} 
        ancho="max-w-lg"
        titulo={tituloPersonalizado}
        footer={footerAcciones}
      >
        <div className="font-poppins pt-2 pb-4">
          <form className="flex flex-col gap-6">
            <div className={`p-5 rounded-xl border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none`}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
                <i className="bi bi-card-heading"></i> Datos del Rol
              </h3>
              <div className="flex flex-col gap-4">
                <Input 
                  label="Nombre del Rol" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej. ADMINISTRADOR" 
                  requerido 
                />
                <Input 
                  label="Descripción" 
                  tipo="textarea"
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleChange} 
                  placeholder="Describe el propósito de este rol..." 
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