import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";

export default function FormClientes({ cliente, esNuevo, onClose, onGuardar, isOpen = true }) {
  const [form, setForm] = useState({
    nombre: "",
    rfc: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
    activo: true, 
  });

  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  useEffect(() => {
    const inicial = {
      nombre: cliente?.nombre || "",
      rfc: cliente?.rfc || "",
      email: cliente?.email || "",
      telefono: cliente?.telefono || "",
      direccion: cliente?.direccion || "",
      notas: cliente?.notas || "",
      activo: cliente ? cliente.activo !== false : true, 
    };
    
    setForm(inicial);
    setEstadoOriginal(JSON.stringify(inicial));
  }, [cliente, esNuevo]);

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
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  const handleGuardarClick = (e) => {
    e.preventDefault();
    onGuardar(esNuevo ? form : { ...cliente, ...form });
  };

  // Header
  const tituloPersonalizado = (
    <h2 className="text-xl font-bold uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0">
      {esNuevo ? "Nuevo Cliente" : "Editar Cliente"}
    </h2>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
        <i className="bi bi-x-lg"></i> Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardarClick} tipo="button">
        <i className="bi bi-save"></i> {esNuevo ? "Crear cliente" : "Guardar cambios"}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="sm:col-span-2">
                <Input
                  label="Nombre Completo o Empresa"
                  tipo="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Ana Morales / Empresa S.A."
                  requerido
                />
              </div>
              
              <div className="sm:col-span-2">
                <Input
                  label="Estado"
                  tipo="select"
                  name="activo"
                  value={form.activo ? "Activo" : "Inactivo"}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    activo: e.target.value === "Activo" 
                  }))}
                  opciones={["Activo", "Inactivo"]}
                />
              </div>
              
              <Input
                label="RFC"
                tipo="text"
                name="rfc"
                value={form.rfc}
                onChange={handleChange}
                placeholder="RFC con homoclave"
              />
              
              <Input
                label="Teléfono"
                tipo="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej. 555 123 4567"
              />
              
              <div className="sm:col-span-2">
                <Input
                  label="Correo Electrónico"
                  tipo="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Dirección"
                  tipo="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Calle, Número, Colonia, C.P., Ciudad"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Notas"
                  tipo="textarea"
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Observaciones adicionales sobre este cliente..."
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