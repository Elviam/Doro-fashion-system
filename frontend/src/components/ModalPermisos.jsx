import { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Boton from "./Boton";
import Etiquetas from "./Etiquetas";
import ModalConfirmacion from "./ModalConfirmacion";

export default function ModalPermisos({ isOpen = true, onClose, rol, permisos, onActualizar }) {
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("Todos los módulos");
  
  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const [estadoOriginal, setEstadoOriginal] = useState("");

  useEffect(() => {
    if (rol?.permissions) {
      setPermisosSeleccionados([...rol.permissions]);
      setEstadoOriginal(JSON.stringify([...rol.permissions].sort()));
    } else {
      setPermisosSeleccionados([]);
      setEstadoOriginal("[]");
    }
    // Limpiamos los filtros al abrir
    setBusqueda("");
    setModuloFiltro("Todos los módulos");
  }, [rol, isOpen]);

  // Intentar cerrar el modal
  const handleIntentarCerrar = () => {
    const estadoActual = JSON.stringify([...permisosSeleccionados].sort());
    if (estadoActual !== estadoOriginal) {
      setConfirmarDescartar(true);
    } else {
      if (typeof onClose === 'function') onClose();
    }
  };

  // Escuchar la tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === "Escape" && isOpen && !confirmarDescartar) {
        handleIntentarCerrar();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmarDescartar, permisosSeleccionados, estadoOriginal, onClose]);

  // Obtener módulos para el select
  const modulos = ["Todos los módulos", ...new Set(permisos.map(p => p.modulo || "Otros"))].sort();

  // Filtrar permisos
  const permisosFiltrados = permisos.filter(p => {
    const coincideBusqueda = busqueda === "" || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.code.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideModulo = moduloFiltro === "Todos los módulos" || p.modulo === moduloFiltro;
    return coincideBusqueda && coincideModulo;
  });

  const handleTogglePermiso = (code) => {
    setPermisosSeleccionados(prev => 
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    );
  };

  const handleSeleccionarTodos = () => {
    if (permisosSeleccionados.length === permisosFiltrados.length && permisosFiltrados.length > 0) {
      // Deseleccionar todos
      setPermisosSeleccionados(prev => prev.filter(p => !permisosFiltrados.find(pf => pf.code === p)));
    } else {
      // Seleccionar todos
      const nuevosPermisos = [...permisosSeleccionados];
      permisosFiltrados.forEach(p => {
        if (!nuevosPermisos.includes(p.code)) nuevosPermisos.push(p.code);
      });
      setPermisosSeleccionados(nuevosPermisos);
    }
  };

  const handleGuardarClick = (e) => {
    e.preventDefault();
    onActualizar(permisosSeleccionados);
  };

  const todosSeleccionados = permisosFiltrados.length > 0 && 
    permisosFiltrados.every(p => permisosSeleccionados.includes(p.code));

  if (!rol) return null;

  // Header
  const tituloPersonalizado = (
    <div>
      <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 uppercase tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0">
        Gestionar Permisos
      </h2>
      <p className="text-xs sm:text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors font-body font-normal tracking-normal normal-case">
        Rol: <strong className="text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{rol.nombre}</strong>
      </p>
    </div>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-between items-center w-full">
      <div className="text-xs lg:text-sm font-semibold text-[var(--noir-soft)] dark:text-[var(--ash)]">
        Seleccionados: <span className="text-[var(--gold-dark)] dark:text-[var(--gold-light)] font-bold text-sm lg:text-base">{permisosSeleccionados.length}</span> de {permisos.length}
      </div>
      <div className="flex gap-3">
        <Boton variante="secundario" onClick={handleIntentarCerrar} tipo="button">
          <i className="bi bi-x-lg"></i> Cancelar
        </Boton>
        <Boton variante="claro" onClick={handleGuardarClick} tipo="button">
          <i className="bi bi-save"></i> Guardar Permisos
        </Boton>
      </div>
    </div>
  );

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleIntentarCerrar} 
        ancho="max-w-4xl" 
        titulo={tituloPersonalizado}
        footer={footerAcciones}
      >
        <div className="font-body pt-2 pb-4">
          
          {/* Buscador y Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-[2px] border transition-colors shadow-sm bg-[var(--gold-08)] border-[var(--border-gold-25)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:shadow-none">
            <Input 
              label="Buscar Permiso" 
              name="busqueda" 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              placeholder="Buscar por nombre o código..." 
            />
            <Input 
              label="Filtrar por Módulo" 
              name="modulo" 
              tipo="select"
              opciones={modulos}
              value={moduloFiltro} 
              onChange={(e) => setModuloFiltro(e.target.value)} 
            />
          </div>

          {/* Permisos */}
          <div className="border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] rounded-[2px] overflow-hidden shadow-sm flex flex-col h-[50vh]">
            
            <div className="bg-[var(--gold-08)] dark:bg-[var(--noir)] p-3 border-b border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] flex justify-between items-center shrink-0">
              <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={handleSeleccionarTodos}
                  disabled={permisosFiltrados.length === 0}
                  className="w-4 h-4 rounded-[2px] cursor-pointer accent-[var(--gold-dark)] dark:accent-[var(--gold-light)]"
                />
                <span className="text-xs lg:text-sm font-tag font-bold uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">
                  {todosSeleccionados ? "Deseleccionar Todos" : "Seleccionar Todos"}
                </span>
              </label>
              <span className="text-xs lg:text-sm text-[var(--noir-soft)] dark:text-[var(--ash)] font-medium">
                Mostrando {permisosFiltrados.length} permisos
              </span>
            </div>

            {/* Scroll de Permisos */}
            <div className="p-4 overflow-y-auto bg-[var(--snow)] dark:bg-[var(--noir-soft)] flex-1">
              {permisosFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permisosFiltrados.map(permiso => {
                    const isChecked = permisosSeleccionados.includes(permiso.code);
                    return (
                      <label
                        key={permiso.code}
                        className={`
                          flex items-start gap-3 p-3 rounded-[2px] border transition-all cursor-pointer shadow-sm
                          ${isChecked 
                            ? 'bg-[var(--gold-08)] border-[var(--border-gold-55)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-40)]' 
                            : 'bg-[var(--snow)] border-[var(--border-gold-25)] hover:border-[var(--border-gold-55)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:hover:border-[var(--border-gold-40)]'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermiso(permiso.code)}
                          className="mt-1 w-4 h-4 rounded-[2px] cursor-pointer accent-[var(--gold-dark)] dark:accent-[var(--gold-light)] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm lg:text-base font-bold truncate ${isChecked ? 'text-[var(--gold-dark)] dark:text-[var(--gold-light)]' : 'text-[var(--noir)] dark:text-[var(--snow)]'}`}>
                              {permiso.nombre}
                            </span>
                            <Etiquetas contenido={permiso.modulo || "Otros"} />
                          </div>
                          {permiso.descripcion && (
                            <p className="text-[11px] lg:text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] leading-tight mb-1">
                              {permiso.descripcion}
                            </p>
                          )}
                          <p className="text-[10px] lg:text-[11px] font-mono text-[var(--noir-soft)] dark:text-[var(--ash)]">
                            {permiso.code}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--noir-soft)] dark:text-[var(--ash)] py-10">
                  <i className="bi bi-search text-3xl mb-3 opacity-50"></i>
                  <p className="text-sm lg:text-base font-medium">No se encontraron permisos</p>
                  <p className="text-xs lg:text-sm mt-1">Intenta con otra búsqueda o módulo</p>
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
          mensaje="Modificaste los permisos de este rol pero no los has guardado. ¿Deseas salir de todas formas?"
          textoConfirmar="Descartar"
          textoCancelar="Seguir editando"
          onConfirmar={(e) => {
            if (e) e.preventDefault();
            setConfirmarDescartar(false);
            if (typeof onClose === 'function') onClose();
          }}
          onCancelar={(e) => {
            if (e) e.preventDefault();
            setConfirmarDescartar(false);
          }}
        />
      )}
    </>
  );
}