import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import Toast from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import useTitulo from '../hooks/useTitulo';
import { hasPermission, normalizeAuthenticatedUser } from '../utils/accessControl';

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

const StaffLoginStyles = () => (
  <style>{`
    .staff-login-root {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--noir);
      background-image:
        radial-gradient(circle at 20% 20%, rgba(201,168,76,0.05) 0%, transparent 45%),
        radial-gradient(circle at 80% 80%, rgba(201,168,76,0.04) 0%, transparent 45%);
      box-sizing: border-box;
      padding: 32px 24px;
      gap: 20px;
    }

    .staff-login-restricted-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--gold);
      opacity: 0.85;
    }
    .staff-login-restricted-tag svg { opacity: 0.9; }

    .staff-login-card {
      width: 100%;
      max-width: 520px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
      background: var(--ivory);
      border: 1px solid rgba(201,168,76,0.25);
      border-radius: 2px;
      padding: 48px 56px;
      box-sizing: border-box;
      box-shadow: 0 24px 64px rgba(0,0,0,0.45);
    }

    .staff-login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .staff-login-logo-mark {
      font-family: var(--font-display);
      font-size: 30px;
      font-weight: 300;
      font-style: italic;
      color: var(--noir);
      letter-spacing: 0.03em;
    }
    .staff-login-logo-mark span { color: var(--gold-dark); }

    .staff-login-gold-line {
      display: block;
      width: 60px;
      height: 1px;
      margin: 0 auto 24px;
      background: linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%);
    }

    .staff-login-tag {
      text-align: center;
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #5C4A2A;
      margin: 0 0 8px;
    }

    .staff-login-title {
      text-align: center;
      font-family: var(--font-display);
      font-size: clamp(24px, 3vw, 28px);
      font-weight: 300;
      font-style: italic;
      color: var(--noir);
      margin: 0 0 36px;
      line-height: 1.2;
    }

    .staff-login-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }

    .staff-login-label {
      display: block;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #4A3F37;
      margin-bottom: 8px;
    }

    .staff-login-input {
      width: 100%;
      padding: 14px 16px;
      background: #FEFEFE;
      border: 1px solid var(--border-gold-25);
      border-radius: 2px;
      font-family: var(--font-body);
      font-size: 16px;
      color: var(--noir);
      outline: none;
      transition: border-color 0.25s, box-shadow 0.25s;
      box-sizing: border-box;
      -webkit-appearance: none;
    }
    .staff-login-input::placeholder { color: rgba(80,70,60,0.35); }
    .staff-login-input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px var(--gold-08);
    }
    .staff-login-input.error { border-color: #b94040; }
    .staff-login-input:disabled { opacity: 0.55; cursor: not-allowed; }

    .staff-login-error {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.1em;
      color: #b94040;
      margin-top: 6px;
      text-transform: uppercase;
    }

    .staff-login-btn-primary {
      width: 100%;
      padding: 15px 24px;
      background: var(--noir);
      color: var(--gold-light);
      border: 1px solid var(--noir);
      border-radius: 2px;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .staff-login-btn-primary:hover:not(:disabled) {
      background: var(--gold-dark);
      border-color: var(--gold-dark);
      color: var(--ivory);
      transform: translateY(-1px);
    }
    .staff-login-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .staff-login-ghost {
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #5C4A2A;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }
    .staff-login-ghost:hover { color: var(--noir); }

    .staff-login-footer {
      text-align: center;
      font-family: var(--font-tag);
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(201,168,76,0.45);
    }

    @media (max-width: 640px) {
      .staff-login-card { padding: 40px 32px; max-height: calc(100vh - 120px); }
      .staff-login-form-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .staff-login-root { padding: 24px 16px; gap: 16px; }
      .staff-login-card { padding: 36px 24px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

const staffLoginSchema = z.object({
  usuario:  z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const LOGIN_TIMEOUT_MS = 12_000;

function getHttpLoginErrorMessage(status, result) {
  if (status === 503) {
    return 'El servicio no está disponible temporalmente. Intenta de nuevo en unos minutos.';
  }

  if (status >= 500) {
    return 'El servidor no está disponible temporalmente. Intenta de nuevo en unos minutos.';
  }

  return result?.message || 'No se pudo iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.';
}

function getConnectionErrorMessage(error) {
  if (error?.name === 'AbortError') {
    return 'La conexión tardó demasiado. Intenta nuevamente.';
  }

  if (navigator.onLine === false || error instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }

  return 'No fue posible completar el inicio de sesión. Intenta nuevamente.';
}

export default function StaffLogin() {
  useTitulo("Acceso Administrativo — D'oro");

  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState({ message: '', type: 'error' });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
  } = useForm({ resolver: zodResolver(staffLoginSchema) });

  // Esta ruta siempre muestra el formulario. Una sesión de cliente solo se
  // reemplaza cuando las credenciales de staff son válidas.

  const onSubmit = async (data) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/staff-login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario: data.usuario, password: data.password }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setToast({ message: getHttpLoginErrorMessage(response.status, result), type: 'error' });
        return;
      }

      if (!result?.token) {
        setToast({
          message: 'El servidor devolvió una respuesta inválida. Intenta nuevamente.',
          type: 'error',
        });
        return;
      }

      const user = normalizeAuthenticatedUser(result.user ?? {});
      login(result.token, user);
      const destination = hasPermission(user, 'dashboard:read')
        ? '/dashboard'
        : hasPermission(user, 'recepciones:read')
          ? '/recepciones'
          : hasPermission(user, 'fulfillment:read')
            ? '/preparar-pedidos'
            : '/perfil';
      navigate(destination);
    } catch (err) {
      setToast({ message: getConnectionErrorMessage(err), type: 'error' });
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const showContactModal = (e) => {
    e.preventDefault();
    document.getElementById('staff_contact_admin_modal').showModal();
  };

  const isBusy = isSubmitting || loading;

  return (
    <>
      <FontLoader />
      <StaffLoginStyles />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'error' })}
      />

      <div className="staff-login-root">

        <span className="staff-login-restricted-tag">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Acceso restringido a personal autorizado
        </span>

        <div className="staff-login-card">

          <div className="staff-login-logo">
            <span className="staff-login-logo-mark">D<span>'</span>oro</span>
          </div>
          <span className="staff-login-gold-line" />

          <h1 className="staff-login-tag">Panel Administrativo</h1>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="staff-login-form-grid">

              <div>
                <label className="staff-login-label" htmlFor="staff-usuario">Usuario</label>
                <input
                  id="staff-usuario"
                  type="text"
                  autoComplete="username"
                  disabled={isBusy}
                  className={`staff-login-input${formErrors.usuario ? ' error' : ''}`}
                  {...register('usuario')}
                />
                {formErrors.usuario && <p className="staff-login-error">{formErrors.usuario.message}</p>}
              </div>

              <div>
                <label className="staff-login-label" htmlFor="staff-password">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="staff-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isBusy}
                    className={`staff-login-input${formErrors.password ? ' error' : ''}`}
                    style={{ paddingRight: '44px' }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9C8B79', lineHeight: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                  </button>
                </div>
                {formErrors.password && <p className="staff-login-error">{formErrors.password.message}</p>}
              </div>
            </div>

            <div style={{ paddingTop: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button type="submit" disabled={isBusy} className="staff-login-btn-primary">
                {isBusy ? (
                  <>
                    <span style={{
                      width: '12px', height: '12px',
                      border: '1.5px solid currentColor', borderTopColor: 'transparent',
                      borderRadius: '50%', display: 'inline-block',
                      animation: 'staffSpin 0.7s linear infinite',
                    }} />
                    Verificando...
                  </>
                ) : 'Ingresar'}
              </button>

              <div className="rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-3 text-left text-xs text-[var(--noir-soft)]">
                <p className="font-semibold text-[var(--noir)]">¿No recuerdas tu contraseña actual?</p>
                <p className="mt-1">Contacta al área de sistemas para solicitar un restablecimiento de contraseña.</p>
              </div>
            </div>
          </form>
        </div>

        <p className="staff-login-footer">D'oro · Sistema Interno de Gestión</p>
      </div>

      {/* Contact admin modal — sin cambios, se queda igual */}
      <dialog id="staff_contact_admin_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box" style={{
          background: 'var(--ivory)', border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: '2px', maxWidth: '440px', width: '100%',
          padding: '44px 40px', boxSizing: 'border-box', color: 'var(--noir)',
        }}>
          <form method="dialog">
            <button
              type="button"
              onClick={() => document.getElementById('staff_contact_admin_modal').close()}
              style={{
                position: 'absolute', top: '18px', right: '18px', background: 'none',
                border: 'none', cursor: 'pointer', color: 'var(--ash)', width: '32px', height: '32px',
              }}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>

          <p style={{
            fontFamily: 'var(--font-tag)', fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'var(--gold-dark)', margin: '0 0 12px',
          }}>
            Recuperación de contraseña
          </p>

          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 300,
            color: 'var(--noir)', margin: '0 0 20px', lineHeight: 1.2,
          }}>
            Contacta al área de Sistemas
          </h3>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--noir-soft)', lineHeight: 1.7, margin: 0 }}>
            Por seguridad, el restablecimiento de contraseñas de personal solo puede realizarlo el administrador del sistema. Comunícate con el área de Sistemas o Soporte Técnico de tu organización.
          </p>
        </div>

        <form method="dialog" className="modal-backdrop" style={{ background: 'rgba(13,13,13,0.55)', backdropFilter: 'blur(4px)' }}>
          <button onClick={() => document.getElementById('staff_contact_admin_modal').close()}>cerrar</button>
        </form>
      </dialog>

      <style>{`@keyframes staffSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
