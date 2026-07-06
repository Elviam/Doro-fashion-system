import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import AvatarUser from "./AvatarUser";

export default function ModalUsuarios({ data, usuarioLogeado, onClose, onEditar, onEliminar, isOpen = true }) {
  if (!data) return null;

  const estadoTexto = data.activo !== false ? "Activo" : "Inactivo";
  const esElMismoUsuario = data.id === usuarioLogeado?.id;
  
  // Lógica de permisos
  const esAdminOGerente = usuarioLogeado?.role === "ADMIN" || usuarioLogeado?.role === "GERENTE";
  const puedeEditar = esAdminOGerente;
  const puedeEliminar = esAdminOGerente && !esElMismoUsuario; 

  //Header
  const tituloPersonalizado = (
    <div>
      <h2 className="font-display text-xl lg:text-2xl font-bold mb-1 uppercase tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0">
        Perfil de Usuario
      </h2>
    </div>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-between items-center w-full">
      <div>
        {esElMismoUsuario && (
          <span className="font-tag text-[10px] lg:text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)] bg-[var(--gold-08)] px-3 py-1.5 rounded-[2px] dark:text-[var(--gold-light)] dark:bg-[var(--gold-08)] flex items-center gap-1">
            <i className="bi bi-person-badge"></i> Tu cuenta
          </span>
        )}
      </div>
      <div className="flex gap-3">
        {puedeEliminar && (
          <Boton variante="secundario" onClick={() => onEliminar(data)}>
            <i className="bi bi-trash"></i> Eliminar
          </Boton>
        )}
        {puedeEditar && (
          <Boton variante="claro" onClick={() => onEditar(data)}>
            <i className="bi bi-pencil-square"></i> Editar
          </Boton>
        )}
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      ancho="max-w-2xl" 
      titulo={tituloPersonalizado}
      footer={footerAcciones}
    >
      <div className="font-body pt-2 pb-4">
        
        {/* Perfil */}
        <div className="flex flex-col items-center justify-center text-center mb-8 bg-[var(--gold-08)] dark:bg-[var(--noir)] p-6 rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]">
          <div className="mb-4">
            <AvatarUser nombre={data.nombre} apellido={data.apellido} rol={data.role || data.roleId} size="xl" />
          </div>
          <h3 className="font-display text-xl lg:text-2xl font-bold mb-1 text-[var(--noir)] dark:text-[var(--snow)]">{data.nombre} {data.apellido}</h3>
          <p className="font-tag text-sm lg:text-base uppercase tracking-widest text-[var(--noir-soft)] dark:text-[var(--ash)] mb-5">
            @{data.usuario}
          </p>
          <div className="flex gap-2">
            <Etiquetas contenido={data.role || data.roleId || "Sin rol"} />
            <Etiquetas contenido={estadoTexto} />
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none">
            <p className="font-tag text-[10px] lg:text-xs uppercase tracking-[0.2em] font-bold text-[var(--noir-soft)] dark:text-[var(--ash)] mb-2">Correo Electrónico</p>
            <p className="font-body text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">{data.email || "—"}</p>
          </div>

          <div className="rounded-[2px] p-4 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none">
            <p className="font-tag text-[10px] lg:text-xs uppercase tracking-[0.2em] font-bold text-[var(--noir-soft)] dark:text-[var(--ash)] mb-2">Fecha de Creación</p>
            <p className="font-body text-sm lg:text-base font-semibold truncate text-[var(--noir)] dark:text-[var(--snow)]">
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString("es-MX") : "—"}
            </p>
          </div>

          {/* Permisos */}
          {data.permissions && data.permissions.length > 0 && (
            <div className="sm:col-span-2 rounded-[2px] p-5 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none mt-2">
              <p className="font-tag text-[10px] lg:text-xs uppercase tracking-[0.2em] font-bold text-[var(--noir-soft)] dark:text-[var(--ash)] mb-4 flex items-center gap-2">
                <i className="bi bi-shield-check text-sm"></i> Permisos Asignados ({data.permissions.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {data.permissions.map((permission, index) => (
                  <div 
                    key={index}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-[2px] border transition-all
                      bg-[var(--gold-08)] border-[var(--border-gold-25)] text-[var(--gold-dark)]
                      dark:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]
                    `}
                  >
                    <i className="bi bi-check-circle-fill text-green-700 dark:text-verde text-[10px]"></i>
                    <span className="font-tag text-xs lg:text-sm truncate">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Modal>
  );
}