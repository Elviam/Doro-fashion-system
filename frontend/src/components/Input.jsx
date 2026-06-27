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
  abrirHaciaArriba = false 
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

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className={`
          text-[11px] font-bold uppercase tracking-wider pl-1 transition-colors
          text-morado
          dark:text-lila-mid
        `}>
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
            w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all resize-none
            bg-blanco text-oscuro border-morado/20 focus:border-morado placeholder-gris/50
            dark:bg-bg-card dark:text-blanco dark:border-lila/20 dark:focus:border-lila dark:placeholder-lila-soft/50
            ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-gris/10 dark:bg-oscuro' : ''}
          `}
        />
      ) : tipo === "select" ? (
        <div className="relative w-full" ref={dropdownRef}>
          <button
            type="button"
            disabled={deshabilitado}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              border rounded-lg px-4 py-2.5 text-sm cursor-pointer outline-none transition-colors shadow-sm flex items-center justify-between w-full h-10
              bg-blanco text-oscuro border-morado/20 hover:border-morado
              dark:bg-bg-card dark:text-lila dark:border-lila/20 dark:hover:border-lila
              ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-gris/10 dark:bg-oscuro' : ''}
            `}
          >
            <span className="font-medium truncate">{value || placeholder || "Seleccionar..."}</span>
            <i className={`bi bi-chevron-down text-xs transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}></i>
          </button>

          {isDropdownOpen && !deshabilitado && (
            <ul className={`
              absolute left-0 w-full max-h-48 overflow-y-auto rounded-lg shadow-xl z-50 py-1 scrollbar-hide border transition-colors
              bg-blanco border-morado/20
              dark:bg-bg-card dark:border-lila/20
              ${abrirHaciaArriba ? "bottom-full mb-2" : "top-full mt-2"} /* ✨ MAGIA: Controlamos la dirección aquí */
            `}>
              {opciones.map((opcion, i) => (
                <li
                  key={i}
                  onClick={() => {
                    onChange({ target: { name, value: opcion } });
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    px-4 py-2.5 text-sm cursor-pointer transition-colors
                    text-oscuro hover:bg-morado hover:text-blanco
                    dark:text-lila dark:hover:bg-lila dark:hover:text-oscuro
                  `}
                >
                  {opcion}
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
            placeholder={placeholder} 
            required={requerido} 
            disabled={deshabilitado}
            className={`
              w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all
              bg-blanco text-oscuro border-morado/20 focus:border-morado placeholder-gris/50
              dark:bg-bg-card dark:text-blanco dark:border-lila/20 dark:focus:border-lila dark:placeholder-lila-soft/50
              pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
              ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-gris/10 dark:bg-oscuro' : ''}
            `}
          />
          <div className="absolute right-2 flex flex-col gap-0.5">
            <button 
              type="button" 
              onClick={() => handleNumberChange(1)} 
              disabled={deshabilitado} 
              className={`
                transition-colors leading-none
                text-morado/50 hover:text-morado
                dark:text-lila-soft dark:hover:text-lila
              `}
            >
              <i className="bi bi-caret-up-fill text-[10px]"></i>
            </button>
            <button 
              type="button" 
              onClick={() => handleNumberChange(-1)} 
              disabled={deshabilitado} 
              className={`
                transition-colors leading-none
                text-morado/50 hover:text-morado
                dark:text-lila-soft dark:hover:text-lila
              `}
            >
              <i className="bi bi-caret-down-fill text-[10px]"></i>
            </button>
          </div>
        </div>
      ) : (
        <input
          type={tipo} 
          name={name} 
          value={value} 
          onChange={onChange}
          placeholder={placeholder} 
          required={requerido} 
          disabled={deshabilitado}
          className={`
            w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all
            bg-blanco text-oscuro border-morado/20 focus:border-morado placeholder-gris/50
            dark:bg-bg-card dark:text-blanco dark:border-lila/20 dark:focus:border-lila dark:placeholder-lila-soft/50
            ${deshabilitado ? 'opacity-60 cursor-not-allowed bg-gris/10 dark:bg-oscuro' : ''}
          `}
        />
      )}
    </div>
  );
}