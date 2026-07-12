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
        className="bg-[var(--snow)] text-[var(--noir)] border border-[var(--border-gold-40)] rounded-[2px] px-3.5 py-2 text-sm lg:text-sm font-body cursor-pointer outline-none hover:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-colors shadow-sm flex items-center justify-between w-full h-10 dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:hover:border-[var(--gold)]"
      >
        <span className="font-medium truncate mr-2">{textoActual}</span>
        <i className={`bi bi-chevron-down text-xs text-[var(--gold-dark)] dark:text-[var(--gold-light)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}></i>
      </button>

      {isOpen && (
        <ul className="absolute top-full left-0 mt-2 w-full bg-[var(--snow)] border border-[var(--border-gold-40)] rounded-[2px] shadow-xl z-50 overflow-hidden py-1 dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]">
          {opciones.map((opcion, i) => (
            <li
              key={i}
              onClick={() => { setValor(opcion.value); setIsOpen(false); }}
              className="px-3.5 py-2 text-sm lg:text-sm font-body text-[var(--noir-soft)] hover:bg-[var(--gold)] hover:text-[var(--noir)] cursor-pointer transition-colors dark:text-[var(--snow)] dark:hover:bg-[var(--gold-15)] dark:hover:text-[var(--gold-light)]"
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
  filtro, setFiltro, opcionesFiltro, placeholderFiltro,
  busqueda, setBusqueda, placeholderBuscar = "Buscar...",
  textoBoton = "+ Nuevo", accionBoton,
  filtro2, setFiltro2, opcionesFiltro2, placeholderFiltro2,
  filtro3, setFiltro3, opcionesFiltro3, placeholderFiltro3,
  textoBoton2, accionBoton2
}) {
  
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4 w-full">
      
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1 lg:min-w-0">
        
        {opcionesFiltro && (
          <DropdownFiltro 
            valor={filtro} 
            setValor={setFiltro} 
            opciones={opcionesFiltro} 
            placeholder={placeholderFiltro}
          />
        )}

        {opcionesFiltro2 && (
          <DropdownFiltro 
            valor={filtro2} 
            setValor={setFiltro2} 
            opciones={opcionesFiltro2} 
            placeholder={placeholderFiltro2}
          />
        )}

        {opcionesFiltro3 && (
          <DropdownFiltro 
            valor={filtro3} 
            setValor={setFiltro3} 
            opciones={opcionesFiltro3} 
            placeholder={placeholderFiltro3}
          />
        )}

        <input
          type="text"
          placeholder={placeholderBuscar}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-[var(--snow)] text-[var(--noir)] border border-[var(--border-gold-40)] rounded-[2px] px-3.5 py-2 text-sm lg:text-sm font-body w-full sm:flex-1 sm:min-w-0 max-w-md h-10 outline-none hover:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all shadow-sm placeholder:text-[var(--noir-soft)] dark:bg-[var(--noir-soft)] dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:hover:border-[var(--gold)] dark:focus:ring-[var(--gold)] dark:placeholder-[var(--ash)]"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto shrink-0">
        {textoBoton2 && accionBoton2 && (
          <button 
            onClick={accionBoton2}
            className="bg-transparent text-[var(--noir-soft)] border border-[var(--border-gold-40)] rounded-[2px] px-5 py-2 font-bold font-body text-sm lg:text-sm cursor-pointer hover:border-[var(--gold)] hover:bg-[var(--gold-08)] transition-all active:scale-95 w-full sm:w-auto whitespace-nowrap dark:text-[var(--snow)] dark:border-[var(--border-gold-20)] dark:hover:border-[var(--gold)] dark:hover:bg-[var(--gold-08)]"
          >
            {textoBoton2}
          </button>
        )}

        {textoBoton && accionBoton && (
          <button 
            onClick={accionBoton}
            className="bg-[var(--gold)] text-[var(--noir)] border-none rounded-[2px] px-5 py-2 font-bold font-body text-sm lg:text-sm cursor-pointer hover:bg-[var(--gold-dark)] hover:text-[var(--snow)] hover:scale-[1.02] transition-all active:scale-95 w-full sm:w-auto whitespace-nowrap shadow-sm"
          >
            {textoBoton}
          </button>
        )}
      </div>
      
    </div>
  );
}