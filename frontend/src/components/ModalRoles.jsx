import Modal from "./Modal";
import Boton from "./Boton";
import AvatarUser from "./AvatarUser";

export default function ModalRoles({ rol, onClose, onEditar, onEliminar, onGestionarPermisos, isOpen = true }) {
  if (!rol) return null;

  const agruparPermisos = (permisosArray) => {
    if (!permisosArray || permisosArray.length === 0) return {};
    return permisosArray.reduce((acc, perm) => {
      const partes = perm.split(':');
      const modulo = partes.length > 1 ? partes[0] : 'Otros';
      const accion = partes.length > 1 ? partes[1] : perm;
      
      if (!acc[modulo]) acc[modulo] = [];
      acc[modulo].push(accion);
      return acc;
    }, {});
  };

  const permisosAgrupados = agruparPermisos(rol.permissions);

  // Header
  const tituloPersonalizado = (
    <div>
      <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 uppercase tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0">
        Resumen del Rol
      </h2>
      <p className="text-xs sm:text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] transition-colors font-body font-normal tracking-normal normal-case">
        Detalles generales y nivel de acceso.
      </p>
    </div>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-between items-center w-full">
      <Boton variante="secundario" onClick={() => onEliminar(rol)}>
        <i className="bi bi-trash"></i> Eliminar
      </Boton>
      <div className="flex gap-3">
        <Boton variante="oscuro" onClick={() => onEditar(rol)}>
          <i className="bi bi-pencil-square"></i> Editar Rol
        </Boton>
        <Boton variante="claro" onClick={() => onGestionarPermisos(rol)}>
          <i className="bi bi-shield-lock"></i> Gestionar Permisos
        </Boton>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      ancho="max-w-3xl" 
      titulo={tituloPersonalizado}
      footer={footerAcciones}
    >
      <div className="font-body pt-2 pb-4">
        <div className="flex flex-col gap-6">
          
          {/* Perfil */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-[2px] border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none">
            <AvatarUser nombre={rol.nombre} rol={rol.nombre} size="xl" />
            
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full mt-2">
              <h3 className="text-2xl lg:text-3xl font-display font-bold text-[var(--noir)] dark:text-[var(--snow)] mb-2">{rol.nombre || "—"}</h3>
              <p className="text-sm lg:text-base text-[var(--noir-soft)] dark:text-[var(--ash)] mb-4">
                {rol.descripcion || "Sin descripción asignada a este rol."}
              </p>
              
              <div className="flex flex-wrap gap-3 mt-auto">
                <span className="px-3 py-1.5 rounded-[2px] border text-xs lg:text-sm font-semibold bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
                  <i className="bi bi-calendar-check mr-1.5"></i>
                  Creado: {rol.createdAt ? new Date(rol.createdAt).toLocaleDateString("es-MX") : "—"}
                </span>
                <span className="px-3 py-1.5 rounded-[2px] border text-xs lg:text-sm font-semibold bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
                  <i className="bi bi-key mr-1.5"></i>
                  {rol.permissions?.length || 0} permisos
                </span>
              </div>
            </div>
          </div>

          {/* Permisos */}
          <div>
            <h4 className="text-xs lg:text-sm font-tag uppercase tracking-[0.2em] font-bold text-[var(--gold-dark)] dark:text-[var(--ash)] mb-4 pl-1">
              Desglose de Permisos
            </h4>
            
            {Object.keys(permisosAgrupados).length > 0 ? (
              <div className="flex flex-col gap-3">
                {Object.entries(permisosAgrupados).map(([modulo, acciones]) => (
                  <div key={modulo} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[2px] border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-25)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:shadow-none">
                    
                    <div className="sm:w-1/4 shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] pb-2 sm:pb-0 pr-0 sm:pr-4">
                      <p className="text-sm lg:text-base font-bold capitalize text-[var(--noir)] dark:text-[var(--gold-light)] flex items-center gap-2">
                        <i className="bi bi-box text-[var(--gold-dark)]/60 dark:text-[var(--ash)]"></i> {modulo}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 flex-1">
                      {acciones.map((accion, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-[2px] text-[11px] lg:text-xs font-mono font-medium transition-colors bg-[var(--gold-08)] text-[var(--gold-dark)] border border-[var(--border-gold-25)] dark:bg-[var(--noir-soft)] dark:text-[var(--ash)] dark:border-[var(--border-gold-20)]">
                          {accion}
                        </span>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[2px] p-8 text-center border bg-[var(--gold-08)] border-[var(--border-gold-25)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">
                <i className="bi bi-shield-slash text-4xl text-[var(--noir-soft)]/40 dark:text-[var(--ash)]/30 mb-3 block"></i>
                <p className="text-sm lg:text-base font-medium text-[var(--noir-soft)] dark:text-[var(--ash)]">Este rol tiene acceso restringido.</p>
                <p className="text-xs lg:text-sm text-[var(--noir-soft)]/70 dark:text-[var(--ash)]/60 mt-1">No cuenta con permisos asignados.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Modal>
  );
}