import { useState, useEffect } from "react";
import { api } from "../services/api";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import ModalConfirmacion from "./ModalConfirmacion";
import { CATEGORIAS_PERMITIDAS, DEPARTAMENTOS_PERMITIDOS, TALLAS_POR_CATEGORIA } from "../constants/categorias";

// Categorías que NO se manejan por talla (solo stock general).
// Ajusta este valor si el nombre exacto en CATEGORIAS_PERMITIDAS es distinto.
const CATEGORIAS_SIN_TALLAS = ["Accesorios"];

export default function FormProductos({ data, onGuardar, onCancelar, isOpen }) {
  const [formData, setFormData] = useState({
    sku: "", nombre: "", departamento: "", categoria: "",
    descripcion: "", pVenta: "", pCompra: "", estado: "Activo",
    inventario: [], imagenes: [], stockMinimo: 0,
    supplierId: "", supplierNombre: "", 
  });

  const [proveedores, setProveedores] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errorImagenes, setErrorImagenes] = useState("");
  const [errorInventario, setErrorInventario] = useState("");

  // Errores por campo, para mostrar alerta visual junto a cada input
  const [errores, setErrores] = useState({});
  // Mensaje general cuando faltan varios campos
  const [alertaGeneral, setAlertaGeneral] = useState("");

  useEffect(() => {
    const urls = formData.imagenes.map((img) =>
      img instanceof File ? URL.createObjectURL(img) : img
    );
    setPreviews(urls);

    return () => {
      urls.forEach((url, i) => {
        if (formData.imagenes[i] instanceof File) URL.revokeObjectURL(url);
      });
    };
  }, [formData.imagenes]);

  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [stockInput, setStockInput] = useState("");

  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  const categoriaSinTallas = CATEGORIAS_SIN_TALLAS.includes(formData.categoria);

  const tomarSnapshot = (estado) => {
    const copia = { ...estado };
    copia.imagenes = (copia.imagenes || []).map((img) =>
      img instanceof File ? img.name : img
    );
    return JSON.stringify(copia);
  };

    useEffect(() => {
        let inicial;
        if (data) {
          inicial = { ...data, inventario: data.inventario || [], imagenes: data.imagenes || [] };
          setFormData(inicial);
        } else {
          inicial = { sku: "", nombre: "", departamento: "", categoria: "", descripcion: "", pVenta: "", pCompra: "", estado: "Activo", inventario: [], imagenes: [], stockMinimo: 0, supplierId: "", supplierNombre: "" };
          setFormData(inicial);
        }
        setEstadoOriginal(tomarSnapshot(inicial));
        setErrores({});
        setAlertaGeneral("");
        setErrorInventario("");
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
    setStockInput("");
    setErrorInventario("");
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

  const limpiarError = (campo) => {
    setErrores(prev => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Caso especial: cambiar de categoría entre "con tallas" y "sin tallas"
    // reinicia el inventario para evitar datos inconsistentes.
    if (name === "categoria") {
      const eraSinTallas = CATEGORIAS_SIN_TALLAS.includes(formData.categoria);
      const seraSinTallas = CATEGORIAS_SIN_TALLAS.includes(value);
      if (eraSinTallas !== seraSinTallas) {
        setFormData(prev => ({ ...prev, categoria: value, inventario: [] }));
        limpiarError(name);
        limpiarError("inventario");
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    limpiarError(name);
  };

    const handleImagenChange = (e) => {
      const archivos = Array.from(e.target.files);
      if (archivos.length === 0) return;

      setFormData((prev) => {
        const espacioDisponible = 6 - prev.imagenes.length;
        const nuevosArchivos = archivos.slice(0, espacioDisponible);
        return { ...prev, imagenes: [...prev.imagenes, ...nuevosArchivos] };
      });

      setErrorImagenes("");
      limpiarError("imagenes");
      e.target.value = ""; // permite volver a seleccionar el mismo archivo después
    };

    const handleEliminarImagen = (index) => {
      setFormData((prev) => ({
        ...prev,
        imagenes: prev.imagenes.filter((_, i) => i !== index),
      }));
    };

  const obtenerTallasPorCategoria = (categoria) => {
    return TALLAS_POR_CATEGORIA[categoria] || ["Unitalla"];
  };

  const opcionesTallasActuales = obtenerTallasPorCategoria(formData.categoria);

  // Solo permite dígitos positivos (evita "-", letras, decimales sueltos, etc.)
  const handleStockInputChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setStockInput(val);
      if (errorInventario) setErrorInventario("");
    }
  };

  const handleAgregarTalla = () => {
    if (!tallaSeleccionada) {
      setErrorInventario("Selecciona una talla.");
      return;
    }

    const cantidad = parseInt(stockInput, 10);
    if (stockInput === "" || isNaN(cantidad) || cantidad <= 0) {
      setErrorInventario("Ingresa una cantidad válida, mayor a 0.");
      return;
    }

    const existe = formData.inventario.find(i => i.talla === tallaSeleccionada);
    let nuevoInventario;

    if (existe) {
      nuevoInventario = formData.inventario.map(i => 
        i.talla === tallaSeleccionada ? { ...i, stock: cantidad } : i
      );
    } else {
      nuevoInventario = [...formData.inventario, { talla: tallaSeleccionada, stock: cantidad }];
    }

    setFormData({ ...formData, inventario: nuevoInventario });
    setTallaSeleccionada(""); 
    setStockInput("");
    setErrorInventario("");
    limpiarError("inventario");
  };

  const handleEliminarTalla = (tallaBorrar) => {
    setFormData({
      ...formData,
      inventario: formData.inventario.filter(i => i.talla !== tallaBorrar)
    });
  };

  // Stock único para categorías que no manejan tallas (ej. Accesorios)
  const handleStockAccesorioChange = (e) => {
    const val = e.target.value;

    if (val === "") {
      setFormData(prev => ({ ...prev, inventario: [] }));
      return;
    }
    if (!/^\d+$/.test(val)) return;

    const cantidad = parseInt(val, 10);
    setFormData(prev => ({ ...prev, inventario: [{ talla: "Unitalla", stock: cantidad }] }));
    limpiarError("inventario");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const camposFaltantes = [];

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
      camposFaltantes.push("Nombre");
    }
    if (!formData.departamento) {
      nuevosErrores.departamento = "Selecciona un departamento.";
      camposFaltantes.push("Departamento");
    }
    if (!formData.categoria) {
      nuevosErrores.categoria = "Selecciona una categoría.";
      camposFaltantes.push("Categoría");
    }
    if (!formData.descripcion || !formData.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria.";
      camposFaltantes.push("Descripción");
    }
    if (formData.pCompra === "" || formData.pCompra === null || Number(formData.pCompra) <= 0) {
      nuevosErrores.pCompra = "Ingresa un precio de compra válido.";
      camposFaltantes.push("Precio de Compra");
    }
    if (formData.pVenta === "" || formData.pVenta === null || Number(formData.pVenta) <= 0) {
      nuevosErrores.pVenta = "Ingresa un precio de venta válido.";
      camposFaltantes.push("Precio de Venta");
    }
    if (formData.stockMinimo === "" || formData.stockMinimo === null || Number(formData.stockMinimo) < 0) {
      nuevosErrores.stockMinimo = "Ingresa un stock mínimo válido (0 o mayor).";
      camposFaltantes.push("Stock Mínimo");
    }
    if (formData.imagenes.length === 0) {
      nuevosErrores.imagenes = "Debes subir al menos una imagen del producto.";
      camposFaltantes.push("Imágenes");
    }
    if (formData.inventario.length === 0) {
      nuevosErrores.inventario = categoriaSinTallas
        ? "Debes indicar el stock disponible."
        : "Agrega al menos una talla con stock.";
      camposFaltantes.push(categoriaSinTallas ? "Stock" : "Tallas/Inventario");
    }

    setErrores(nuevosErrores);
    setErrorImagenes(nuevosErrores.imagenes || "");

    if (camposFaltantes.length > 0) {
      setAlertaGeneral(`Faltan campos por completar: ${camposFaltantes.join(", ")}.`);
      return false;
    }

    setAlertaGeneral("");
    return true;
  };

    const handleGuardarClick = (e) => {
      e.preventDefault();
      if (!validarFormulario()) return;
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
        <form className="flex flex-col gap-8 font-body pt-2">

          {alertaGeneral && (
            <div className="flex items-center gap-2 p-3 rounded-[2px] border border-rojo-dark bg-rojo-dark/10 text-rojo-dark dark:border-rojo dark:bg-rojo/10 dark:text-rojo text-xs lg:text-sm">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{alertaGeneral}</span>
            </div>
          )}

         {/* Imágenes */}
          <div className={`
            p-5 rounded-[2px] border transition-colors shadow-sm
            bg-[var(--snow)] border-[var(--border-gold-40)]
            dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
          `}>
            <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
              <i className="bi bi-images"></i> Fotografías del Producto <span className="text-rojo-dark dark:text-rojo">*</span>
            </h3>

            <div className="flex flex-wrap gap-4">
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2px] border overflow-hidden shadow-inner bg-[var(--gold-08)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]"
                >
                  <img src={url} alt={`Producto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleEliminarImagen(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-[2px] bg-rojo-dark hover:bg-rojo-dark/80 dark:bg-rojo dark:hover:bg-rojo/80 text-[var(--snow)] flex items-center justify-center shadow-md transition-colors"
                    title="Eliminar imagen"
                  >
                    <i className="bi bi-x text-xs"></i>
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 font-tag uppercase tracking-wider bg-[rgba(10,10,10,0.6)] text-[var(--gold-light)]">
                      Portada
                    </span>
                  )}
                </div>
              ))}

              {formData.imagenes.length < 6 && (
                <label className={`
                  flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed rounded-[2px] cursor-pointer transition-colors
                  ${errores.imagenes ? "border-rojo-dark bg-rojo-dark/5 dark:border-rojo dark:bg-rojo/5" : "border-[var(--border-gold-40)] bg-[var(--gold-08)] hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]"}
                `}>
                  <i className="bi bi-plus-lg text-xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]"></i>
                  <span className="text-[9px] mt-1 text-center px-1 text-[var(--noir-soft)] dark:text-[var(--ash)]">Agregar</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handleImagenChange}
                  />
                </label>
              )}
            </div>

            {errorImagenes && <p className="text-xs mt-3 text-rojo-dark dark:text-rojo">{errorImagenes}</p>}

            <p className="text-xs lg:text-sm mt-3 text-[var(--noir-soft)] dark:text-[var(--ash)]">
              PNG, JPG o WEBP · Máx. 5MB por imagen · Hasta 6 imágenes · La primera es la portada en la tienda.
            </p>
          </div>

          {/* Información */}
          <div className={`
            p-5 rounded-[2px] border transition-colors shadow-sm
            bg-[var(--snow)] border-[var(--border-gold-40)]
            dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
          `}>
            <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
              <i className="bi bi-info-circle"></i> Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <Input 
                  label="Nombre del Producto" name="nombre" value={formData.nombre} 
                  onChange={handleChange} requerido 
                />
                {errores.nombre && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.nombre}</p>}
              </div>
              
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
              
              <div>
                <Input 
                  label="Departamento" name="departamento" tipo="select" 
                  opciones={DEPARTAMENTOS_PERMITIDOS} 
                  value={formData.departamento} onChange={handleChange} requerido 
                />
                {errores.departamento && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.departamento}</p>}
              </div>
              
              <div>
                <Input 
                  label="Categoría" name="categoria" tipo="select" 
                  opciones={CATEGORIAS_PERMITIDAS} 
                  value={formData.categoria} onChange={handleChange} requerido 
                />
                {errores.categoria && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.categoria}</p>}
              </div>

              <div className="md:col-span-2 mt-2">
                <Input 
                  label="Proveedor (opcional)" 
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
            p-5 rounded-[2px] border transition-colors shadow-sm
            bg-[var(--snow)] border-[var(--border-gold-40)]
            dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
          `}>
            <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
              <i className="bi bi-card-text"></i> Descripción
            </h3>
            <Input 
              label="Descripción del Producto" name="descripcion" tipo="textarea" 
              value={formData.descripcion} onChange={handleChange} requerido 
            />
            {errores.descripcion && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.descripcion}</p>}
          </div>

          {/* Precios */}
          <div className={`
            p-5 rounded-[2px] border transition-colors shadow-sm
            bg-[var(--snow)] border-[var(--border-gold-40)]
            dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
          `}>
            <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
              <i className="bi bi-currency-dollar"></i> Precios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input label="Precio de Compra (Costo)" name="pCompra" tipo="number" min="0" value={formData.pCompra} onChange={handleChange} requerido />
                {errores.pCompra && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.pCompra}</p>}
              </div>
              <div>
                <Input label="Precio de Venta" name="pVenta" tipo="number" min="0" value={formData.pVenta} onChange={handleChange} requerido />
                {errores.pVenta && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.pVenta}</p>}
              </div>
            </div>
          </div>

          {/* Inventario */}
          <div className={`
            p-5 rounded-[2px] border transition-colors shadow-sm
            bg-[var(--snow)] border-[var(--border-gold-40)]
            dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none
          `}>
            <h3 className="text-sm lg:text-base font-tag uppercase flex items-center gap-2 mb-4 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
              <i className="bi bi-box-seam"></i> Inventario y Alertas
            </h3>

            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <Input 
                  label="Stock Mínimo" 
                  tipo="number" 
                  name="stockMinimo" 
                  min="0"
                  value={formData.stockMinimo} 
                  onChange={handleChange} 
                  requerido
                />
                {errores.stockMinimo && <p className="text-xs mt-1 text-rojo-dark dark:text-rojo">{errores.stockMinimo}</p>}
              </div>
            </div>

            <h4 className="text-xs lg:text-sm font-tag uppercase mb-3 text-[var(--noir-soft)] dark:text-[var(--ash)]">
              {categoriaSinTallas ? "Stock Disponible" : "Tallas y Stock"} <span className="text-rojo-dark dark:text-rojo">*</span>
            </h4>

            {categoriaSinTallas ? (
              // Categorías que no se manejan por talla (ej. Accesorios): un solo campo de stock
              <div className="mb-2">
                <Input 
                  label="Cantidad en Stock" 
                  tipo="number" 
                  name="stockAccesorio"
                  min="0"
                  placeholder="Ej. 15"
                  value={formData.inventario[0]?.stock ?? ""}
                  onChange={handleStockAccesorioChange}
                />
                <p className="text-xs lg:text-sm mt-2 text-[var(--noir-soft)] dark:text-[var(--ash)]">
                  Esta categoría no maneja tallas, solo la cantidad total disponible.
                </p>
                {errores.inventario && <p className="text-xs mt-2 text-rojo-dark dark:text-rojo">{errores.inventario}</p>}
              </div>
            ) : (
              <>
                <div className={`
                  flex flex-col sm:flex-row gap-3 items-end mb-2 p-4 rounded-[2px] border transition-colors
                  bg-[var(--gold-08)] border-[var(--border-gold-40)]
                  dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]
                `}>
                  <div className="flex-1 w-full">
                   <Input 
                      label="Seleccionar Talla" 
                      tipo="select" 
                      name="tallaSeleccionada"
                      opciones={opcionesTallasActuales}
                      value={tallaSeleccionada}
                      onChange={(e) => setTallaSeleccionada(e.target.value)}
                      placeholder={formData.categoria ? "Seleccionar..." : "Elige primero una categoría"}
                      deshabilitado={!formData.categoria}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <Input 
                      label="Cantidad (Stock)" 
                      tipo="number" 
                      name="stockInput"
                      min="0"
                      placeholder="Ej. 15"
                      value={stockInput}
                      onChange={handleStockInputChange}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <Boton variante="oscuro" onClick={handleAgregarTalla} tipo="button" className="w-full h-10 flex justify-center">
                      <i className="bi bi-plus-lg"></i> Agregar
                    </Boton>
                  </div>
                </div>

                {errorInventario && <p className="text-xs mb-4 text-rojo-dark dark:text-rojo">{errorInventario}</p>}
                {!errorInventario && errores.inventario && <p className="text-xs mb-4 text-rojo-dark dark:text-rojo">{errores.inventario}</p>}

                {/* Tarjetas de Tallas */}
                {formData.inventario.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.inventario.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`
                          flex items-center justify-between rounded-[2px] p-2 pr-3 group border transition-colors shadow-sm
                          bg-[var(--snow)] border-[var(--border-gold-40)]
                          dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex flex-col items-center justify-center w-10 h-10 rounded-[2px] border transition-colors
                            bg-[var(--gold-08)] border-[var(--border-gold-40)]
                            dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]
                          `}>
                            <span className="text-xs lg:text-sm font-tag uppercase text-[var(--gold-dark)] dark:text-[var(--snow)]">{item.talla === "Unitalla" ? "UNI" : item.talla}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] lg:text-[10px] font-tag uppercase tracking-wider text-[var(--noir-soft)] dark:text-[var(--ash)]">Stock</span>
                            <span className="text-sm lg:text-base font-bold text-[var(--noir)] dark:text-[var(--snow)]">{item.stock}</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleEliminarTalla(item.talla)}
                          className="transition-colors opacity-70 group-hover:opacity-100 text-[var(--noir-soft)] hover:text-rojo-dark dark:text-[var(--ash)] dark:hover:text-rojo"
                          title="Eliminar talla"
                        >
                          <i className="bi bi-x-circle-fill text-lg"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`
                    text-sm lg:text-base italic text-center py-6 rounded-[2px] border transition-colors
                    text-[var(--noir-soft)] bg-[var(--gold-08)] border-[var(--border-gold-40)]
                    dark:text-[var(--ash)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]
                  `}>
                    Aún no has agregado tallas a este producto.
                  </p>
                )}
              </>
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