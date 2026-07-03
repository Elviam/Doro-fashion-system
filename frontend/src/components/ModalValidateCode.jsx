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
        <div className="modal-box bg-[var(--noir)]/60 backdrop-blur-md border border-[var(--border-gold-40)] text-[var(--snow)] p-8 sm:p-10 max-w-lg rounded-none shadow-2xl">
          <form method="dialog">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost absolute right-6 top-6 text-xl">
              <i className="bi bi-x-lg"></i>
            </button>
          </form>

          <div className="mb-8">
            <div className="w-14 h-14 rounded-full border border-[var(--border-gold-40)] flex items-center justify-center text-[var(--gold)]">
              <i className="bi bi-shield-check text-2xl"></i>
            </div>
          </div>

          <h3 className="font-display text-xl lg:text-2xl tracking-widest border-b border-[var(--border-gold-40)] pb-4 mb-8 leading-snug">
            VERIFICAR <br/> CÓDIGO
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="font-tag text-sm lg:text-base text-[var(--ash)]">
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
                className="font-body w-full bg-[var(--noir)] text-[var(--snow)] border border-[var(--border-gold-40)] rounded-[2px] px-4 py-2.5 text-sm lg:text-base outline-none placeholder-[var(--ash)]/30 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/15 transition-all text-center text-2xl tracking-widest"
              />
              <p className="font-body text-xs lg:text-sm text-[var(--ash)]">Revisa tu correo electrónico</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="font-tag text-sm lg:text-base text-[var(--ash)]">
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
                  className="font-body w-full bg-[var(--noir)] text-[var(--snow)] border border-[var(--border-gold-40)] rounded-[2px] px-4 py-2.5 text-sm lg:text-base outline-none placeholder-[var(--ash)]/30 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ash)] hover:text-[var(--gold)] transition-colors">
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="font-tag text-sm lg:text-base text-[var(--ash)]">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="font-body w-full bg-[var(--noir)] text-[var(--snow)] border border-[var(--border-gold-40)] rounded-[2px] px-4 py-2.5 text-sm lg:text-base outline-none placeholder-[var(--ash)]/30 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="font-tag w-full bg-[var(--gold)] text-[var(--noir)] font-bold text-sm lg:text-base rounded-[2px] py-2.5 hover:bg-[var(--gold-light)] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><i className="bi bi-arrow-repeat animate-spin" />Procesando...</>
              ) : (
                <><i className="bi bi-check-circle" />Cambiar contraseña</>
              )}
            </button>
          </form>

          <p className="font-body text-xs lg:text-sm text-[var(--ash)] text-center mt-6">
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