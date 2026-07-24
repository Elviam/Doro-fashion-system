import { useEffect, useRef, useState } from "react";

function mostrarFecha(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [anio, mes, dia] = iso.split("-");
  return `${dia} / ${mes} / ${anio}`;
}

export default function FechaMexicoInput({ etiqueta, value, onChange, min = "2026-01-01", max }) {
  const [texto, setTexto] = useState(() => mostrarFecha(value));
  const calendarioRef = useRef(null);

  useEffect(() => setTexto(mostrarFecha(value)), [value]);

  const abrirCalendario = () => {
    if (calendarioRef.current?.showPicker) calendarioRef.current.showPicker();
    else calendarioRef.current?.click();
  };

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">
      {etiqueta}
      <span className="relative inline-block">
        <input type="text" value={texto} readOnly onClick={abrirCalendario} tabIndex={0} placeholder="DD / MM / AAAA" className="h-9 w-36 cursor-pointer rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-2 pr-8 text-center text-sm text-[var(--noir)] outline-none focus:ring-1 focus:ring-[var(--gold)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir)] dark:text-[var(--snow)]" />
        <button type="button" onClick={abrirCalendario} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[var(--gold-dark)] dark:text-[var(--gold-light)]" aria-label={`Abrir calendario: ${etiqueta}`}><i className="bi bi-calendar3" /></button>
        <input ref={calendarioRef} type="date" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" tabIndex={-1} aria-hidden="true" />
      </span>
    </label>
  );
}
