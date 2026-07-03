import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import useTitulo from "../hooks/useTitulo";

// ---------------------------------------------------------------------------
// Fonts — same as Login / Home
// ---------------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------
const RegisterStyles = () => (
  <style>{`
    .reg-root {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background: var(--noir);
      overflow-x: hidden;
      box-sizing: border-box;
    }

    /* ── Left branding panel ── */
    .reg-brand-panel {
      position: sticky;
      top: 0;
      height: 100vh;
      flex: 0 0 340px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 52px 44px;
      background: var(--noir-soft);
      border-right: 1px solid var(--border-gold-20);
      box-sizing: border-box;
      overflow: hidden;
    }

    /* ── Right form panel ── */
    .reg-form-panel {
      flex: 1 1 0;
      min-height: 100vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      background: var(--ivory);
      padding: 64px 60px 72px;
      box-sizing: border-box;
      border-left: 1px solid var(--border-gold-20);
    }

    .reg-form-inner {
      width: 100%;
      max-width: 520px;
    }

    /* ── Back arrow ── */
    .reg-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #5C4A2A;
      text-decoration: none;
      margin-bottom: 40px;
      transition: color 0.2s, gap 0.2s;
    }
    .reg-back svg { transition: transform 0.2s; }
    .reg-back:hover { color: var(--noir); gap: 11px; }
    .reg-back:hover svg { transform: translateX(-3px); }

    /* ── Gold divider ── */
    .reg-gold-line {
      display: block;
      width: 90px;
      height: 1px;
      margin-bottom: 24px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }

    /* ── Section separator ── */
    .reg-section-sep {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 28px 0 20px;
    }
    .reg-section-sep span {
      font-family: var(--font-tag);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--gold-dark);
      white-space: nowrap;
    }
    .reg-section-sep::before,
    .reg-section-sep::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-gold-25);
    }

    /* ── Label ── */
    /* #4A3F37 on #F7F0E6 = ~6.8:1 — passes AA */
    .reg-label {
      display: block;
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #4A3F37;
      margin-bottom: 7px;
    }
    .reg-label .req { color: #b94040; margin-left: 2px; }

    /* ── Input wrapper ── */
    .reg-input-wrap { position: relative; }
    .reg-input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #9C8B79;
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    /* ── Input ── */
    .reg-input {
      width: 100%;
      padding: 13px 16px 13px 42px;
      background: #FEFEFE;
      border: 1px solid var(--border-gold-25);
      border-radius: 2px;
      font-family: var(--font-body);
      font-size: 15px;
      color: var(--noir);
      outline: none;
      transition: border-color 0.25s, box-shadow 0.25s;
      box-sizing: border-box;
      -webkit-appearance: none;
    }
    .reg-input::placeholder { color: rgba(80,70,60,0.3); }
    .reg-input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px var(--gold-08);
    }
    .reg-input.has-error { border-color: #b94040; }
    .reg-input:disabled { opacity: 0.5; cursor: not-allowed; }
    .reg-input.with-toggle { padding-right: 44px; }
    .reg-input.uppercase-input { text-transform: uppercase; }

    /* ── Toggle button (show/hide password) ── */
    .reg-toggle-btn {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      color: #9C8B79;
      transition: color 0.2s;
      line-height: 0;
    }
    .reg-toggle-btn:hover { color: #5C4A2A; }

    /* ── Field error ── */
    .reg-field-error {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #b94040;
      margin-top: 5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* ── Field hint ── */
    .reg-field-hint {
      font-family: var(--font-body);
      font-size: 12px;
      color: #9C8B79;
      margin-top: 5px;
      font-style: italic;
    }

    /* ── Password strength bars ── */
    .reg-strength-bars { display: flex; gap: 4px; margin-top: 6px; }
    .reg-strength-bar {
      flex: 1;
      height: 2px;
      border-radius: 0;
      background: var(--border-gold-20);
      transition: background 0.3s;
    }
    .reg-strength-bar.weak   { background: #D04E37; }
    .reg-strength-bar.medium { background: #E0A020; }
    .reg-strength-bar.strong { background: #4A8C38; }
    .reg-strength-label {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .reg-strength-label.weak   { color: #D04E37; }
    .reg-strength-label.medium { color: #E0A020; }
    .reg-strength-label.strong { color: #4A8C38; }

    /* ── Submit button ── */
    .reg-btn-submit {
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
      margin-top: 32px;
    }
    .reg-btn-submit:hover:not(:disabled) {
      background: var(--gold-dark);
      border-color: var(--gold-dark);
      color: var(--ivory);
      transform: translateY(-1px);
    }
    .reg-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Login link ── */
    .reg-login-link {
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #5C4A2A;
      text-decoration: none;
      border-bottom: 1px solid rgba(92,74,42,0.4);
      padding-bottom: 1px;
      transition: color 0.2s, border-color 0.2s;
    }
    .reg-login-link:hover { color: var(--noir); border-color: var(--noir); }

    /* ── Checkbox ── */
    .reg-checkbox-wrap {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
    }
    .reg-checkbox-box {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      border: 1px solid var(--border-gold-40);
      background: #FEFEFE;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      transition: background 0.2s, border-color 0.2s;
    }
    .reg-checkbox-box.checked {
      background: var(--gold);
      border-color: var(--gold);
    }
    .reg-checkbox-text {
      font-family: var(--font-body);
      font-size: 14px;
      color: var(--noir);
      line-height: 1.65;
    }
    .reg-checkbox-text button {
      font-family: var(--font-tag);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #5C4A2A;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }
    .reg-checkbox-text button:hover { color: var(--noir); }

    /* ── Grid helpers ── */
    .reg-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    /* ── Footer text ── */
    .reg-footer-text {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #8c6030;
      text-align: center;
      margin-top: 36px;
    }

    /* ══════════════════════════════════════════
       RESPONSIVE — Tablet (≤ 900px)
    ══════════════════════════════════════════ */
    @media (max-width: 900px) {
      .reg-brand-panel { display: none; }
      .reg-form-panel {
        padding: 52px 40px 64px;
        border-left: none;
      }
    }

    /* ══════════════════════════════════════════
       RESPONSIVE — Mobile (≤ 540px)
    ══════════════════════════════════════════ */
    @media (max-width: 540px) {
      .reg-form-panel { padding: 48px 20px 56px; }
      .reg-grid-2 { grid-template-columns: 1fr; }
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
const TEL_REGEX = /^\+?[\d\s\-()]{10,15}$/;

function validate(form) {
  const err = {};
  if (!form.nombre.trim())
    err.nombre = "El nombre es obligatorio.";
  else if (form.nombre.trim().length < 2)
    err.nombre = "Mínimo 2 caracteres.";

  if (!form.rfc.trim())
    err.rfc = "El RFC es obligatorio.";
  else if (!RFC_REGEX.test(form.rfc.trim()))
    err.rfc = "RFC inválido — ej: GARM850101AB3";

  if (!form.email.trim())
    err.email = "El email es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    err.email = "Ingresa un email válido.";

  if (!form.telefono.trim())
    err.telefono = "El teléfono es obligatorio.";
  else if (!TEL_REGEX.test(form.telefono.trim()))
    err.telefono = "Mínimo 10 dígitos.";

  if (!form.usuario.trim())
    err.usuario = "El usuario es obligatorio.";
  else if (form.usuario.trim().length < 3)
    err.usuario = "Mínimo 3 caracteres.";
  else if (/\s/.test(form.usuario))
    err.usuario = "Sin espacios.";

  if (!form.password)
    err.password = "La contraseña es obligatoria.";
  else if (form.password.length < 6)
    err.password = "Mínimo 6 caracteres.";

  if (!form.confirm)
    err.confirm = "Confirma tu contraseña.";
  else if (form.password !== form.confirm)
    err.confirm = "Las contraseñas no coinciden.";

  if (!form.terminos)
    err.terminos = "Debes aceptar los términos.";

  return err;
}

// ---------------------------------------------------------------------------
// Password strength
// ---------------------------------------------------------------------------
function getStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: "Débil",    key: "weak",   bars: 1 },
    { label: "Moderada", key: "medium", bars: 2 },
    { label: "Fuerte",   key: "strong", bars: 3 },
  ];
  return levels[score - 1] ?? levels[0];
}

// ---------------------------------------------------------------------------
// D'oro wordmark — same as Home / Login
// ---------------------------------------------------------------------------
const DoroWordmark = ({ size = 22, color = "var(--gold-light)" }) => (
  <div style={{
    fontFamily: "var(--font-display)",
    fontSize: size,
    fontWeight: 300,
    letterSpacing: "0.22em",
    color,
    userSelect: "none",
    display: "flex",
    alignItems: "baseline",
    gap: "2px",
  }}>
    D
    <span style={{ fontStyle: "italic", color: "var(--gold)", marginRight: "1px" }}>'</span>
    ORO
  </div>
);

// ---------------------------------------------------------------------------
// Reusable field wrapper
// ---------------------------------------------------------------------------
function Field({ label, id, icon, error, hint, required, children }) {
  return (
    <div>
      <label className="reg-label" htmlFor={id}>
        {label}{required && <span className="req"> *</span>}
      </label>
      <div className="reg-input-wrap">
        <span className="reg-input-icon">
          <i className={`bi ${icon}`} style={{ fontSize: "14px" }} />
        </span>
        {children}
      </div>
      {error && (
        <p className="reg-field-error">
          <i className="bi bi-exclamation-circle" style={{ fontSize: "11px" }} />
          {error}
        </p>
      )}
      {hint && !error && <p className="reg-field-hint">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Register() {
  useTitulo("Crear Cuenta — D'oro");

  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre: "", rfc: "", email: "", telefono: "",
    usuario: "", password: "", confirm: "", terminos: false,
  });

  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState({ message: "", type: "error" });

  const strength = getStrength(form.password);

  const handleChange = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const localErrors = validate(form);
    if (Object.keys(localErrors).length > 0) { setErrors(localErrors); return; }

    setLoading(true);
    try {
      await register({
        nombre:   form.nombre.trim(),
        rfc:      form.rfc.trim().toUpperCase(),
        email:    form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        usuario:  form.usuario.trim().toLowerCase(),
        password: form.password,
      });
      setToast({ message: "Cuenta creada correctamente.", type: "success" });
      setTimeout(() => navigate("/tienda"), 1200);
    } catch (err) {
      if (err.field) setErrors({ [err.field]: err.message });
      else setToast({ message: err.message ?? "Error al crear la cuenta.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FontLoader />
      <RegisterStyles />
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "error" })}
      />

      <div className="reg-root">

        {/* ── Left branding panel ── */}
        <aside className="reg-brand-panel">

          {/* Top: wordmark + tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <DoroWordmark size={22} />
            <p style={{
              fontFamily: "var(--font-tag)",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(214,171,52,0.5)",
              margin: 0,
            }}>
              Alta Moda · Desde 1986
            </p>
          </div>

          {/* Mid: headline + benefits */}
          <div>
            <div style={{ width: "36px", height: "1px", background: "var(--gold)", marginBottom: "24px" }} />
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 2.4vw, 28px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--snow)",
              lineHeight: 1.25,
              margin: "0 0 12px",
            }}>
              Bienvenido,<br />crea tu cuenta
            </h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--ash)",
              lineHeight: 1.7,
              fontStyle: "italic",
              margin: "0 0 28px",
            }}>
              Regístrate para acceder a tus pedidos y a piezas en edición limitada.
            </p>

            {[
              { icon: "bi-bag-check",    text: "Historial de compras"      },
              { icon: "bi-truck",        text: "Seguimiento de pedidos"    },
              { icon: "bi-gem",          text: "Piezas certificadas"       },
              { icon: "bi-shield-check", text: "Pagos seguros y protegidos"},
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <i
                  className={`bi ${icon}`}
                  style={{ fontSize: "13px", color: "var(--gold)", width: "16px", flexShrink: 0 }}
                />
                <span style={{ fontFamily: "var(--font-tag)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ash)" }}>
                  {text}
                </span>
              </div>
            ))}

            <div style={{ width: "36px", height: "1px", background: "var(--gold)", marginTop: "8px" }} />
          </div>

          {/* Bottom: cities + copyright */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(214,171,52,0.5)",
              margin: 0,
            }}>
              Milán · París · Ciudad de México
            </p>
            <p style={{
              fontFamily: "var(--font-tag)",
              fontSize: "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(247,240,230,0.18)",
              margin: 0,
            }}>
              © 2026 D'oro Maison
            </p>
          </div>
        </aside>

        {/* ── Right form panel ── */}
        <main className="reg-form-panel">
          <div className="reg-form-inner">

            {/* Back arrow */}
            <Link to="/login" className="reg-back" aria-label="Regresar al inicio de sesión">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Iniciar sesión
            </Link>

            {/* Header */}
            <span className="reg-gold-line" />

            <p style={{
              fontFamily: "var(--font-tag)",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#5C4A2A",
              margin: "0 0 12px",
            }}>
              Nueva cuenta
            </p>

            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 3.5vw, 38px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--noir)",
              lineHeight: 1.15,
              margin: "0 0 6px",
              letterSpacing: "0.03em",
            }}>
              Crear una cuenta
            </h1>

            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "#9C8B79",
              margin: "0 0 8px",
            }}>
              Los campos con <span style={{ color: "#b94040" }}>*</span> son obligatorios.
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 0 }}>

              {/* ── Section: Personal data ── */}
              <div className="reg-section-sep">
                <span>Datos personales</span>
              </div>

              <div className="reg-grid-2">
                <Field label="Nombre completo" id="nombre" icon="bi-person" required error={errors.nombre}>
                  <input
                    id="nombre" type="text" placeholder="María García"
                    value={form.nombre} onChange={handleChange("nombre")}
                    className={`reg-input${errors.nombre ? " has-error" : ""}`}
                    autoComplete="name" disabled={loading}
                  />
                </Field>

                <Field label="RFC" id="rfc" icon="bi-card-text" required error={errors.rfc} hint="Ej: GARM850101AB3">
                  <input
                    id="rfc" type="text" placeholder="GARM850101AB3"
                    value={form.rfc} onChange={handleChange("rfc")}
                    className={`reg-input uppercase-input${errors.rfc ? " has-error" : ""}`}
                    autoComplete="off" disabled={loading} maxLength={13}
                  />
                </Field>
              </div>

              {/* ── Section: Contact ── */}
              <div className="reg-section-sep">
                <span>Contacto</span>
              </div>

              <div className="reg-grid-2">
                <Field label="Correo electrónico" id="email" icon="bi-envelope" required error={errors.email}>
                  <input
                    id="email" type="email" placeholder="correo@ejemplo.com"
                    value={form.email} onChange={handleChange("email")}
                    className={`reg-input${errors.email ? " has-error" : ""}`}
                    autoComplete="email" disabled={loading}
                  />
                </Field>

                <Field label="Teléfono" id="telefono" icon="bi-telephone" required error={errors.telefono} hint="10 dígitos mínimo">
                  <input
                    id="telefono" type="tel" placeholder="464 123 4567"
                    value={form.telefono} onChange={handleChange("telefono")}
                    className={`reg-input${errors.telefono ? " has-error" : ""}`}
                    autoComplete="tel" disabled={loading}
                  />
                </Field>
              </div>

              {/* ── Section: Access ── */}
              <div className="reg-section-sep">
                <span>Credenciales de acceso</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                <Field
                  label="Nombre de usuario" id="usuario" icon="bi-at" required
                  error={errors.usuario} hint="Mínimo 3 caracteres, sin espacios"
                >
                  <input
                    id="usuario" type="text" placeholder="maria_garcia"
                    value={form.usuario} onChange={handleChange("usuario")}
                    className={`reg-input${errors.usuario ? " has-error" : ""}`}
                    autoComplete="username" disabled={loading}
                  />
                </Field>

                <div className="reg-grid-2">

                  {/* Password */}
                  <div>
                    <label className="reg-label" htmlFor="password">
                      Contraseña<span className="req"> *</span>
                    </label>
                    <div className="reg-input-wrap">
                      <span className="reg-input-icon">
                        <i className="bi bi-lock" style={{ fontSize: "14px" }} />
                      </span>
                      <input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange("password")}
                        className={`reg-input with-toggle${errors.password ? " has-error" : ""}`}
                        autoComplete="new-password" disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="reg-toggle-btn"
                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPass ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                      </button>
                    </div>

                    {/* Strength bars */}
                    {form.password && (
                      <div className="reg-strength-bars">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`reg-strength-bar${strength && i < strength.bars ? ` ${strength.key}` : ""}`}
                          />
                        ))}
                      </div>
                    )}

                    {errors.password ? (
                      <p className="reg-field-error">
                        <i className="bi bi-exclamation-circle" style={{ fontSize: "11px" }} />
                        {errors.password}
                      </p>
                    ) : form.password && strength ? (
                      <p className={`reg-strength-label ${strength.key}`}>
                        Seguridad: {strength.label}
                      </p>
                    ) : (
                      <p className="reg-field-hint">Mínimo 6 caracteres</p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="reg-label" htmlFor="confirm">
                      Confirmar contraseña<span className="req"> *</span>
                    </label>
                    <div className="reg-input-wrap">
                      <span className="reg-input-icon">
                        <i className="bi bi-lock-fill" style={{ fontSize: "14px" }} />
                      </span>
                      <input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.confirm}
                        onChange={handleChange("confirm")}
                        className={`reg-input with-toggle${errors.confirm ? " has-error" : ""}`}
                        autoComplete="new-password" disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="reg-toggle-btn"
                        aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirm ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                      </button>
                    </div>

                    {errors.confirm ? (
                      <p className="reg-field-error">
                        <i className="bi bi-exclamation-circle" style={{ fontSize: "11px" }} />
                        {errors.confirm}
                      </p>
                    ) : form.confirm && form.password ? (
                      <p style={{
                        fontFamily: "var(--font-tag)",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginTop: "5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: form.password === form.confirm ? "#4A8C38" : "#D04E37",
                      }}>
                        <i className={`bi ${form.password === form.confirm ? "bi-check-circle" : "bi-x-circle"}`} style={{ fontSize: "11px" }} />
                        {form.password === form.confirm ? "Coinciden" : "No coinciden"}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* ── Terms ── */}
              <div style={{ marginTop: "28px" }}>
                <label className="reg-checkbox-wrap" htmlFor="terminos">
                  <input
                    id="terminos" type="checkbox"
                    checked={form.terminos}
                    onChange={handleChange("terminos")}
                    disabled={loading}
                    style={{ display: "none" }}
                  />
                  <span className={`reg-checkbox-box${form.terminos ? " checked" : ""}`}>
                    {form.terminos && (
                      <i className="bi bi-check" style={{ fontSize: "12px", color: "var(--noir)", lineHeight: 1 }} />
                    )}
                  </span>
                  <span className="reg-checkbox-text">
                    Acepto los{" "}
                    <button type="button">Términos y condiciones</button>{" "}
                    y el{" "}
                    <button type="button">Aviso de privacidad</button>.
                  </span>
                </label>
                {errors.terminos && (
                  <p className="reg-field-error" style={{ marginTop: "6px", marginLeft: "26px" }}>
                    <i className="bi bi-exclamation-circle" style={{ fontSize: "11px" }} />
                    {errors.terminos}
                  </p>
                )}
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={loading}
                className="reg-btn-submit"
              >
                {loading ? (
                  <>
                    <span style={{
                      width: "12px", height: "12px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Creando cuenta...
                  </>
                ) : "Crear cuenta"}
              </button>

              {/* ── Divider + login CTA ── */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "24px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border-gold-20)" }} />
                <span style={{
                  fontFamily: "var(--font-tag)",
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#8c6030",
                  whiteSpace: "nowrap",
                }}>
                  ¿Ya tienes una cuenta?
                </span>
                <div style={{ flex: 1, height: "1px", background: "var(--border-gold-20)" }} />
              </div>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <Link to="/login" className="reg-login-link">Iniciar sesión</Link>
              </div>
            </form>

            <p className="reg-footer-text">D'oro · Compromiso con nuestros clientes</p>
          </div>
        </main>
      </div>
    </>
  );
}