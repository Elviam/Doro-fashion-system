import { useState } from 'react';
import Toast from './Toast';

export default function ModalResetPassword({ onClose, onUserSubmitted }) {
  const [usuario, setUsuario] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'error' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuario.trim()) {
      setToast({ message: 'Ingresa tu usuario', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario: usuario.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setToast({ message: 'Usuario no encontrado', type: 'error' });
        } else if (response.status === 403) {
          // Es un usuario no-cliente, mostrar modal de admin
          onUserSubmitted(null, 'ADMIN_REQUIRED');
        } else {
          setToast({ message: result.message || 'Error al procesar la solicitud', type: 'error' });
        }
      } else {
        // Usuario cliente, mostrar modal para código
        onUserSubmitted(usuario.trim(), 'CLIENTE');
      }
    } catch (error) {
      setToast({ message: error.message || 'Error al procesar la solicitud', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'error' })}
      />
      
      <dialog id="reset_password_usuario_modal" className="modal">
        <div className="modal-box bg-oscuro/60 backdrop-blur-md border border-lila/30 text-lila p-8 sm:p-10 max-w-lg rounded-none shadow-2xl">
          <form method="dialog">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost absolute right-6 top-6 text-xl">
              <i className="bi bi-x-lg"></i>
            </button>
          </form>

          <div className="mb-8">
            <div className="w-14 h-14 rounded-full border border-lila flex items-center justify-center">
              <i className="bi bi-key text-2xl"></i>
            </div>
          </div>

          <h3 className="font-poppins text-2xl tracking-widest border-b border-lila/30 pb-4 mb-8 leading-snug">
            RECUPERAR <br/> CONTRASEÑA
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="usuario" className="text-sm font-poppins text-lila-mid">
                Ingresa tu usuario
              </label>
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="tu_usuario"
                disabled={loading}
                className="w-full bg-oscuro text-lila border border-lila/30 rounded-lg px-4 py-2.5 text-sm font-poppins outline-none placeholder-lila/20 focus:border-lila/60 focus:ring-1 focus:ring-lila/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lila text-oscuro font-bold text-sm rounded-lg py-2.5 hover:bg-lila-soft transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><i className="bi bi-arrow-repeat animate-spin" />Verificando...</>
              ) : (
                <><i className="bi bi-check-circle" />Continuar</>
              )}
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-6">
            Recibirás un código en tu correo electrónico
          </p>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>cerrar</button>
        </form>
      </dialog>
    </>
  );
}
