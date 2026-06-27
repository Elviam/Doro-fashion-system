import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";

export default function FormPermisoNuevo({ onGuardar, onClose, isOpen = true }) {
  const [formData, setFormData] = useState({
    code: "", nombre: "", descripcion: "", modulo: ""
  });

  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  const modulos = ["audit", "auth", "clients", "dashboard", "inventory", "permissions", "products", "recepciones", "roles", "suppliers", "tienda", "users", "ventas"];

  useEffect(() => {
    const inicial = { code: "", nombre: "", descripcion: "", modulo: "" };
    setFormData(inicial);
    setEstadoOriginal(JSON.stringify(inicial));
  }, [isOpen]);

  const handleIntentarCerrar = () => {
    const estadoActual = JSON.stringify(formData);
    if (estadoActual !== estadoOriginal) setConfirmarDescartar(true);
    else if (typeof onClose === 'function') onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === "Escape" && isOpen && !confirmarDescartar) handleIntentarCerrar();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmarDescartar, formData, estadoOriginal, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.code.trim() && formData.nombre.trim() && formData.modulo.trim();

  const handleGuardarClick = (e) => {
    e.preventDefault();
    if (isFormValid) onGuardar(formData);
  };

  const tituloPersonalizado = (
    <span className="text-xl font-bold uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0 block">
      Crear Nuevo Permiso
    </span>
  );

  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
        <i className="bi bi-x-lg"></i> Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardarClick} tipo="button" disabled={!isFormValid}>
        <i className="bi bi-save"></i> Crear permiso
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
          <form className="flex flex-col gap-4">
            <Input label="Código del Permiso" name="code" value={formData.code} onChange={handleChange} placeholder="Ej. roles:create" requerido />
            <Input label="Nombre Legible" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Crear Rol" requerido />
            <Input label="Módulo" name="modulo" tipo="select" opciones={modulos} value={formData.modulo} onChange={handleChange} requerido />
            <Input label="Descripción" tipo="textarea" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Describe qué permite hacer..." />
          </form>
        </div>
      </Modal>

      {confirmarDescartar && (
        <ModalConfirmacion
          isOpen={true}
          tipo="confirmar"
          titulo="¿Descartar cambios?"
          mensaje="Los datos del nuevo permiso se perderán. ¿Deseas salir de todas formas?"
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