import { useState, useRef, useEffect } from "react";

export default function Input({ 
  label, 
  tipo = "text", 
  name, 
  value, 
  onChange, 
  placeholder = "", 
  opciones = [], 
  requerido = false,
  deshabilitado = false, 
  className = "",
  abrirHaciaArriba = false,
  icono = "",
  iconoEtiqueta = "",
  claseEtiqueta = "",
  min,
  max,
  step = "1"
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNumberChange = (incremento) => {
    if (deshabilitado) return;
    const actual = parseFloat(value) || 0;
    const nuevo = actual + incremento;
    if(onChange) {
      onChange({ target: { name, value: nuevo >= 0 ? nuevo : 0 } });
    }
  };

  const getOptionValue = (opcion) => typeof opcion === "object" ? opcion.value : opcion;
  const getOptionLabel = (opcion) => typeof opcion === "object" ? opcion.label : opcion;
  const selectedOption = opciones.find((opcion) => getOptionValue(opcion) === value);
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : value;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className={`
          text-[11px] lg:text-xs font-tag uppercase tracking-wider pl-1 transition-colors
          text-[var(--gold-dark)]
          dark:text-[var(--gold-light)]
          ${claseEtiqueta}
        `}>
          {iconoEtiqueta && <i className={`bi ${iconoEtiqueta} mr-1.5`} aria-hidden="true" />}
          {label} {requerido && !deshabilitado && <span className="text-rojo">*</span>}
        </label>
      )}

      {tipo === "textarea" ? (
        <textarea
          name={name} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder}
          required={requerido} 
          disabled={deshabilitado} 
          rows="3"
          className={`
            w-full border rounded-[2px] px-4 py-2.5 text-sm lg:text-base focus:outline-none transition-all resize-none
            bg-[var(--snow)] text-[var(--noir)] border-[var(--border-gold-40)] focus:border-[var(--gold-dark)] placeholder-[var(--noir-soft)]
            dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:focus:border-[var(--gold-light)] dark:placeholder-[var(--ash)]
            ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-[var(--gold-08)] dark:bg-[var(--noir-soft)]' : ''}
          `}
        />
      ) : tipo === "select" ? (
        <div className="relative w-full" ref={dropdownRef}>
          <button
            type="button"
            disabled={deshabilitado}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              border rounded-[2px] px-4 py-2.5 text-sm lg:text-base cursor-pointer outline-none transition-colors shadow-sm flex items-center justify-between w-full h-10
              bg-[var(--snow)] text-[var(--noir)] border-[var(--border-gold-40)] hover:border-[var(--gold-dark)]
              dark:bg-[var(--noir)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:border-[var(--gold-light)]
              ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-[var(--gold-08)] dark:bg-[var(--noir-soft)]' : ''}
            `}
          >
            <span className="font-medium truncate">{selectedLabel || placeholder || "Seleccionar..."}</span>
            <i className={`bi bi-chevron-down text-xs transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}></i>
          </button>

          {isDropdownOpen && !deshabilitado && (
            <ul className={`
              absolute left-0 w-full max-h-48 overflow-y-auto rounded-[2px] shadow-xl z-50 py-1 scrollbar-hide border transition-colors
              bg-[var(--snow)] border-[var(--border-gold-40)]
              dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]
              ${abrirHaciaArriba ? "bottom-full mb-2" : "top-full mt-2"} /* ✨ MAGIA: Controlamos la dirección aquí */
            `}>
              {opciones.map((opcion, i) => (
                <li
                  key={i}
                  onClick={() => {
                    onChange({ target: { name, value: getOptionValue(opcion) } });
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    px-4 py-2.5 text-sm lg:text-base cursor-pointer transition-colors
                    text-[var(--noir)] hover:bg-[var(--gold-dark)] hover:text-[var(--snow)]
                    dark:text-[var(--gold-light)] dark:hover:bg-[var(--gold-light)] dark:hover:text-[var(--noir)]
                  `}
                >
                  {getOptionLabel(opcion)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tipo === "number" ? (
        <div className="relative flex items-center w-full">
          <input
            type="number" 
            name={name} 
            value={value} 
            onChange={onChange}
            onWheel={(event) => event.currentTarget.blur()}
            placeholder={placeholder} 
            required={requerido} 
            disabled={deshabilitado}
            min={min}
            max={max}
            step={step}
            className={`
              w-full border rounded-[2px] px-4 py-2.5 text-sm lg:text-base focus:outline-none transition-all
              bg-[var(--snow)] text-[var(--noir)] border-[var(--border-gold-40)] focus:border-[var(--gold-dark)] placeholder-[var(--noir-soft)]
              dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:focus:border-[var(--gold-light)] dark:placeholder-[var(--ash)]
              pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
              ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-[var(--gold-08)] dark:bg-[var(--noir-soft)]' : ''}
            `}
          />
          <div className="absolute right-2 flex flex-col gap-0.5">
            <button 
              type="button" 
              onClick={() => handleNumberChange(1)} 
              disabled={deshabilitado} 
              className={`
                transition-colors leading-none opacity-60 hover:opacity-100
                text-[var(--gold-dark)]
                dark:text-[var(--gold-light)]
              `}
            >
              <i className="bi bi-caret-up-fill text-[10px]"></i>
            </button>
            <button 
              type="button" 
              onClick={() => handleNumberChange(-1)} 
              disabled={deshabilitado} 
              className={`
                transition-colors leading-none opacity-60 hover:opacity-100
                text-[var(--gold-dark)]
                dark:text-[var(--gold-light)]
              `}
            >
              <i className="bi bi-caret-down-fill text-[10px]"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full">
          {icono && <i className={`bi ${icono} pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]`} />}
          <input
            type={tipo} name={name} value={value} onChange={onChange} placeholder={placeholder} required={requerido} disabled={deshabilitado}
            className={`
              w-full h-10 border rounded-[2px] ${icono ? 'pl-9 pr-4' : 'px-4'} py-2.5 text-sm lg:text-base focus:outline-none transition-all
              bg-[var(--snow)] text-[var(--noir)] border-[var(--border-gold-40)] focus:border-[var(--gold-dark)] placeholder-[var(--noir-soft)]
              dark:bg-[var(--noir)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:focus:border-[var(--gold-light)] dark:placeholder-[var(--ash)]
              ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-[var(--gold-08)] dark:bg-[var(--noir-soft)]' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
}
