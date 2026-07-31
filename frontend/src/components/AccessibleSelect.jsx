import { useEffect, useMemo, useRef, useState } from "react";

const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

export default function AccessibleSelect({
  ariaLabel,
  containerClassName = "mt-1.5",
  disabled = false,
  error = false,
  id,
  inputClassName = "",
  mostrarBotonDesplegable = false,
  onChange,
  options,
  placeholder,
  soloSeleccion = false,
  value,
}) {
  const controlRef = useRef(null);
  const optionRefs = useRef([]);
  const editandoRef = useRef(false);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [texto, setTexto] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const [alturaMaxima, setAlturaMaxima] = useState(240);

  const opciones = useMemo(
    () => [...new Map(options.map((opcion) => [opcion.value, opcion])).values()],
    [options]
  );
  const seleccionada = opciones.find((opcion) => opcion.value === value);
  const filtradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    return termino
      ? opciones.filter((opcion) => normalizarTexto(opcion.label).includes(termino))
      : opciones;
  }, [busqueda, opciones]);

  useEffect(() => {
    if (!editandoRef.current) setTexto(seleccionada?.label || "");
  }, [seleccionada?.label]);

  useEffect(() => {
    if (indiceActivo >= filtradas.length) setIndiceActivo(filtradas.length - 1);
  }, [filtradas.length, indiceActivo]);

  useEffect(() => {
    if (abierto && indiceActivo >= 0) {
      optionRefs.current[indiceActivo]?.scrollIntoView({ block: "nearest" });
    }
  }, [abierto, indiceActivo]);

  useEffect(() => {
    if (!abierto) return undefined;
    const ajustarAltura = () => {
      const rect = controlRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAlturaMaxima(Math.max(0, Math.min(240, window.innerHeight - rect.bottom - 8)));
    };
    ajustarAltura();
    window.addEventListener("resize", ajustarAltura);
    window.addEventListener("scroll", ajustarAltura, true);
    return () => {
      window.removeEventListener("resize", ajustarAltura);
      window.removeEventListener("scroll", ajustarAltura, true);
    };
  }, [abierto]);

  const abrir = () => {
    setBusqueda("");
    setIndiceActivo(opciones.length > 0 ? 0 : -1);
    setAbierto(true);
  };

  const alternarOpciones = () => {
    if (abierto) {
      setAbierto(false);
      setBusqueda("");
      setIndiceActivo(-1);
      editandoRef.current = false;
      setTexto(seleccionada?.label || "");
      return;
    }

    editandoRef.current = false;
    setTexto(seleccionada?.label || "");
    abrir();
  };

  const seleccionar = (opcion) => {
    editandoRef.current = false;
    setTexto(opcion.label);
    setBusqueda("");
    setIndiceActivo(-1);
    setAbierto(false);
    onChange(opcion.value);
  };

  const limpiarTextoInvalido = () => {
    setAbierto(false);
    setBusqueda("");
    setIndiceActivo(-1);
    editandoRef.current = false;
    setTexto(seleccionada?.label || "");
  };

  const manejarCambio = (event) => {
    const nuevoTexto = event.target.value;
    editandoRef.current = true;
    setTexto(nuevoTexto);
    setBusqueda(nuevoTexto);
    setIndiceActivo(0);
    setAbierto(true);
    if (value) onChange("");
  };

  const manejarTecla = (event) => {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!abierto) abrir();
      else setIndiceActivo((actual) => Math.min(actual + 1, filtradas.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!abierto) abrir();
      else setIndiceActivo((actual) => Math.max(actual - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      if (abierto && filtradas[indiceActivo]) {
        event.preventDefault();
        seleccionar(filtradas[indiceActivo]);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      limpiarTextoInvalido();
    }
  };

  return (
    <div className={"relative " + containerClassName}>
      {soloSeleccion ? (
        <button
          ref={controlRef}
          id={id}
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="none"
          aria-controls={id + "-listbox"}
          aria-expanded={abierto}
          aria-activedescendant={abierto && indiceActivo >= 0 ? id + "-option-" + indiceActivo : undefined}
          aria-invalid={error || undefined}
          disabled={disabled}
          onClick={alternarOpciones}
          onBlur={limpiarTextoInvalido}
          onKeyDown={manejarTecla}
          className={"flex w-full items-center justify-between gap-3 text-left " + inputClassName}
        >
          <span className="truncate normal-case">{seleccionada?.label || placeholder}</span>
          <i aria-hidden="true" className={"bi shrink-0 text-xs " + (abierto ? "bi-chevron-up" : "bi-chevron-down")} />
        </button>
      ) : (
      <input
        ref={controlRef}
        id={id}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={id + "-listbox"}
        aria-expanded={abierto}
        aria-activedescendant={abierto && indiceActivo >= 0 ? id + "-option-" + indiceActivo : undefined}
        aria-invalid={error || undefined}
        autoComplete="off"
        disabled={disabled}
        value={texto}
        placeholder={placeholder}
        onFocus={() => {
          editandoRef.current = true;
          abrir();
          controlRef.current?.select();
        }}
        onChange={manejarCambio}
        onBlur={limpiarTextoInvalido}
        onKeyDown={manejarTecla}
        className={inputClassName + (mostrarBotonDesplegable ? " pr-11" : "")}
      />
      )}
      {mostrarBotonDesplegable && (
        <button
          type="button"
          aria-label={abierto ? "Cerrar opciones de " + ariaLabel.toLowerCase() : "Mostrar todas las opciones de " + ariaLabel.toLowerCase()}
          aria-controls={id + "-listbox"}
          aria-expanded={abierto}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={alternarOpciones}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[2px] text-[var(--gold-dark)] transition hover:bg-[var(--gold-08)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[var(--gold-light)]"
        >
          <i aria-hidden="true" className={"bi " + (abierto ? "bi-chevron-up" : "bi-chevron-down")} />
        </button>
      )}

      {abierto && (
        <ul
          id={id + "-listbox"}
          role="listbox"
          aria-label={ariaLabel}
          className={"absolute z-50 mt-1.5 w-full max-w-full overflow-y-auto rounded-[2px] border shadow-lg bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]" + (soloSeleccion ? " normal-case" : "")}
          style={{ maxHeight: alturaMaxima + "px" }}
        >
          {filtradas.length === 0 ? (
            <li className="px-4 py-3 text-sm font-body text-[var(--noir-soft)] dark:text-[var(--ash)]">
              No se encontraron opciones
            </li>
          ) : filtradas.map((opcion, indice) => (
            <li
              key={opcion.value}
              id={id + "-option-" + indice}
              ref={(elemento) => { optionRefs.current[indice] = elemento; }}
              role="option"
              aria-selected={opcion.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => seleccionar(opcion)}
              className={"cursor-pointer px-4 py-2.5 text-sm font-body transition-colors " + (indice === indiceActivo ? "bg-[var(--gold-08)]" : "") + " " + (opcion.value === value ? "font-semibold text-[var(--noir)] dark:text-[var(--snow)]" : "text-[var(--noir-soft)] dark:text-[var(--ash)]")}
            >
              {opcion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
