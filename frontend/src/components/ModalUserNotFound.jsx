export default function ModalUserNotFound({ onClose }) {
  return (
    <dialog id="user_not_found_modal" className="modal">
      <div className="modal-box bg-oscuro/60 backdrop-blur-md border border-rojo/30 text-lila p-8 sm:p-10 max-w-lg rounded-none shadow-2xl">
        <form method="dialog">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-6 top-6 text-xl">
            <i className="bi bi-x-lg"></i>
          </button>
        </form>

        <div className="mb-8">
          <div className="w-14 h-14 rounded-full border border-rojo flex items-center justify-center">
            <i className="bi bi-exclamation-circle text-2xl text-rojo"></i>
          </div>
        </div>

        <h3 className="font-poppins text-2xl tracking-widest border-b border-rojo/30 pb-4 mb-8 leading-snug text-rojo">
          USUARIO NO <br/> ENCONTRADO
        </h3>

        <div className="font-poppins space-y-4 text-[15px] leading-relaxed text-center px-2">
          <p>
            No encontramos una cuenta asociada a este usuario.
          </p>
          <p className="text-sm text-text-muted">
            Verifica que el usuario sea correcto e intenta de nuevo.
          </p>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-lila text-oscuro font-bold text-sm rounded-lg py-2.5 hover:bg-lila-soft transition-all">
            Volver
          </button>
        </div>

        <div className="mt-8 font-cinzel tracking-widest text-xl opacity-90">
          A U R A
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>cerrar</button>
      </form>
    </dialog>
  );
}
