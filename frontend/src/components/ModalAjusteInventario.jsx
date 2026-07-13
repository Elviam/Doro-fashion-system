import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";
import { uploadImageToCloudinary } from "../services/cloudinaryClient";

const TIPOS_AJUSTE = ["Sumar (+)", "Restar (−)", "Fijar valor exacto"];

const MOTIVOS_AJUSTE = [
  { label: "Nueva Recepción",        evidenciaObligatoria: true  },
  { label: "Prenda dañada",          evidenciaObligatoria: true  },
  { label: "Deterioro",              evidenciaObligatoria: true  },
  { label: "Defecto de fábrica",     evidenciaObligatoria: true  },
  { label: "Robo o extravío",        evidenciaObligatoria: false },
  { label: "Error de captura",       evidenciaObligatoria: false },
  { label: "Devolución del cliente", evidenciaObligatoria: false },
  { label: "Otro",                   evidenciaObligatoria: false },
];

function labelToTipo(label) {
  if (label.startsWith("Sumar"))  return "sumar";
  if (label.startsWith("Restar")) return "restar";
  return "fijar";
}

export default function ModalAjusteInventario({ isOpen, onClose, onGuardar, guardando, producto }) {
  const [form, setForm] = useState({ tallas: [], tipo: "Sumar (+)", cantidad: "", motivo: "", notas: "" });
  const [evidencia, setEvidencia] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [subiendo, setSubiendo] = useState(false);

  const tallasDisponibles = TALLAS_POR_CATEGORIA[producto?.categoria] || ["Unitalla"];
  const motivoInfo = MOTIVOS_AJUSTE.find((m) => m.label === form.motivo);
  const evidenciaRequerida = motivoInfo?.evidenciaObligatoria || false;
  const stockPorTalla = Object.fromEntries((producto?.inventario || []).map((item) => [item.talla, item.stock || 0]));

  useEffect(() => {
    if (isOpen) {
      setForm({ tallas: [], tipo: "Sumar (+)", cantidad: "", motivo: "", notas: "" });
      setEvidencia([]);
      setErrors({});
    }
  }, [isOpen, producto?.id]);

  useEffect(() => {
    const urls = evidencia.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [evidencia]);

  if (!isOpen || !producto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEvidenciaChange = (e) => {
    const archivos = Array.from(e.target.files);
    setEvidencia((prev) => [...prev, ...archivos].slice(0, 4));
    if (errors.evidencia) setErrors((prev) => ({ ...prev, evidencia: "" }));
    e.target.value = "";
  };

  const handleEliminarEvidencia = (idx) => {
    setEvidencia((prev) => prev.filter((_, i) => i !== idx));
  };

  const validar = () => {
    const e = {};
    if (!form.tallas.length) e.tallas = "Selecciona al menos una talla.";
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      e.cantidad = "Ingresa una cantidad válida mayor a 0.";
    if (!form.motivo) e.motivo = "Selecciona un motivo.";
    if (!form.notas.trim()) e.notas = "Las notas son obligatorias.";
    if (evidenciaRequerida && evidencia.length === 0)
      e.evidencia = "Este motivo requiere al menos una foto de evidencia.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    try {
      setSubiendo(true);
      const urlsEvidencia = await Promise.all(evidencia.map((f) => uploadImageToCloudinary(f)));
      onGuardar({
        productoId: producto.id,
        tallas: form.tallas,
        tipo: labelToTipo(form.tipo),
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
        notas: form.notas,
        evidencia: urlsEvidencia,
      });
    } finally {
      setSubiendo(false);
    }
  };

  const footerModal = (
    <div className="w-full flex flex-row flex-wrap justify-start items-center gap-3">
      <Boton variante="claro" onClick={onClose} tipo="button">Cancelar</Boton>
      <Boton variante="oscuro" onClick={handleSubmit} tipo="button">
        {(guardando || subiendo)
          ? <><i className="bi bi-arrow-repeat animate-spin" /> Guardando…</>
          : <><i className="bi bi-check2" /> Aplicar Ajuste</>
        }
      </Boton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} titulo="Editar Inventario" footer={footerModal} ancho="max-w-5xl" tituloClassName="text-lg sm:text-xl">
      <div className="flex flex-col gap-5 font-body">

        <div className="flex items-center gap-3 p-3 rounded-[2px] bg-gold/8 border border-gold/30">
          <div className="w-14 h-14 rounded-[2px] overflow-hidden bg-noir-soft border border-gold/20 shrink-0">
            {producto.imagenes?.[0] ? (
              <img src={producto.imagenes[0]} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><i className="bi bi-image text-ash" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-noir dark:text-snow truncate">{producto.nombre}</p>
            <p className="text-xs font-mono text-gold-dark dark:text-gold-light">{producto.sku}</p>
            <p className="text-xs text-noir-soft dark:text-ash">{producto.categoria}</p>
          </div>
        </div>

        <div className="px-3 py-2 rounded-[2px] text-xs font-body bg-gold/10 border border-gold/30 text-gold-dark dark:text-gold-light">
          <i className="bi bi-info-circle mr-1.5" />
          Este ajuste quedará registrado en Auditoría con tu usuario, motivo y evidencia.
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] lg:text-xs font-tag uppercase tracking-wider pl-1 text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                Tallas <span className="text-rojo">*</span>
              </label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tallasDisponibles.map((talla) => {
                  const seleccionada = form.tallas.includes(talla);
                  return (
                    <button
                      key={talla}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          tallas: seleccionada
                            ? prev.tallas.filter((item) => item !== talla)
                            : [...prev.tallas, talla],
                        }));
                        if (errors.tallas) setErrors((prev) => ({ ...prev, tallas: "" }));
                      }}
                      className={`rounded-[2px] border px-3 py-2 text-sm transition-colors ${seleccionada ? "bg-[var(--noir)] text-[var(--snow)] border-[var(--noir)]" : "bg-[var(--snow)] text-[var(--noir)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)]"}`}
                    >
                      <div className="font-semibold">{talla}</div>
                      <div className="text-[10px] opacity-70">Stock {stockPorTalla[talla] ?? 0}</div>
                    </button>
                  );
                })}
              </div>
              {errors.tallas && <p className="text-rojo text-[10px] mt-1 pl-1">{errors.tallas}</p>}
            </div>

            <Input label="Tipo de ajuste" tipo="select" name="tipo" value={form.tipo}
              onChange={handleChange} opciones={TIPOS_AJUSTE} requerido />

            <div>
              <Input label="Cantidad" tipo="number" name="cantidad" value={form.cantidad}
                onChange={handleChange} placeholder="0" requerido />
              {errors.cantidad && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.cantidad}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Input label="Motivo" tipo="select" name="motivo" value={form.motivo}
                onChange={handleChange} opciones={MOTIVOS_AJUSTE.map((m) => m.label)}
                placeholder="Selecciona un motivo…" requerido />
              {errors.motivo && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.motivo}</p>}
            </div>

            <div>
              <Input label="Notas" tipo="textarea" name="notas" value={form.notas}
                onChange={handleChange} placeholder="Describe brevemente qué pasó…" requerido />
              {errors.notas && <p className="text-rojo text-[10px] mt-0.5 pl-1">{errors.notas}</p>}
            </div>

            <div>
              <p className="text-xs lg:text-sm font-semibold uppercase mb-2 text-noir-soft dark:text-ash">
                Evidencia {evidenciaRequerida
                  ? <span className="text-rojo-dark dark:text-rojo">*</span>
                  : <span className="opacity-60">(opcional)</span>}
              </p>
              <div className="flex flex-wrap gap-3">
                {previews.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-[2px] border overflow-hidden bg-[var(--gold-08)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
                    <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleEliminarEvidencia(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-[2px] bg-rojo-dark hover:bg-rojo-dark/80 dark:bg-rojo dark:hover:bg-rojo/80 text-snow flex items-center justify-center shadow-md">
                      <i className="bi bi-x text-xs"></i>
                    </button>
                  </div>
                ))}
                {evidencia.length < 4 && (
                  <label className={`flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-[2px] cursor-pointer transition-colors
                    ${errors.evidencia ? "border-rojo-dark bg-rojo-dark/5 dark:border-rojo dark:bg-rojo/5" : "border-[var(--border-gold-40)] bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]"}`}>
                    <i className="bi bi-camera text-lg text-[var(--gold-dark)] dark:text-[var(--gold-light)]"></i>
                    <span className="text-[9px] mt-1 text-center text-[var(--noir-soft)] dark:text-[var(--ash)]">Agregar</span>
                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" multiple onChange={handleEvidenciaChange} />
                  </label>
                )}
              </div>
              {errors.evidencia && <p className="text-rojo text-[10px] mt-1 pl-1">{errors.evidencia}</p>}
              <p className="text-xs text-noir-soft dark:text-ash mt-2">Hasta 4 fotos · PNG, JPG o WEBP.</p>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}