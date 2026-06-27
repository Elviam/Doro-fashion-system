import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";

export default function FormProveedores({ proveedor, esNuevo, onClose, onGuardar, isOpen = true }) {
  const [form, setForm] = useState({
    id: null, nombre: "", rfc: "", giro: "", email: "",
    telefono: "", contacto: "", direccion: "", notas: "", estado: "Activo"
  });

  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  useEffect(() => {
    const inicial = {
      id: proveedor?.id || null,
      nombre: proveedor?.nombre || "",
      rfc: proveedor?.rfc || "",
      giro: proveedor?.giro || "",
      email: proveedor?.email || "",
      telefono: proveedor?.telefono || "",
      contacto: proveedor?.contacto || "",
      direccion: proveedor?.direccion || "",
      notas: proveedor?.notas || "",
      estado: proveedor?.estado || "Activo",
    };
    
    setForm(inicial);
    setEstadoOriginal(JSON.stringify(inicial));
  }, [proveedor, esNuevo]);

  const handleIntentarCerrar = () => {
    const estadoActual = JSON.stringify(form);
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
  }, [isOpen, confirmarDescartar, form, estadoOriginal, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarClick = (e) => {
    e.preventDefault();
    onGuardar(form);
  };

  const tituloPersonalizado = (
    <h2 className="text-xl font-bold uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0">
      {esNuevo ? "Nuevo Proveedor" : "Editar Proveedor"}
    </h2>
  );

  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
        <i className="bi bi-x-lg"></i> Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardarClick} tipo="button">
        <i className="bi bi-save"></i> {esNuevo ? "Crear proveedor" : "Guardar cambios"}
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
          <form className="flex flex-col gap-6">
            
            <Input label="Nombre o Razón Social" name="nombre" value={form.nombre} onChange={handleChange} requerido />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="RFC" name="rfc" value={form.rfc} onChange={handleChange} />
              <Input label="Correo Electrónico" tipo="email" name="email" value={form.email} onChange={handleChange} />
              <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
              <Input label="Contacto Principal" name="contacto" value={form.contacto} onChange={handleChange} />
            </div>

            <Input label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Giro Comercial" name="giro" value={form.giro} onChange={handleChange} />
              <Input label="Estado" name="estado" tipo="select" opciones={["Activo", "Inactivo"]} value={form.estado} onChange={handleChange} />
            </div>

            <Input label="Notas" tipo="textarea" name="notas" value={form.notas} onChange={handleChange} />
            
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