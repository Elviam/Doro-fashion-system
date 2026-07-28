import Modal from "./Modal";
import Etiquetas from "./Etiquetas";
import Boton from "./Boton";
import AvatarUser from "./AvatarUser";
import { canPerformAction } from "../utils/permissionMapper";
import { getPermissionLabel, RECURSOS_PERMISOS } from "./FormUsuarios";

const formatFechaCreacion = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ModalUsuarios({ data, usuarioLogeado, onClose, onEditar, onEliminar, isOpen = true }) {
  if (!data) return null;

  const estadoTexto = data.activo !== false ? "Activo" : "Inactivo";
  const esElMismoUsuario = data.id === usuarioLogeado?.id;
  
  const puedeEditar = canPerformAction(usuarioLogeado?.permissions, 'users', 'update');
  const puedeEliminar = canPerformAction(usuarioLogeado?.permissions, 'users', 'delete') && !esElMismoUsuario;
  const permisosAgrupados = (data.permissions || []).reduce((grupos, permission) => {
    const [recurso, accion] = permission.split(":");
    // El backend conserva estos permisos bajo "recepciones"; visualmente
    // separamos pedidos de recepción de mercancía por tipo de operación.
    const modulo = recurso === "recepciones" && !["confirm", "cancel"].includes(accion)
      ? "pedidos"
      : recurso;
    if (!grupos[modulo]) grupos[modulo] = [];
    grupos[modulo].push(permission);
    return grupos;
  }, {});

  //Header
  const tituloPersonalizado = (
    <div>
      <h2 className="font-display text-xl lg:text-2xl font-bold mb-1 uppercase tracking-widest transition-colors text-[var(--noir)] dark:text-[var(--snow)] m-0">
        Perfil del integrante
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
            {data.isPrimaryAdmin && <Etiquetas contenido="Administrador principal" />}
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
            <p className="font-body text-sm lg:text-base font-semibold text-[var(--noir)] dark:text-[var(--snow)]">
              {formatFechaCreacion(data.createdAt)}
            </p>
          </div>

          {/* Permisos */}
          {data.permissions && data.permissions.length > 0 && (
            <div className="sm:col-span-2 rounded-[2px] p-5 border transition-colors shadow-sm bg-[var(--snow)] border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:shadow-none mt-2">
              <p className="font-tag text-[10px] lg:text-xs uppercase tracking-[0.2em] font-bold text-[var(--noir-soft)] dark:text-[var(--ash)] mb-4 flex items-center gap-2">
                <i className="bi bi-shield-check text-sm"></i> Permisos Asignados ({data.permissions.length})
              </p>
              <div className="space-y-2">
                {Object.entries(permisosAgrupados).map(([recurso, permisos]) => (
                  <details key={recurso} className="group rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] dark:border-[var(--border-gold-20)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 font-tag text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)] [&::-webkit-details-marker]:hidden dark:text-[var(--gold-light)]">
                      <span className="flex items-center gap-2"><i className="bi bi-folder2-open text-sm"></i>{RECURSOS_PERMISOS[recurso] || recurso}</span>
                      <span className="flex items-center gap-2"><span className="text-[10px] normal-case tracking-normal opacity-75">{permisos.length}</span><i className="bi bi-chevron-down text-xs transition-transform group-open:rotate-180"></i></span>
                    </summary>
                    <div className="grid grid-cols-1 gap-2 border-t border-[var(--border-gold-20)] p-2 sm:grid-cols-2">
                      {permisos.map((permission) => (
                        <div key={permission} className="flex items-center gap-2 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--snow)] px-3 py-2 text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:bg-[var(--noir)] dark:text-[var(--gold-light)]">
                          <i className="bi bi-check-circle-fill text-[10px] text-green-700 dark:text-verde"></i>
                          <span className="font-tag text-xs lg:text-sm truncate">{getPermissionLabel(permission)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Modal>
  );
}
