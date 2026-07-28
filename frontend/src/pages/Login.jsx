import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
// Fonts
// ---------------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------
const LoginStyles = () => (
  <style>{`
    .login-root {
      position: relative;
      min-height: 100vh;
      width: 100%;
      overflow-x: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 24px;
    }

    .login-bg-img {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      z-index: 0;
    }

    .login-bg-overlay {
      position: fixed;
      inset: 0;
      z-index: 0;
      background: linear-gradient(
        180deg,
        rgba(13,13,13,0.55) 0%,
        rgba(13,13,13,0.72) 55%,
        rgba(13,13,13,0.82) 100%
      );
    }

    .login-back {
      position: fixed;
      top: 28px;
      left: 32px;
      z-index: 10;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gold-light);
      text-decoration: none;
      transition: color 0.2s, gap 0.2s;
    }
    .login-back svg { transition: transform 0.2s; }
    .login-back:hover { color: var(--gold); gap: 11px; }
    .login-back:hover svg { transform: translateX(-3px); }

    .login-card {
      position: relative;
      z-index: 5;
      width: 100%;
      max-width: 380px;
      background: rgba(13,13,13,0.82);
      border: 1px solid var(--border-gold-25);
      border-radius: 2px;
      backdrop-filter: blur(14px);
      box-shadow: 0 30px 80px rgba(0,0,0,0.5);
      padding: 44px 36px;
      box-sizing: border-box;
    }

    .login-gold-line {
      display: block;
      width: 90px;
      height: 1px;
      margin: 0 auto 24px;
      background: linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%);
    }

    .login-label {
      display: block;
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 8px;
    }

    .login-input {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border-gold-20);
      border-radius: 2px;
      font-family: var(--font-body);
      font-size: 15px;
      color: var(--snow);
      outline: none;
      transition: border-color 0.25s, box-shadow 0.25s;
      box-sizing: border-box;
      -webkit-appearance: none;
    }
    /* Oculta el ícono nativo de "mostrar contraseña" de Edge/Chrome */
    .login-input::-ms-reveal,
    .login-input::-ms-clear {
      display: none;
    }
      input[type="password"]::-webkit-textfield-decoration-container {
      visibility: hidden;
    }
    .login-input::placeholder { color: rgba(247,240,230,0.3); }
    .login-input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px var(--gold-08);
    }
    .login-input.error { border-color: #e57373; }
    .login-input:disabled { opacity: 0.5; cursor: not-allowed; }

    .login-error {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.1em;
      color: #e57373;
      margin-top: 6px;
      text-transform: uppercase;
    }

    /* ── Layout de campos: columna por defecto (mobile/tablet) ── */
    .login-fields-row {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .login-field { flex: 1; min-width: 0; }

    .login-btn-primary {
      width: 100%;
      padding: 14px 24px;
      background: var(--gold);
      color: var(--noir);
      border: 1px solid var(--gold);
      border-radius: 2px;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.25s, transform 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .login-btn-primary:hover:not(:disabled) {
      background: var(--gold-light);
      transform: translateY(-1px);
    }
    .login-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .login-btn-google {
      width: 100%;
      padding: 13px 24px;
      background: rgba(255,255,255,0.03);
      color: var(--snow);
      border: 1px solid var(--border-gold-20);
      border-radius: 2px;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .login-btn-google:hover:not(:disabled) {
      background: rgba(255,255,255,0.06);
      border-color: var(--border-gold-40);
    }
    .login-btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

    .login-btn-ghost {
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--gold-light);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }
    .login-btn-ghost:hover { color: var(--gold); }

    .login-register-link {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold-light);
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px solid rgba(214,171,52,0.4);
      padding-bottom: 1px;
      transition: border-color 0.2s, color 0.2s;
    }
    .login-register-link:hover { color: var(--gold); border-color: var(--gold); }

    .doro-modal-box {
      background: var(--ivory) !important;
      border: 1px solid var(--border-gold-25) !important;
      border-radius: 2px !important;
      color: var(--noir) !important;
    }

    /* ══════════════════════════════════════════
       DESKTOP (≥ 900px) — card más cuadrada,
       usuario y contraseña en el mismo renglón
    ══════════════════════════════════════════ */
    @media (min-width: 900px) {
      .login-card {
        max-width: 480px;
        padding: 36px 40px;
      }
      .login-fields-row {
        flex-direction: row;
        gap: 16px;
      }
      .login-gold-line { margin-bottom: 18px; }
    }

    /* ══════════════════════════════════════════
       PANTALLAS CHICAS (≤ 640px)
       — sin imagen de fondo, la pantalla ES el recuadro
    ══════════════════════════════════════════ */
    @media (max-width: 640px) {
      .login-bg-img,
      .login-bg-overlay { display: none; }

      .login-root {
        padding: 0;
        background: var(--noir);
        align-items: stretch;
      }

      .login-card {
        max-width: 100%;
        width: 100%;
        min-height: 100vh;
        border: none;
        border-radius: 0;
        box-shadow: none;
        backdrop-filter: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 80px 28px 40px;
        box-sizing: border-box;
      }

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
  email:    z.string().min(1, 'El correo es obligatorio').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Login() {
  useTitulo("Iniciar Sesión — D'oro");

  const navigate = useNavigate();
  const location = useLocation();
  const { login, usuario: usuarioDelContexto, token } = useAuth();
  const googleBtnRef = useRef(null);

  const [showPass,           setShowPass]           = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [loadingGoogle,      setLoadingGoogle]      = useState(false);
  const [toast,              setToast]              = useState({ message: '', type: 'error' });
  const [usuarioLogeado,     setUsuarioLogeado]     = useState(null);
  const [resetPasswordState, setResetPasswordState] = useState({ step: null, email: null });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Redirige si ya está autenticado
  useEffect(() => {
    if (token && usuarioDelContexto) {
      const role = usuarioDelContexto?.role || usuarioDelContexto?.roleId;
      const destino = location.state?.from || (role === 'CLIENTE' ? '/tienda' : '/dashboard');
      navigate(destino, { replace: true });
    }
  }, [token, usuarioDelContexto, navigate, location.state]);

  useEffect(() => {
    if (usuarioLogeado && usuarioDelContexto) {
      const role = usuarioDelContexto?.role || usuarioDelContexto?.roleId;
      const destino = location.state?.from || (role === 'CLIENTE' ? '/tienda' : '/dashboard');
      navigate(destino, { replace: true });
    }
  }, [usuarioDelContexto, usuarioLogeado, navigate, location.state]);

  // ── Login normal (usuario + contraseña) ──────────────────────────────────
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Credenciales incorrectas.');
      login(result.token, result.user ?? {});
      setUsuarioLogeado(result.user ?? {});
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Login con Google (Google Identity Services) ──────────────────────────
  const handleGoogleCredential = async (response) => {
    try {
      setLoadingGoogle(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credential: response.credential }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'No se pudo iniciar sesión con Google.');
      login(result.token, result.user ?? {});
      setUsuarioLogeado(result.user ?? {});
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoadingGoogle(false);
    }
  };

 useEffect(() => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return;

  let observer;

  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => {
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
    });

    const dibujarBoton = () => {
      if (!googleBtnRef.current) return;
      googleBtnRef.current.innerHTML = ''; // limpia el botón anterior
      const ancho = googleBtnRef.current.offsetWidth;
      window.google?.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: ancho,
        text: 'continue_with',
        shape: 'rectangular',
      });
    };

    dibujarBoton();

    // Redibuja cuando el contenedor cambia de tamaño (resize, breakpoints)
    observer = new ResizeObserver(() => dibujarBoton());
    if (googleBtnRef.current) observer.observe(googleBtnRef.current);
  };
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
    observer?.disconnect();
  };
}, []);

  // ── Password reset flow ───────────────────────────────────────────────────
  const openResetModal = (e) => {
    e.preventDefault();
    setResetPasswordState({ step: null, email: null });
    document.getElementById('reset_password_usuario_modal').showModal();
  };

  const handleResetPasswordFlow = (email, step) => {
    if (step === 'CLIENTE' && email) {
      setResetPasswordState({ step: 'CLIENTE', email });
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('validate_code_modal').showModal();
    } else if (!email) {
      document.getElementById('reset_password_usuario_modal').close();
      document.getElementById('user_not_found_modal').showModal();
      setResetPasswordState({ step: 'NOT_FOUND', email: null });
    }
  };

  const closeResetPasswordModals = () => {
    ['reset_password_usuario_modal', 'validate_code_modal', 'forgot_password_modal', 'user_not_found_modal']
      .forEach((id) => document.getElementById(id)?.close());
    setResetPasswordState({ step: null, email: null });
  };

  const handleResetSuccess = () => {
    closeResetPasswordModals();
    setToast({ message: 'Contraseña actualizada. Inicia sesión con tus nuevas credenciales.', type: 'success' });
  };

  const isBusy = isSubmitting || loading || loadingGoogle;

  return (
    <>
      <FontLoader />
      <LoginStyles />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'error' })}
      />

      <ModalResetPassword onClose={closeResetPasswordModals} onUserSubmitted={handleResetPasswordFlow} />
      <ModalValidateCode email={resetPasswordState.email} onClose={closeResetPasswordModals} onSuccess={handleResetSuccess} />
      <ModalUserNotFound onClose={closeResetPasswordModals} />

      <div className="login-root">

        <img src={bgImage} alt="D'oro — Atelier" className="login-bg-img" />
        <div className="login-bg-overlay" />

        <Link to="/" className="login-back" aria-label="Regresar al inicio">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Inicio
        </Link>

        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3vw, 28px)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              color: 'var(--gold-light)',
            }}>
              D<span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>'</span>ORO
            </span>
  
          </div>

          <span className="login-gold-line" />
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.2vw, 32px)',
            fontWeight: 300, fontStyle: 'italic', color: 'var(--snow)',
            lineHeight: 1.15, margin: '0 0 28px', letterSpacing: '0.02em', textAlign: 'center',
          }}>
            Iniciar Sesión
          </h1>

          {/* Botón de Google */}
          <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }} />

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <button type="button" className="login-btn-google" disabled style={{ marginBottom: '20px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 010-4.18V7.06H2.18a11 11 0 000 9.88l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Configura VITE_GOOGLE_CLIENT_ID
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '0 0 24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-gold-20)' }} />
            <span style={{
              fontFamily: 'var(--font-tag)', fontSize: '9px', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--gold-light)', whiteSpace: 'nowrap',
            }}>
              o con tu cuenta
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-gold-20)' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>

            <div className="login-fields-row">
              <div className="login-field">
                <label className="login-label" htmlFor="login-email">Correo</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  disabled={isBusy}
                  className={`login-input${formErrors.email ? ' error' : ''}`}
                  {...register('email')}
                />
                {formErrors.email && <p className="login-error">{formErrors.email.message}</p>}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password">Contraseña</label>
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
                      position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--gold-light)', lineHeight: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
                  </button>
                </div>
                {formErrors.password && <p className="login-error">{formErrors.password.message}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button type="submit" disabled={isBusy} className="login-btn-primary">
                {isBusy ? (
                  <>
                    <span style={{
                      width: '12px', height: '12px', border: '1.5px solid currentColor',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.7s linear infinite',
                    }} />
                    Verificando...
                  </>
                ) : 'Ingresar'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={openResetModal} className="login-btn-ghost">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              <span style={{ fontFamily: 'var(--font-tag)', fontSize: '10px', color: 'var(--ash, #9C8B79)', marginRight: '8px' }}>
                ¿Nuevo aquí?
              </span>
              <Link to="/Register" className="login-register-link">Crear una cuenta</Link>
            </div>

          </form>
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
                position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--ash)', fontSize: '18px', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
              }}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </form>
          <div style={{ width: '44px', height: '44px', border: '1px solid var(--border-gold-25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <span style={{ display: 'block', width: '36px', height: '1px', background: 'var(--gold)', marginBottom: '20px' }} />
          <p style={{ fontFamily: 'var(--font-tag)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold-dark)', margin: '0 0 12px' }}>
            Recuperación de contraseña
          </p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--noir)', margin: '0 0 24px', lineHeight: 1.2 }}>
            Acceso restringido al administrador
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ash)', lineHeight: 1.75, margin: '0 0 16px' }}>
            Por políticas de seguridad del sistema, el restablecimiento de contraseñas es gestionado exclusivamente por el administrador del sistema.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--ash)', lineHeight: 1.7, margin: '0 0 28px', opacity: 0.8 }}>
            Comuníquese con el área de Sistemas o Soporte Técnico de su organización para obtener nuevas credenciales.
          </p>
          <div style={{ borderLeft: '2px solid var(--border-gold-40)', paddingLeft: '16px', fontFamily: 'var(--font-tag)', fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', color: '#5C4A2A', lineHeight: 1.8 }}>
            Si desconoce quién es el administrador asignado,<br />
            contacte al responsable de su área o departamento.
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" style={{ background: 'rgba(13,13,13,0.55)', backdropFilter: 'blur(4px)' }}>
          <button onClick={closeResetPasswordModals}>cerrar</button>
        </form>
      </dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
