import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import bgImage from '../assets/login.png';
import Toast from '../components/Toast';
import ModalResetPassword from '../components/ModalResetPassword';
import ModalValidateCode from '../components/ModalValidateCode';
import ModalUserNotFound from '../components/ModalUserNotFound';
import { useAuth } from '../hooks/useAuth';
import useTitulo from '../hooks/useTitulo';

// ---------------------------------------------------------------------------
// Fonts — same as Home
// ---------------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

// ---------------------------------------------------------------------------
// Scoped styles — animations + overrides
// ---------------------------------------------------------------------------
const LoginStyles = () => (
  <style>{`
    .login-root {
      display: flex;
      min-height: 100vh;
      width: 100%;
      overflow-x: hidden;
      background: var(--ivory);
      box-sizing: border-box;
    }

    /* ── Left panel (image) ── */
    .login-image-panel {
      position: relative;
      flex: 1 1 50%;
      overflow: hidden;
    }
    .login-image-panel img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .login-image-panel:hover img { transform: scale(1.03); }
    .login-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to right,
        rgba(13,13,13,0.38) 0%,
        rgba(13,13,13,0.08) 100%
      );
    }

    /* ── Right panel (form) ── */
    .login-form-panel {
      flex: 1 1 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: var(--ivory);
      padding: 72px 64px;
      position: relative;
      box-sizing: border-box;
      border-left: 1px solid var(--border-gold-20);
    }

    /* ── Back arrow ── */
    .login-back {
      position: absolute;
      top: 28px;
      left: 32px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      /* #5C4A2A sobre #FEFEFE = ratio ~7.1:1 — pasa AA y AAA */
      color: #5C4A2A;
      text-decoration: none;
      transition: color 0.2s, gap 0.2s;
      z-index: 10;
    }
    .login-back svg { transition: transform 0.2s; }
    .login-back:hover { color: var(--noir); }
    .login-back:hover svg { transform: translateX(-3px); }
    .login-back:hover { gap: 11px; }

    /* ── Form card ── */
    .login-card {
      width: 100%;
      max-width: 400px;
    }

    /* ── Gold divider ── */
    .login-gold-line {
      display: block;
      width: 120px;
      height: 1px;
      margin-bottom: 28px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--gold) 50%,
        transparent 100%
      );
    }

    /* ── Form label ── */
    /* #4A3F37 sobre #F7F0E6 = ratio ~6.8:1 — pasa AA para texto pequeño */
    .login-label {
      display: block;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #4A3F37;
      margin-bottom: 8px;
    }

    /* ── Input ── */
    .login-input {
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
    .login-input::placeholder { color: rgba(80,70,60,0.35); }
    .login-input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px var(--gold-08);
    }
    .login-input.error { border-color: #b94040; }
    .login-input:disabled { opacity: 0.55; cursor: not-allowed; }

    /* ── Error message ── */
    .login-error {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.1em;
      color: #b94040;
      margin-top: 6px;
      text-transform: uppercase;
    }

    /* ── Primary button ── */
    .login-btn-primary {
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
    .login-btn-primary:hover:not(:disabled) {
      background: var(--gold-dark);
      border-color: var(--gold-dark);
      color: var(--ivory);
      transform: translateY(-1px);
    }
    .login-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Ghost link button ── */
    /* #5C4A2A sobre #FEFEFE = ratio ~7.1:1 */
    .login-btn-ghost {
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
      text-decoration: none;
    }
    .login-btn-ghost:hover { color: var(--noir); }

    /* ── Register link ── */
    /* #5C4A2A sobre #FEFEFE = ratio ~7.1:1 */
    .login-register-link {
      font-family: var(--font-tag);
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #5C4A2A;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px solid rgba(92,74,42,0.4);
      padding-bottom: 1px;
      transition: border-color 0.2s, color 0.2s;
    }
    .login-register-link:hover {
      color: var(--noir);
      border-color: var(--noir);
    }

    /* ── Footer ── */
    /* #9C8B79 sobre #FEFEFE = ratio ~3.5:1 — aceptable para texto decorativo no crítico */
    .login-footer-text {
      position: absolute;
      bottom: 24px;
      left: 0;
      right: 0;
      text-align: center;
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #8c6030;
      pointer-events: none;
      user-select: none;
    }

    /* ── Modal overrides (D'oro palette) ── */
    .doro-modal-box {
      background: var(--ivory) !important;
      border: 1px solid var(--border-gold-25) !important;
      border-radius: 2px !important;
      color: var(--noir) !important;
    }

    /* ══════════════════════════════════════════
       RESPONSIVE — Tablet (≤ 860px)
    ══════════════════════════════════════════ */
    @media (max-width: 860px) {
      .login-image-panel { display: none; }
      .login-form-panel {
        flex: 1 1 100%;
        padding: 72px 40px 64px;
        border-left: none;
        min-height: 100vh;
      }
    }

    /* ══════════════════════════════════════════
       RESPONSIVE — Mobile (≤ 480px)
    ══════════════════════════════════════════ */
    @media (max-width: 480px) {
      .login-form-panel { padding: 72px 24px 64px; }
      .login-back { left: 20px; top: 22px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  usuario:  z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Login() {
  useTitulo("Iniciar Sesión — D'oro");

  const navigate = useNavigate();
  const { login, usuario: usuarioDelContexto, token } = useAuth();

  const [showPass,           setShowPass]           = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [toast,              setToast]              = useState({ message: '', type: 'error' });
  const [usuarioLogeado,     setUsuarioLogeado]     = useState(null);
  const [resetPasswordState, setResetPasswordState] = useState({ step: null, usuario: null });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Redirect if already authenticated
  useEffect(() => {
    if (token && usuarioDelContexto) {
      const role = usuarioDelContexto?.roleId || usuarioDelContexto?.role;
      navigate(role === 'CLIENTE' ? '/tienda' : '/dashboard', { replace: true });
    }
  }, [token, usuarioDelContexto, navigate]);

  useEffect(() => {
    if (usuarioLogeado && usuarioDelContexto) {
      const role = usuarioDelContexto?.roleId || usuarioDelContexto?.role;
      navigate(role === 'CLIENTE' ? '/tienda' : '/dashboard', { replace: true });
    }
  }, [usuarioDelContexto, usuarioLogeado, navigate]);

  // Form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario: data.usuario, password: data.password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Credenciales incorrectas.');
      login(result.token, result.user ?? {});
      setUsuarioLogeado(result.user ?? {});
      navigate('/dashboard');
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Password reset flow
  const openResetModal = (e) => {
    e.preventDefault();
    setResetPasswordState({ step: null, usuario: null });
    document.getElementById('reset_password_usuario_modal').showModal();
  };

  const handleResetPasswordFlow = (usuario, step) => {
    if (step === 'ADMIN_REQUIRED') {
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('forgot_password_modal').showModal();
      setResetPasswordState({ step: 'ADMIN_REQUIRED', usuario: null });
    } else if (step === 'CLIENTE' && usuario) {
      setResetPasswordState({ step: 'CLIENTE', usuario });
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('validate_code_modal').showModal();
    } else if (!usuario) {
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('user_not_found_modal').showModal();
      setResetPasswordState({ step: 'NOT_FOUND', usuario: null });
    }
  };

  const closeResetPasswordModals = () => {
    ['reset_password_usuario_modal', 'validate_code_modal', 'forgot_password_modal', 'user_not_found_modal']
      .forEach((id) => document.getElementById(id)?.close());
    setResetPasswordState({ step: null, usuario: null });
  };

  const handleResetSuccess = () => {
    closeResetPasswordModals();
    setToast({ message: 'Contraseña actualizada. Inicia sesión con tus nuevas credenciales.', type: 'success' });
  };

  const isBusy = isSubmitting || loading;

  return (
    <>
      <FontLoader />
      <LoginStyles />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'error' })}
      />

      <ModalResetPassword
        onClose={closeResetPasswordModals}
        onUserSubmitted={handleResetPasswordFlow}
      />
      <ModalValidateCode
        usuario={resetPasswordState.usuario}
        onClose={closeResetPasswordModals}
        onSuccess={handleResetSuccess}
      />
      <ModalUserNotFound onClose={closeResetPasswordModals} />

      <div className="login-root">

        {/* ── Left: editorial image panel ── */}
        <div className="login-image-panel">
          <img src={bgImage} alt="D'oro — Atelier" />
          <div className="login-image-overlay" />

          {/* Atelier tag — bottom left */}
          <div style={{
            position: 'absolute',
            bottom: '36px',
            left: '36px',
            background: 'rgba(13,13,13,0.72)',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '14px 22px',
          }}>
            <p style={{
              fontFamily: 'var(--font-tag)',
              fontSize: '9px',
              letterSpacing: '0.24em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              D'oro · Alta Moda · Desde 1986
            </p>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="login-form-panel">

          {/* Back arrow */}
          <Link to="/" className="login-back" aria-label="Regresar al inicio">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Inicio
          </Link>

          {/* Form card */}
          <div className="login-card">

            {/* Header */}
            <span className="login-gold-line" />

            <p style={{
              fontFamily: 'var(--font-tag)',
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              /* #5C4A2A sobre #FEFEFE = ratio ~7.1:1 */
              color: '#5C4A2A',
              margin: '0 0 14px',
            }}>
              Bienvenido de nuevo
            </p>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(35px, 3.7vw, 40px)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--noir)',
              lineHeight: 1.15,
              margin: '0 0 36px',
              letterSpacing: '0.04em',
            }}>
              Iniciar Sesión
            </h1>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} noValidate>

              {/* Usuario */}
              <div>
                <label className="login-label" htmlFor="login-usuario">
                  Usuario
                </label>
                <input
                  id="login-usuario"
                  type="text"
                  autoComplete="username"
                  disabled={isBusy}
                  className={`login-input${formErrors.usuario ? ' error' : ''}`}
                  {...register('usuario')}
                />
                {formErrors.usuario && (
                  <p className="login-error">{formErrors.usuario.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="login-label" htmlFor="login-password" style={{ margin: '0 0 8px' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isBusy}
                    className={`login-input${formErrors.password ? ' error' : ''}`}
                    style={{ paddingRight: '44px' }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '14px',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9C8B79',
                      transition: 'color 0.2s',
                      lineHeight: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#5C4A2A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9C8B79')}
                  >
                    {showPass
                      ? <EyeOff size={18} strokeWidth={1.5} />
                      : <Eye size={18} strokeWidth={1.5} />
                    }
                  </button>
                </div>
                {formErrors.password && (
                  <p className="login-error">{formErrors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="login-btn-primary"
                >
                  {isBusy ? (
                    <>
                      <span style={{
                        width: '12px', height: '12px',
                        border: '1.5px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Verificando...
                    </>
                  ) : 'Ingresar'}
                </button>

                {/* Forgot password */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={openResetModal}
                    className="login-btn-ghost"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '4px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-gold-20)' }} />
                <span style={{
                  fontFamily: 'var(--font-tag)',
                  fontSize: '10px',
                  fontWeight: 400,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  /* #9C8B79 sobre #FEFEFE = ratio ~3.5:1 — texto decorativo secundario */
                  color: '#8c6030',
                  whiteSpace: 'nowrap',
                }}>
                  ¿Nuevo aquí?
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-gold-20)' }} />
              </div>

              {/* Register CTA */}
              <div style={{ textAlign: 'center', paddingBottom: '4px' }}>
                <Link to="/Register" className="login-register-link">
                  Crear una cuenta
                </Link>
              </div>

            </form>
          </div>

          {/* Bottom tag */}
          <p className="login-footer-text">D'oro · Compromiso con nuestros clientes</p>
        </div>
      </div>

      {/* ── Admin reset modal ── */}
      <dialog id="forgot_password_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box doro-modal-box" style={{ maxWidth: '480px', width: '100%', padding: '48px 40px', boxSizing: 'border-box' }}>
          <form method="dialog">
            <button
              type="button"
              onClick={closeResetPasswordModals}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ash)',
                fontSize: '18px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold-dark)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ash)')}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>

          {/* Icon */}
          <div style={{
            width: '44px',
            height: '44px',
            border: '1px solid var(--border-gold-25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>

          <span style={{ display: 'block', width: '36px', height: '1px', background: 'var(--gold)', marginBottom: '20px' }} />

          <p style={{
            fontFamily: 'var(--font-tag)',
            fontSize: '10px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--gold-dark)',
            margin: '0 0 12px',
          }}>
            Recuperación de contraseña
          </p>

          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--noir)',
            margin: '0 0 24px',
            lineHeight: 1.2,
          }}>
            Acceso restringido al administrador
          </h3>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--ash)',
            lineHeight: 1.75,
            margin: '0 0 16px',
          }}>
            Por políticas de seguridad del sistema, el restablecimiento de contraseñas es gestionado exclusivamente por el administrador del sistema.
          </p>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--ash)',
            lineHeight: 1.7,
            margin: '0 0 28px',
            opacity: 0.8,
          }}>
            Comuníquese con el área de Sistemas o Soporte Técnico de su organización para obtener nuevas credenciales.
          </p>

          <div style={{
            borderLeft: '2px solid var(--border-gold-40)',
            paddingLeft: '16px',
            fontFamily: 'var(--font-tag)',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.12em',
            /* #5C4A2A sobre #F7F0E6 = ratio ~7.1:1 */
            color: '#5C4A2A',
            lineHeight: 1.8,
          }}>
            Si desconoce quién es el administrador asignado,<br />
            contacte al responsable de su área o departamento.
          </div>
        </div>

        <form method="dialog" className="modal-backdrop" style={{ background: 'rgba(13,13,13,0.55)', backdropFilter: 'blur(4px)' }}>
          <button onClick={closeResetPasswordModals}>cerrar</button>
        </form>
      </dialog>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}