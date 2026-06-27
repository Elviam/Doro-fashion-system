import { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";

export default function FormProductos({ data, onGuardar, onCancelar, isOpen }) {
  const [formData, setFormData] = useState({
    sku: "", nombre: "", departamento: "", categoria: "", marca: "", modelo: "", 
    descripcion: "", pVenta: "", pCompra: "", estado: "Activo",
    inventario: [], imagen: null, stockMinimo: 0, unidad: "Pieza", 
    supplierId: "", supplierNombre: "", 
  });

  const [proveedores, setProveedores] = useState([]);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [stockInput, setStockInput] = useState("");

  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  const tomarSnapshot = (estado) => {
    const copia = { ...estado };
    if (copia.imagen instanceof File) {
      copia.imagen = copia.imagen.name;
    }
    return JSON.stringify(copia);
  };

  useEffect(() => {
    let inicial;
    if (data) {
      inicial = { ...data, inventario: data.inventario || [], imagen: data.imagen || null };
      setFormData(inicial);
      setImagenPreview(data.imagen || null);
    } else {
      inicial = { sku: "", nombre: "", departamento: "", categoria: "", marca: "", modelo: "", descripcion: "", pVenta: "", pCompra: "", estado: "Activo", inventario: [], imagen: null, stockMinimo: 0, unidad: "Pieza", supplierId: "", supplierNombre: "" };
      setFormData(inicial);
      setImagenPreview(null); 
    }
    setEstadoOriginal(tomarSnapshot(inicial));
  }, [data]);

  const handleIntentarCerrar = () => {
    const estadoActual = tomarSnapshot(formData);
    if (estadoActual !== estadoOriginal) {
      setConfirmarDescartar(true);
    } else {
      onCancelar(); 
    }
  };

  useEffect(() => {
    setTallaSeleccionada("");
  }, [formData.categoria]);

  useEffect(() => {
    api.get("/suppliers?limit=100")
      .then((res) => setProveedores(res.items || res))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === "Escape" && isOpen && !confirmarDescartar) {
        handleIntentarCerrar();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmarDescartar, formData, estadoOriginal, onCancelar]);

  const handleProveedorChange = (e) => {
    const nombreSeleccionado = e.target.value;
    const prov = proveedores.find(p => p.nombre === nombreSeleccionado);
    setFormData(prev => ({
      ...prev,
      supplierNombre: nombreSeleccionado,
      supplierId: prov ? prov.id : ""
    }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, imagen: file }));
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  const handleEliminarImagen = () => {
    setFormData(prev => ({ ...prev, imagen: null }));
    setImagenPreview(null);
  };

  const obtenerTallasPorCategoria = (categoria) => {
    const superiores = ["Playeras", "Blusas", "Camisas", "Suéteres", "Sudaderas", "Chamarras", "Abrigos", "Vestidos"];
    const inferiores = ["Pantalones", "Faldas", "Shorts"];

    if (superiores.includes(categoria)) {
      return ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
    }
    if (inferiores.includes(categoria)) {
      return ["24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "XXS", "XS", "S", "M", "L", "XL", "XXL"];
    }
    if (categoria === "Calzado") {
      return ["22", "22.5", "23", "23.5", "24", "24.5", "25", "25.5", "26", "26.5", "27", "27.5", "28", "28.5", "29", "29.5", "30", "31"];
    }
    
    return ["Unitalla"]; 
  };

  const opcionesTallasActuales = obtenerTallasPorCategoria(formData.categoria);

  const handleAgregarTalla = () => {
    if (!tallaSeleccionada || !stockInput) return; 
    
    const existe = formData.inventario.find(i => i.talla === tallaSeleccionada);
    let nuevoInventario;

    if (existe) {
      nuevoInventario = formData.inventario.map(i => 
        i.talla === tallaSeleccionada ? { ...i, stock: parseInt(stockInput) } : i
      );
    } else {
      nuevoInventario = [...formData.inventario, { talla: tallaSeleccionada, stock: parseInt(stockInput) }];
    }

    setFormData({ ...formData, inventario: nuevoInventario });
    setTallaSeleccionada(""); 
    setStockInput("");
  };

  const handleEliminarTalla = (tallaBorrar) => {
    setFormData({
      ...formData,
      inventario: formData.inventario.filter(i => i.talla !== tallaBorrar)
    });
  };

  const handleGuardarClick = (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
        <i className="bi bi-x-lg"></i> Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardarClick} tipo="button">
        <i className="bi bi-save"></i> Guardar
      </Boton>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleIntentarCerrar}
        titulo={data ? "Editar Producto" : "Nuevo Producto"}
        ancho="max-w-3xl"
        footer={footerAcciones}
      >
        <form className="flex flex-col gap-8 font-poppins pt-2">

          {/* Imagen */}
          <div className={`
            p-5 rounded-xl border transition-colors shadow-sm
            bg-blanco border-morado/20
            dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
          `}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
              <i className="bi bi-image"></i> Fotografía del Producto
            </h3>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              
              <div className={`
                relative w-32 h-32 shrink-0 rounded-xl border flex items-center justify-center overflow-hidden shadow-inner transition-colors
                bg-lila-pastel border-morado/20
                dark:bg-white dark:border-lila/20
              `}>
                {imagenPreview ? (
                  <>
                    <img src={imagenPreview} alt="Preview" className="w-full h-full object-contain bg-white" />
                    <button
                      type="button"
                      onClick={handleEliminarImagen}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rojo text-blanco flex items-center justify-center shadow-md hover:bg-rojo/80 transition-colors"
                      title="Eliminar imagen"
                    >
                      <i className="bi bi-x text-sm"></i>
                    </button>
                  </>
                ) : (
                  <i className="bi bi-camera text-4xl text-morado/30 dark:text-lila-soft/50"></i>
                )}
              </div>

              <div className="flex-1 w-full">
                <label className={`
                  flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                  border-morado/30 bg-morado/5 hover:bg-morado/10
                  dark:border-lila/30 dark:bg-lila/5 dark:hover:bg-lila/10
                `}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <i className="bi bi-cloud-arrow-up text-2xl mb-2 text-morado dark:text-lila"></i>
                    <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                    <p className="text-xs mt-1 text-gris dark:text-lila-soft">PNG, JPG o WEBP (Max. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleImagenChange} 
                  />
                </label>
              </div>

            </div>
          </div>

          {/* Información */}
          <div className={`
            p-5 rounded-xl border transition-colors shadow-sm
            bg-blanco border-morado/20
            dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
          `}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
              <i className="bi bi-info-circle"></i> Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Input 
                label="Nombre del Producto" name="nombre" value={formData.nombre} 
                onChange={handleChange} requerido className="md:col-span-2" 
              />
              
              <Input 
                label="SKU / Código" name="sku" 
                value={data ? formData.sku : "Generado automáticamente"} 
                deshabilitado={true} 
              />
              
              <Input 
                label="Estado" name="estado" tipo="select" 
                opciones={["Activo", "Inactivo"]} 
                value={formData.estado} onChange={handleChange} 
              />
              
              <Input 
                label="Departamento" name="departamento" tipo="select" 
                opciones={["Dama", "Caballero", "Unisex"]} 
                value={formData.departamento} onChange={handleChange} requerido 
              />
              
              <Input 
                label="Categoría" name="categoria" tipo="select" 
                opciones={[
                  "Playeras", "Blusas", "Camisas", "Suéteres", "Sudaderas", 
                  "Chamarras", "Abrigos", "Vestidos", "Faldas", "Shorts", 
                  "Pantalones", "Calzado", "Accesorios"
                ]} 
                value={formData.categoria} onChange={handleChange} requerido 
              />
              
              <Input label="Marca" name="marca" value={formData.marca} onChange={handleChange} />
              <Input label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} />

              <div className="md:col-span-2 mt-2">
                <Input 
                  label="Proveedor" 
                  name="supplierNombre" 
                  tipo="select" 
                  opciones={proveedores ? proveedores.map(p => p.nombre) : []} 
                  value={formData.supplierNombre} 
                  onChange={handleProveedorChange} 
                />
              </div>

            </div>
          </div>

          {/* Descripción */}
          <div className={`
            p-5 rounded-xl border transition-colors shadow-sm
            bg-blanco border-morado/20
            dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
          `}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
              <i className="bi bi-card-text"></i> Descripción
            </h3>
            <Input 
              label="Descripción del Producto" name="descripcion" tipo="textarea" 
              value={formData.descripcion} onChange={handleChange} 
            />
          </div>

          {/* Precios */}
          <div className={`
            p-5 rounded-xl border transition-colors shadow-sm
            bg-blanco border-morado/20
            dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
          `}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
              <i className="bi bi-currency-dollar"></i> Precios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Precio de Compra (Costo)" name="pCompra" tipo="number" value={formData.pCompra} onChange={handleChange} requerido />
              <Input label="Precio de Venta" name="pVenta" tipo="number" value={formData.pVenta} onChange={handleChange} requerido />
            </div>
          </div>

          {/* Inventario */}
          <div className={`
            p-5 rounded-xl border transition-colors shadow-sm
            bg-blanco border-morado/20
            dark:bg-oscuro/20 dark:border-lila/5 dark:shadow-none
          `}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-morado dark:text-lila">
              <i className="bi bi-box-seam"></i> Inventario y Alertas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input 
                label="Stock Mínimo" 
                tipo="number" 
                name="stockMinimo" 
                value={formData.stockMinimo} 
                onChange={handleChange} 
              />
              
              <Input 
                label="Unidad de Medida" 
                name="unidad" 
                tipo="select" 
                opciones={["Pieza", "Par", "Caja", "Paquete"]} 
                value={formData.unidad || "Pieza"} 
                onChange={handleChange} 
              />
            </div>
            
            <div className={`
              flex flex-col sm:flex-row gap-3 items-end mb-6 p-4 rounded-lg border transition-colors
              bg-lila-pastel border-morado/20
              dark:bg-lila/5 dark:border-lila/10
            `}>
              <div className="flex-1 w-full">
                <Input 
                  label="Seleccionar Talla" 
                  tipo="select" 
                  name="tallaSeleccionada"
                  opciones={opcionesTallasActuales}
                  value={tallaSeleccionada}
                  onChange={(e) => setTallaSeleccionada(e.target.value)}
                />
              </div>
              <div className="flex-1 w-full">
                <Input 
                  label="Cantidad (Stock)" 
                  tipo="number" 
                  name="stockInput"
                  placeholder="Ej. 15"
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto">
                <Boton variante="oscuro" onClick={handleAgregarTalla} tipo="button" className="w-full h-10 flex justify-center">
                  <i className="bi bi-plus-lg"></i> Agregar
                </Boton>
              </div>
            </div>

            {/* Tarjetas de Tallas */}
            {formData.inventario.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.inventario.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`
                      flex items-center justify-between rounded-lg p-2 pr-3 group border transition-colors shadow-sm
                      bg-blanco border-morado/20
                      dark:bg-oscuro/40 dark:border-lila/20 dark:shadow-none
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex flex-col items-center justify-center w-10 h-10 rounded-md border transition-colors
                        bg-lila-pastel border-morado/20
                        dark:bg-lila/10 dark:border-lila/20
                      `}>
                        <span className="text-xs font-bold uppercase text-morado dark:text-blanco">{item.talla === "Unitalla" ? "UNI" : item.talla}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider text-gris dark:text-lila-soft">Stock</span>
                        <span className="text-sm font-bold text-oscuro dark:text-blanco">{item.stock}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleEliminarTalla(item.talla)}
                      className="transition-colors opacity-70 group-hover:opacity-100 text-gris hover:text-rojo dark:text-lila-soft dark:hover:text-rojo"
                      title="Eliminar talla"
                    >
                      <i className="bi bi-x-circle-fill text-lg"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`
                text-sm italic text-center py-6 rounded-lg border transition-colors
                text-gris bg-lila-pastel border-morado/20
                dark:text-lila-mid dark:bg-oscuro/40 dark:border-lila/5
              `}>
                Aún no has agregado tallas a este producto.
              </p>
            )}
          </div>

        </form>
      </Modal>

      {confirmarDescartar && (
        <ModalConfirmacion
          isOpen={true}
          tipo="confirmar"
          titulo="¿Descartar cambios?"
          mensaje="Los cambios no guardados se perderán. ¿Deseas salir de todas formas?"
          textoConfirmar="Descartar"
          textoCancelar="Seguir editando"
          onConfirmar={() => {
            setConfirmarDescartar(false);
            onCancelar(); 
          }}
          onCancelar={() => setConfirmarDescartar(false)}
        />
      )}
    </>
  );
}