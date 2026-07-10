import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import useTitulo from "../hooks/useTitulo";
import bgImage from "../assets/login.png";

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

// ---------------------------------------------------------------------------
// Scoped styles — mirrors Login's dark glass aesthetic
// ---------------------------------------------------------------------------
const RegisterStyles = () => (
  <style>{`
    .reg-root {
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

    .reg-bg-img {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      z-index: 0;
    }

    .reg-bg-overlay {
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

    .reg-back {
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
    .reg-back svg { transition: transform 0.2s; }
    .reg-back:hover { color: var(--gold); gap: 11px; }
    .reg-back:hover svg { transform: translateX(-3px); }

    .reg-card {
      position: relative;
      z-index: 5;
      width: 100%;
      max-width: 620px;
      background: rgba(13,13,13,0.82);
      border: 1px solid var(--border-gold-25);
      border-radius: 2px;
      backdrop-filter: blur(14px);
      box-shadow: 0 30px 80px rgba(0,0,0,0.5);
      padding: 44px 44px 40px;
      box-sizing: border-box;
    }

    .reg-gold-line {
      display: block;
      width: 90px;
      height: 1px;
      margin: 0 auto 24px;
      background: linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%);
    }

    /* ── Two-column grid ── */
    .reg-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    /* ── Label ── */
    .reg-label {
      display: block;
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 8px;
    }
    .reg-label .req { color: #e57373; margin-left: 2px; }

    /* ── Input wrapper ── */
    .reg-input-wrap { position: relative; }
    .reg-input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gold-light);
      opacity: 0.6;
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    /* ── Input ── */
    .reg-input {
      width: 100%;
      padding: 13px 16px 13px 42px;
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
    .reg-input::placeholder { color: rgba(247,240,230,0.3); }
    .reg-input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px var(--gold-08);
    }
    .reg-input.has-error { border-color: #e57373; }
    .reg-input:disabled { opacity: 0.5; cursor: not-allowed; }
    .reg-input.with-toggle { padding-right: 44px; }

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
      color: var(--gold-light);
      transition: color 0.2s;
      line-height: 0;
    }
    .reg-toggle-btn:hover { color: var(--gold); }

    /* ── Field error ── */
    .reg-field-error {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #e57373;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* ── Field hint ── */
    .reg-field-hint {
      font-family: var(--font-body);
      font-size: 12px;
      color: var(--ash);
      margin-top: 6px;
      font-style: italic;
    }

    /* ── Password strength bars ── */
    .reg-strength-bars { display: flex; gap: 4px; margin-top: 8px; }
    .reg-strength-bar {
      flex: 1;
      height: 2px;
      background: var(--border-gold-20);
      transition: background 0.3s;
    }
    .reg-strength-bar.weak   { background: #e57373; }
    .reg-strength-bar.medium { background: #E0A020; }
    .reg-strength-bar.strong { background: #6FBF5C; }
    .reg-strength-label {
      font-family: var(--font-tag);
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .reg-strength-label.weak   { color: #e57373; }
    .reg-strength-label.medium { color: #E0A020; }
    .reg-strength-label.strong { color: #6FBF5C; }

    /* ── Submit button ── */
    .reg-btn-submit {
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
      margin-top: 8px;
    }
    .reg-btn-submit:hover:not(:disabled) {
      background: var(--gold-light);
      transform: translateY(-1px);
    }
    .reg-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Login link ── */
    .reg-login-link {
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
    .reg-login-link:hover { color: var(--gold); border-color: var(--gold); }

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
      background: rgba(255,255,255,0.04);
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
      font-size: 13px;
      color: var(--snow);
      line-height: 1.6;
      opacity: 0.85;
    }
    .reg-checkbox-text button {
      font-family: var(--font-tag);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--gold-light);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }
    .reg-checkbox-text button:hover { color: var(--gold); }

    /* ── Footer text ── */
    .reg-footer-text {
      font-family: var(--font-tag);
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(214,171,52,0.5);
      text-align: center;
      margin-top: 26px;
    }

    /* ══════════════════════════════════════════
       TABLET / MOBILE (≤ 680px) — vuelve a 1 columna
    ══════════════════════════════════════════ */
    @media (max-width: 680px) {
      .reg-grid-2 { grid-template-columns: 1fr; }
    }

    /* ══════════════════════════════════════════
       PANTALLAS CHICAS (≤ 640px)
    ══════════════════════════════════════════ */
    @media (max-width: 640px) {
      .reg-bg-img,
      .reg-bg-overlay { display: none; }

      .reg-root {
        padding: 0;
        background: var(--noir);
        align-items: stretch;
      }

      .reg-card {
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

      .reg-back { left: 20px; top: 22px; }
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
function validate(form) {
  const err = {};

  if (!form.nombre.trim())
    err.nombre = "El nombre es obligatorio.";
  else if (form.nombre.trim().length < 2)
    err.nombre = "Mínimo 2 caracteres.";

  if (!form.email.trim())
    err.email = "El email es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    err.email = "Ingresa un email válido.";

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
    nombre: "", email: "", password: "", confirm: "", terminos: false,
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
        email:    form.email.trim().toLowerCase(),
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

        <img src={bgImage} alt="D'oro — Atelier" className="reg-bg-img" />
        <div className="reg-bg-overlay" />

        <Link to="/login" className="reg-back" aria-label="Regresar al inicio de sesión">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Iniciar sesión
        </Link>

        <div className="reg-card">
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 28px)",
              fontWeight: 300,
              letterSpacing: "0.08em",
              color: "var(--gold-light)",
            }}>
              D<span style={{ fontStyle: "italic", color: "var(--gold)" }}>'</span>ORO
            </span>
          </div>

          <span className="reg-gold-line" />

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.2vw, 32px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--snow)",
            lineHeight: 1.15,
            margin: "0 0 24px",
            letterSpacing: "0.02em",
            textAlign: "center",
          }}>
            Crear una cuenta
          </h1>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Nombre + Correo en la misma fila */}
            <div className="reg-grid-2">
              <Field label="Nombre completo" id="nombre" icon="bi-person" required error={errors.nombre}>
                <input
                  id="nombre" type="text" placeholder="María García"
                  value={form.nombre} onChange={handleChange("nombre")}
                  className={`reg-input${errors.nombre ? " has-error" : ""}`}
                  autoComplete="name" disabled={loading}
                />
              </Field>

              <Field label="Correo electrónico" id="email" icon="bi-envelope" required error={errors.email}>
                <input
                  id="email" type="email" placeholder="correo@ejemplo.com"
                  value={form.email} onChange={handleChange("email")}
                  className={`reg-input${errors.email ? " has-error" : ""}`}
                  autoComplete="email" disabled={loading}
                />
              </Field>
            </div>

            {/* Contraseña + Confirmar en la misma fila */}
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
                    marginTop: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: form.password === form.confirm ? "#6FBF5C" : "#e57373",
                  }}>
                    <i className={`bi ${form.password === form.confirm ? "bi-check-circle" : "bi-x-circle"}`} style={{ fontSize: "11px" }} />
                    {form.password === form.confirm ? "Coinciden" : "No coinciden"}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Terms */}
            <div>
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

            {/* Submit */}
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

            {/* Divider + login CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "8px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-gold-20)" }} />
              <span style={{
                fontFamily: "var(--font-tag)",
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--gold-light)",
                whiteSpace: "nowrap",
              }}>
                ¿Ya tienes una cuenta?
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-gold-20)" }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <Link to="/login" className="reg-login-link">Iniciar sesión</Link>
            </div>
          </form>

          <p className="reg-footer-text">D'oro · Compromiso con nuestros clientes</p>
        </div>
      </div>
    </>
  );
}