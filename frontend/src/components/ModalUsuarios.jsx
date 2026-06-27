import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import AvatarUser from "./AvatarUser";

export default function ModalUsuarios({ data, usuarioLogeado, onClose, onEditar, onEliminar, isOpen = true }) {
  if (!data) return null;

  const estadoTexto = data.activo !== false ? "Activo" : "Inactivo";
  const esElMismoUsuario = data.id === usuarioLogeado?.id;
  
  // Lógica de permisos
  const esAdminOGerente = usuarioLogeado?.roleId === "role_admin" || usuarioLogeado?.roleId === "GERENTE";
  const puedeEditar = esAdminOGerente;
  const puedeEliminar = esAdminOGerente && !esElMismoUsuario; 

  //Header
  const tituloPersonalizado = (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 uppercase tracking-widest transition-colors text-morado dark:text-blanco m-0">
        Perfil de Usuario
      </h2>
    </div>
  );

  // Footer
  const footerAcciones = (
    <div className="flex justify-between items-center w-full">
      <div>
        {esElMismoUsuario && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-morado bg-morado/10 px-3 py-1.5 rounded-lg dark:text-lila-soft dark:bg-lila/10 flex items-center gap-1">
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
      <div className="font-poppins pt-2 pb-4">
        
        {/* Perfil */}
        <div className="flex flex-col items-center justify-center text-center mb-8 bg-lila/5 dark:bg-oscuro/20 p-6 rounded-3xl border border-morado/10 dark:border-lila/10">
          <div className="mb-4">
            <AvatarUser nombre={data.nombre} apellido={data.apellido} rol={data.role || data.roleId} size="xl" />
          </div>
          <h3 className="text-2xl font-bold mb-1 text-oscuro dark:text-blanco">{data.nombre} {data.apellido}</h3>
          <p className="text-sm font-mono uppercase tracking-widest text-gris dark:text-lila-soft mb-5">
            @{data.usuario}
          </p>
          <div className="flex gap-2">
            <Etiquetas contenido={data.role || data.roleId || "Sin rol"} />
            <Etiquetas contenido={estadoTexto} />
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Correo Electrónico</p>
            <p className="text-sm font-semibold truncate text-oscuro dark:text-blanco">{data.email || "—"}</p>
          </div>

          <div className="rounded-2xl p-4 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-2">Fecha de Creación</p>
            <p className="text-sm font-semibold truncate text-oscuro dark:text-blanco">
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString("es-MX") : "—"}
            </p>
          </div>

          {/* Permisos */}
          {data.permissions && data.permissions.length > 0 && (
            <div className="sm:col-span-2 rounded-2xl p-5 border transition-colors shadow-sm bg-blanco border-morado/20 dark:bg-[#1E1A35] dark:border-lila/20 dark:shadow-none mt-2">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gris dark:text-lila-soft mb-4 flex items-center gap-2">
                <i className="bi bi-shield-check text-sm"></i> Permisos Asignados ({data.permissions.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {data.permissions.map((permission, index) => (
                  <div 
                    key={index}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                      bg-lila-pastel border-morado/10 text-morado
                      dark:bg-lila/5 dark:border-lila/20 dark:text-lila-soft
                    `}
                  >
                    <i className="bi bi-check-circle-fill text-verde text-[10px]"></i>
                    <span className="font-mono text-xs truncate">{permission}</span>
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