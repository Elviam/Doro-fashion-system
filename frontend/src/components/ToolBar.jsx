import { useState, useEffect, useRef } from "react";

function DropdownFiltro({ valor, setValor, opciones, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const opcionSeleccionada = opciones?.find(opt => opt.value === valor);
  const textoActual = (valor === "" && placeholder) 
    ? placeholder 
    : (opcionSeleccionada?.label || "Filtrar por");

  return (
    <div className="relative w-full sm:w-40 shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blanco text-oscuro border border-oscuro/20 rounded-lg px-4 py-2.5 text-sm cursor-pointer outline-none hover:border-oscuro transition-colors shadow-sm flex items-center justify-between w-full h-full dark:bg-bg-card dark:text-lila dark:border-lila/20 dark:hover:border-lila"
      >
        <span className="font-medium truncate mr-2">{textoActual}</span>
        <i className={`bi bi-chevron-down text-xs transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}></i>
      </button>

      {isOpen && (
        <ul className="absolute top-full left-0 mt-2 w-full bg-blanco border border-oscuro/20 rounded-lg shadow-xl z-50 overflow-hidden py-1 dark:bg-bg-card dark:border-lila/20">
          {opciones.map((opcion, i) => (
            <li
              key={i}
              onClick={() => { setValor(opcion.value); setIsOpen(false); }}
              className="px-4 py-2.5 text-sm text-oscuro hover:bg-morado hover:text-blanco cursor-pointer transition-colors dark:text-lila dark:hover:bg-lila dark:hover:text-oscuro"
            >
              {opcion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
export default function ToolBar({
  filtro, setFiltro, opcionesFiltro, placeholderFiltro, // <-- Agregado placeholderFiltro
  busqueda, setBusqueda, placeholderBuscar = "Buscar...",
  textoBoton = "+ Nuevo", accionBoton,
  filtro2, setFiltro2, opcionesFiltro2, placeholderFiltro2, // <-- Agregado placeholderFiltro2
  textoBoton2, accionBoton2
}) {
  
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-5 w-full">
      
      <div className="flex flex-col sm:flex-row gap-4 w-full xl:flex-1">
        
        {opcionesFiltro && (
          <DropdownFiltro 
            valor={filtro} 
            setValor={setFiltro} 
            opciones={opcionesFiltro} 
            placeholder={placeholderFiltro} // <-- Pasamos el placeholder
          />
        )}

        {opcionesFiltro2 && (
          <DropdownFiltro 
            valor={filtro2} 
            setValor={setFiltro2} 
            opciones={opcionesFiltro2} 
            placeholder={placeholderFiltro2} // <-- Pasamos el placeholder 2
          />
        )}

        <input
          type="text"
          placeholder={placeholderBuscar}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-blanco text-oscuro border border-oscuro/20 rounded-lg px-4 py-2.5 text-sm w-full sm:flex-1 max-w-md outline-none hover:border-oscuro focus:ring-1 focus:ring-oscuro transition-all shadow-sm placeholder-oscuro/30 dark:bg-bg-card dark:text-lila dark:border-lila/20 dark:hover:border-lila dark:focus:ring-lila dark:placeholder-lila/30"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
        {textoBoton2 && accionBoton2 && (
          <button 
            onClick={accionBoton2}
            className="bg-transparent text-oscuro border border-oscuro/20 rounded-lg px-6 py-2.5 font-bold text-sm cursor-pointer hover:border-oscuro transition-all active:scale-95 w-full sm:w-auto dark:text-lila dark:border-lila/30 dark:hover:border-lila dark:hover:bg-lila/5"
          >
            {textoBoton2}
          </button>
        )}

        {textoBoton && accionBoton && (
          <button 
            onClick={accionBoton}
            className="bg-lila text-oscuro border-none rounded-lg px-6 py-2.5 font-bold text-sm cursor-pointer hover:bg-lila-soft hover:scale-102 transition-all active:scale-95 w-full sm:w-auto"
          >
            {textoBoton}
          </button>
        )}
      </div>
      
    </div>
  );
}