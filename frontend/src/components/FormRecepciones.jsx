import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { Package } from "lucide-react";
import ModalConfirmacion from "./ModalConfirmacion";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";

function formatMoney(n) {
  return `$${Number(n).toLocaleString("es-MX")}`;
}

export default function FormRecepciones({ row, esNuevo, onClose, onGuardar }) {
  const [suppliers, setSuppliers]                   = useState([]);
  const [products, setProducts]                     = useState([]);
  const [guardando, setGuardando]                   = useState(false);
  const [error, setError]                           = useState("");
  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [folioSiguiente, setFolioSiguiente]         = useState("");

  const estadoInicial = {
    supplierId:     row?.supplierId     || "",
    supplierNombre: row?.supplierNombre || "",
    folio:          row?.folio          || "",
    fecha:          row?.fecha ? row.fecha.split("T")[0] : new Date().toISOString().split("T")[0],
    comentarios:    row?.comentarios    || "",
    status:         row?.status         || "DRAFT",
    items:          row?.items ? row.items.map((i) => ({ ...i })) : [],
  };

  const [form, setForm]  = useState(estadoInicial);
  const [estadoOriginal] = useState(JSON.stringify(estadoInicial));

  const productosDelProveedor = form.supplierId
    ? products.filter((p) => p.supplierId === form.supplierId)
    : products;

  const handleIntentarCerrar = useCallback(() => {
    const estadoActual = JSON.stringify(form);
    if (estadoActual !== estadoOriginal) {
      setConfirmarDescartar(true);
    } else {
      onClose();
    }
  }, [form, estadoOriginal, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !confirmarDescartar) handleIntentarCerrar();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmarDescartar, form, estadoOriginal, onClose]);

  useEffect(() => {
    api.get("/suppliers?limit=100").then((res) => setSuppliers(res.items || res)).catch(console.error);
    api.get("/products?limit=100&activo=true").then((res) => setProducts(res.items || res)).catch(console.error);
    if (esNuevo) {
      api.get("/recepciones/next-folio").then((res) => setFolioSiguiente(res.folio)).catch(console.error);
    }
  }, [esNuevo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (e) => {
    const nombreSeleccionado = e.target.value;
    const sup = suppliers.find((s) => s.nombre === nombreSeleccionado);
    setForm((p) => ({
      ...p,
      supplierNombre: nombreSeleccionado,
      supplierId: sup ? sup.id : "",
      items: [],
    }));
  };

  const handleProductChange = (idx, e) => {
    const nombreSeleccionado = e.target.value;
    const prod = productosDelProveedor.find((p) => p.nombre === nombreSeleccionado);
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item;
        const costoUnitario = prod ? prod.precioCompra : 0;
        const cantidad = item.cantidad || 1;
        return {
          ...item,
          productId:     prod ? prod.id : "",
          sku:           prod?.sku    || "",
          productNombre: nombreSeleccionado,
          imagen:        prod?.imagen || "",
          talla:         "",
          costoUnitario,
          subtotal: cantidad * costoUnitario,
        };
      });
      return { ...prev, items };
    });
  };

  const handleTallaChange = (idx, talla) => {
    setForm((prev) => {
      const items = prev.items.map((item, i) =>
        i !== idx ? item : { ...item, talla }
      );
      return { ...prev, items };
    });
  };

  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [name]: Number(value) };
        updated.subtotal = updated.cantidad * updated.costoUnitario;
        return updated;
      });
      return { ...prev, items };
    });
  };

  const agregarItem = () => {
    if (!form.supplierId) {
      setError("Primero debes seleccionar un proveedor para agregar items.");
      return;
    }
    setError("");
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", sku: "", productNombre: "", imagen: "", talla: "", cantidad: 1, costoUnitario: 0, subtotal: 0 }],
    }));
  };

  const eliminarItem = (idx) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const totalCalculado = form.items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleGuardar = async () => {
    setError("");
    if (!form.supplierId)                                        return setError("Selecciona un proveedor.");
    if (!form.fecha)                                             return setError("La fecha es obligatoria.");
    if (form.items.length === 0)                                 return setError("Debes agregar al menos un item.");
    if (form.items.some((i) => !i.productId))                    return setError("Todos los items deben tener un producto seleccionado.");
    if (form.items.some((i) => !i.cantidad || i.cantidad <= 0)) return setError("La cantidad de cada item debe ser mayor a 0.");
    if (form.items.some((i) => i.costoUnitario < 0))            return setError("El costo unitario no puede ser negativo.");

    const itemSinTalla = form.items.find((i) => {
      const prod = products.find((p) => p.id === i.productId);
      return prod?.inventario?.length > 0 && !i.talla;
    });
    if (itemSinTalla) return setError(`Selecciona una talla para "${itemSinTalla.productNombre}".`);

    const body = {
      supplierId:     form.supplierId,
      supplierNombre: form.supplierNombre,
      fecha:          form.fecha,
      folio:          form.folio || undefined,
      comentarios:    form.comentarios || "",
      items: form.items.map((item) => ({
        productId:     item.productId,
        sku:           item.sku,
        productNombre: item.productNombre,
        talla:         item.talla || undefined,
        cantidad:      item.cantidad,
        costoUnitario: item.costoUnitario,
        subtotal:      item.subtotal,
      })),
      status: form.status,
    };

    setGuardando(true);
    try {
      if (esNuevo) await api.post("/recepciones", body);
      else         await api.patch(`/recepciones/${row.id}`, body);
      onGuardar();
      onClose();
    } catch (e) {
      setError(e.message || "Ocurrió un error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const footerAcciones = (
    <div className="flex justify-end gap-3 w-full">
      <Boton variante="secundario" onClick={handleIntentarCerrar} disabled={guardando} tipo="button">
        Cancelar
      </Boton>
      <Boton variante="claro" onClick={handleGuardar} disabled={guardando} tipo="button">
        <i className="bi bi-save" /> {guardando ? "Guardando..." : esNuevo ? "Crear recepción" : "Guardar cambios"}
      </Boton>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={true}
        onClose={handleIntentarCerrar}
        titulo={
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-[2px] text-xs lg:text-sm font-tag uppercase transition-colors bg-[var(--gold-dark)] text-[var(--snow)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)]">
              {esNuevo ? "NUEVO" : form.folio}
            </span>
            <span className="text-xl font-display font-extrabold m-0 text-[var(--noir)] dark:text-[var(--snow)]">
              {esNuevo ? "Nueva Recepción" : "Editar Recepción"}
            </span>
          </div>
        }
        ancho="max-w-3xl"
        footer={footerAcciones}
      >
        <div className="font-body pt-4">

          {error && (
            <div className="mb-6 px-4 py-3 rounded-[2px] text-sm lg:text-base font-semibold border bg-rojo/10 text-red-700 dark:text-rojo border-rojo/20">
              <i className="bi bi-exclamation-triangle-fill mr-2" />{error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

            <Input
              label="Proveedor" name="supplierNombre" tipo="select"
              opciones={suppliers.map((s) => s.nombre)}
              value={form.supplierNombre} onChange={handleSupplierChange}
            />

            {/* Folio automático en modo lectura */}
            <div>
              <label className="block text-[11px] lg:text-xs font-tag uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-1">
                Folio
              </label>
              <div className="w-full rounded-[2px] px-4 py-2.5 text-sm lg:text-base font-bold border transition-colors bg-[var(--gold-08)] border-[var(--border-gold-25)] text-[var(--noir-soft)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
                {esNuevo ? (folioSiguiente || "Cargando...") : form.folio}
              </div>
            </div>

            <Input
              label="Fecha" name="fecha" tipo="date"
              value={form.fecha} onChange={handleChange}
            />

            <Input
              label="Estado" name="status" tipo="select"
              opciones={["DRAFT", "CONFIRMED"]}
              value={form.status} onChange={handleChange}
            />

            <div className="md:col-span-2">
              <Input
                label="Comentarios" name="comentarios" tipo="textarea"
                value={form.comentarios} onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <div className="w-full rounded-[2px] px-4 py-3 text-center border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
                <p className="text-[11px] lg:text-xs font-tag uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-1">
                  Total calculado
                </p>
                <p className="text-2xl lg:text-3xl font-display font-extrabold text-green-700 dark:text-verde">{formatMoney(totalCalculado)}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] pb-2">
              <p className="text-sm lg:text-base font-tag uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                Items de Recepción
              </p>
              <button
                onClick={agregarItem} type="button"
                className="px-4 py-1.5 rounded-[2px] text-xs lg:text-sm font-bold transition-all cursor-pointer flex items-center gap-1 bg-[var(--gold-08)] text-[var(--gold-dark)] hover:bg-[var(--gold-08)] dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)] dark:hover:bg-[var(--gold-08)]"
              >
                <i className="bi bi-plus-lg" /> Agregar item
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {form.items.map((item, i) => {
                const prod  = products.find((p) => p.id === item.productId);
                const tallas = prod?.inventario?.map((t) => t.talla) ?? [];

                return (
                  <div
                    key={i}
                    className="rounded-[2px] px-4 py-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[2px] flex items-center justify-center shrink-0 overflow-hidden border transition-colors bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
                          {item.imagen
                            ? <img src={item.imagen} alt={item.productNombre} className="w-full h-full object-cover" />
                            : <Package size={18} />}
                        </div>
                        <span className="text-sm lg:text-base font-bold transition-colors text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                          Item {i + 1}
                        </span>
                      </div>
                      {form.items.length > 1 && (
                        <button
                          onClick={() => eliminarItem(i)}
                          className="text-sm lg:text-base transition-opacity opacity-70 hover:opacity-100 cursor-pointer text-rojo"
                        >
                          <i className="bi bi-trash" /> Eliminar
                        </button>
                      )}
                    </div>

                    <div className="mb-4">
                      <Input
                        label="Producto" name="productNombre" tipo="select"
                        opciones={productosDelProveedor.map((p) => p.nombre)}
                        value={item.productNombre}
                        onChange={(e) => handleProductChange(i, e)}
                      />
                    </div>

                    {tallas.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[11px] lg:text-xs font-tag uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--ash)] mb-2">Talla</p>
                        <div className="flex flex-wrap gap-2">
                          {tallas.map((t) => (
                            <button
                              key={t} type="button"
                              onClick={() => handleTallaChange(i, t)}
                              className={`px-3 py-1.5 rounded-[2px] text-xs lg:text-sm font-bold border-2 transition-all
                                ${item.talla === t
                                  ? "bg-[var(--gold-dark)] text-[var(--snow)] border-[var(--gold-dark)] dark:bg-[var(--gold-light)] dark:border-[var(--gold-light)] dark:text-[var(--noir)]"
                                  : "border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)] hover:border-[var(--gold-dark)] dark:hover:border-[var(--gold-light)]"
                                }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input label="Cantidad"    name="cantidad"      tipo="number" value={item.cantidad}      onChange={(e) => handleItemChange(i, e)} />
                      <Input label="Costo unit." name="costoUnitario" tipo="number" value={item.costoUnitario} onChange={(e) => handleItemChange(i, e)} />
                      <Input label="Subtotal"    name="subtotal"      value={formatMoney(item.subtotal)} deshabilitado={true} />
                    </div>
                  </div>
                );
              })}

              {form.items.length === 0 && (
                <div className="text-center py-8 text-[var(--noir-soft)] dark:text-[var(--ash)] italic text-sm lg:text-base border-2 border-dashed border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px]">
                  {form.supplierId
                    ? 'No hay items. Haz clic en "Agregar item" para empezar.'
                    : "Selecciona un proveedor para poder agregar items."}
                </div>
              )}
            </div>
          </div>

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
          onConfirmar={() => { setConfirmarDescartar(false); onClose(); }}
          onCancelar={() => setConfirmarDescartar(false)}
        />
      )}
    </>
  );
}