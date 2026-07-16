import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import { TALLAS_POR_CATEGORIA } from "../constants/categorias";
import { uploadImageToCloudinary } from "../services/cloudinaryClient";

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

export default function ModalAjusteInventario({ isOpen, onClose, onGuardar, guardando, producto }) {
  const [form, setForm] = useState({ valoresPorTalla: {}, motivo: "", notas: "" });
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
      const tallas = TALLAS_POR_CATEGORIA[producto?.categoria] || ["Unitalla"];
      const valoresPorTalla = Object.fromEntries(
        tallas.map((talla) => [talla, String(stockPorTalla[talla] ?? 0)])
      );
      setForm({ valoresPorTalla, motivo: "", notas: "" });
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
    tallasDisponibles.forEach((talla) => {
      const valor = form.valoresPorTalla[talla];
      if (valor === "" || !Number.isInteger(Number(valor)) || Number(valor) < 0) {
        e[`talla-${talla}`] = "Ingresa un valor entero igual o mayor a 0.";
      }
    });
    if (!form.motivo) e.motivo = "Selecciona un motivo.";
    if (form.motivo === "Otro" && !form.notas.trim()) e.notas = "Las notas son obligatorias para este motivo.";
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
        tallas: tallasDisponibles,
        valoresPorTalla: Object.fromEntries(
          tallasDisponibles.map((talla) => [talla, Number(form.valoresPorTalla[talla])])
        ),
        tipo: "fijar",
        cantidad: 0,
        motivo: form.motivo,
        notas: form.notas,
        evidencia: urlsEvidencia,
      });
    } finally {
      setSubiendo(false);
    }
  };

  const footerModal = (
    <div className="w-full flex flex-row flex-wrap justify-end items-center gap-3">
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
              <div className="mt-2 grid grid-cols-2 gap-3">
                {tallasDisponibles.map((talla) => {
                  return (
                    <div
                      key={talla}
                      className="grid grid-cols-2 items-center rounded-[2px] border p-1.5 bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]"
                    >
                      <label htmlFor={`stock-${talla}`} className="w-full text-center text-xs font-semibold text-noir dark:text-snow">{talla}</label>
                      <input
                        id={`stock-${talla}`}
                        type="number"
                        min="0"
                        step="1"
                        value={form.valoresPorTalla[talla] ?? ""}
                        onChange={(e) => {
                          const { value } = e.target;
                          setForm((prev) => ({ ...prev, valoresPorTalla: { ...prev.valoresPorTalla, [talla]: value } }));
                          if (errors[`talla-${talla}`]) setErrors((prev) => ({ ...prev, [`talla-${talla}`]: "" }));
                        }}
                        className="w-20 justify-self-center rounded-[2px] border px-1 py-1.5 text-center text-sm bg-[var(--snow)] text-[var(--noir)] border-[var(--border-gold-40)] focus:outline-none focus:border-[var(--gold-dark)] dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:focus:border-[var(--gold-light)]"
                      />
                      {errors[`talla-${talla}`] && <p className="mt-1 text-[9px] leading-tight text-rojo">{errors[`talla-${talla}`]}</p>}
                    </div>
                  );
                })}
              </div>
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
                requerido={form.motivo === "Otro"}
                onChange={handleChange} placeholder="Describe brevemente qué pasó…" />
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
