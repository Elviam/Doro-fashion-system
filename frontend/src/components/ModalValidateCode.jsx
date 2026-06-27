import { useState } from 'react';
import Toast from './Toast';

export default function ModalValidateCode({ usuario, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'error' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim() || !newPassword || !confirmPassword) {
      setToast({ message: 'Completa todos los campos', type: 'error' });
      return;
    }

    if (code.trim().length !== 6) {
      setToast({ message: 'El código debe tener 6 dígitos', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/validate-and-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario,
          code: code.trim(),
          newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setToast({ message: result.message || 'Error al cambiar la contraseña', type: 'error' });
      } else {
        setToast({ message: 'Contraseña actualizada exitosamente', type: 'success' });
        setTimeout(() => {
          onSuccess();
        }, 1500);
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

      <dialog id="validate_code_modal" className="modal">
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
              <i className="bi bi-shield-check text-2xl"></i>
            </div>
          </div>

          <h3 className="font-poppins text-2xl tracking-widest border-b border-lila/30 pb-4 mb-8 leading-snug">
            VERIFICAR <br/> CÓDIGO
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="text-sm font-poppins text-lila-mid">
                Código de verificación
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                className="w-full bg-oscuro text-lila border border-lila/30 rounded-lg px-4 py-2.5 text-sm font-poppins outline-none placeholder-lila/20 focus:border-lila/60 focus:ring-1 focus:ring-lila/15 transition-all text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-text-muted">Revisa tu correo electrónico</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="text-sm font-poppins text-lila-mid">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-oscuro text-lila border border-lila/30 rounded-lg px-4 py-2.5 text-sm font-poppins outline-none placeholder-lila/20 focus:border-lila/60 focus:ring-1 focus:ring-lila/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-lila-mid transition-colors">
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-poppins text-lila-mid">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-oscuro text-lila border border-lila/30 rounded-lg px-4 py-2.5 text-sm font-poppins outline-none placeholder-lila/20 focus:border-lila/60 focus:ring-1 focus:ring-lila/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lila text-oscuro font-bold text-sm rounded-lg py-2.5 hover:bg-lila-soft transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><i className="bi bi-arrow-repeat animate-spin" />Procesando...</>
              ) : (
                <><i className="bi bi-check-circle" />Cambiar contraseña</>
              )}
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-6">
            El código expira en 15 minutos
          </p>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={onClose}>cerrar</button>
        </form>
      </dialog>
    </>
  );
}
