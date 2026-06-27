import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

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
    err.rfc = "RFC inválido. Ej: GARM850101AB3";

  if (!form.email.trim())
    err.email = "El email es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    err.email = "Ingresa un email válido.";

  if (!form.telefono.trim())
    err.telefono = "El teléfono es obligatorio.";
  else if (!TEL_REGEX.test(form.telefono.trim()))
    err.telefono = "Ingresa un teléfono válido (10 dígitos).";

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

function getStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return [
    { label: "Débil",    barColor: "bg-rojo",     textColor: "text-rojo",     bars: 1 },
    { label: "Moderada", barColor: "bg-amarillo",  textColor: "text-amarillo", bars: 2 },
    { label: "Fuerte",   barColor: "bg-verde",     textColor: "text-verde",    bars: 3 },
  ][(score - 1)] ?? { label: "Débil", barColor: "bg-rojo", textColor: "text-rojo", bars: 1 };
}

function SectionDivider({ icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <i className={`bi ${icon} text-xs text-text-muted`}></i>
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <div className="flex-1 h-px bg-lila/10" />
    </div>
  );
}

function Field({ label, id, icon, error, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-lila-mid flex items-center gap-1">
        {label}
        {required && <span className="text-rojo">*</span>}
      </label>
      <div className="relative">
        <i className={`bi ${icon} absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none`} />
        {children}
      </div>
      {error && (
        <p className="text-[11px] text-rojo flex items-center gap-1">
          <i className="bi bi-exclamation-circle text-xs" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}

const baseInput =
  "w-full bg-oscuro text-lila border border-lila/15 rounded-xl " +
  "pl-9 pr-4 py-2.5 text-sm font-poppins outline-none " +
  "placeholder-lila/20 transition-all duration-200 " +
  "hover:border-lila/35 focus:border-lila/55 focus:ring-1 focus:ring-lila/15";

const errorInput = "border-rojo/50 focus:border-rojo/60 focus:ring-rojo/15";

export default function Register() {
  const navigate     = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre:   "",
    rfc:      "",
    email:    "",
    telefono: "",
    usuario:  "",
    password: "",
    confirm:  "",
    terminos: false,
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
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

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

      setToast({ message: "¡Cuenta creada exitosamente!", type: "success" });
      setTimeout(() => navigate("/tienda"), 1200);

    } catch (err) {
      if (err.field) {
        setErrors({ [err.field]: err.message });
      } else {
        setToast({ message: err.message ?? "Error al crear la cuenta.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-oscuro flex items-center justify-center p-4 font-poppins">

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "error" })}
      />

      <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">

        <div
          className="hidden lg:flex flex-col justify-between w-[38%] p-10 relative overflow-hidden"
          style={{ background: "#221E3A" }}
        >
          <div className="absolute w-64 h-64 rounded-full border border-lila/8 -top-20 -right-20 pointer-events-none" />
          <div className="absolute w-40 h-40 rounded-full border border-lila/6 -bottom-10 -left-10 pointer-events-none" />

          <div>
            <p className="text-5xl font-black text-lila tracking-widest leading-none font-cinzel">
              AURA
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted mt-1.5">
              Tienda en línea
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-lila leading-snug mb-2">
              Bienvenido,<br />crea tu cuenta
            </h2>
            <p className="text-xs text-text-muted leading-relaxed mb-5">
              Regístrate para acceder a tus pedidos y ofertas exclusivas.
            </p>
            {[
              { dot: "bg-verde",    text: "Historial de compras" },
              { dot: "bg-azul",     text: "Seguimiento de pedidos" },
              { dot: "bg-amarillo", text: "Ofertas exclusivas" },
            ].map(({ dot, text }) => (
              <div key={text} className="flex items-center gap-2.5 mb-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
                <span className="text-xs text-lila-mid">{text}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-text-muted/40">
            © 2026 AURA · Todos los derechos reservados
          </p>
        </div>

        <div className="flex-1 bg-bg-card p-8 md:p-10 flex flex-col justify-center">

          <div className="mb-6">
            <h1 className="text-lg font-bold text-lila">Crear usuario</h1>
            <p className="text-xs text-text-muted mt-1">
              Los campos con <span className="text-rojo">*</span> son obligatorios
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <SectionDivider icon="bi-person" label="Datos personales" />
              <div className="grid grid-cols-2 gap-4">

                <Field label="Nombre" id="nombre" icon="bi-person" required error={errors.nombre}>
                  <input
                    id="nombre" type="text" placeholder="María García"
                    value={form.nombre} onChange={handleChange("nombre")}
                    className={`${baseInput} ${errors.nombre ? errorInput : ""}`}
                    autoComplete="name" disabled={loading}
                  />
                </Field>

                <Field
                  label="RFC" id="rfc" icon="bi-card-text" required
                  error={errors.rfc} hint="Ej: GARM850101AB3"
                >
                  <input
                    id="rfc" type="text" placeholder="GARM850101AB3"
                    value={form.rfc} onChange={handleChange("rfc")}
                    className={`${baseInput} uppercase ${errors.rfc ? errorInput : ""}`}
                    autoComplete="off" disabled={loading} maxLength={13}
                  />
                </Field>

              </div>
            </div>

            <div>
              <SectionDivider icon="bi-envelope" label="Contacto" />
              <div className="grid grid-cols-2 gap-4">

                <Field label="Email" id="email" icon="bi-envelope" required error={errors.email}>
                  <input
                    id="email" type="email" placeholder="tucorreo@ejemplo.com"
                    value={form.email} onChange={handleChange("email")}
                    className={`${baseInput} ${errors.email ? errorInput : ""}`}
                    autoComplete="email" disabled={loading}
                  />
                </Field>

                <Field label="Teléfono" id="telefono" icon="bi-telephone" required error={errors.telefono}>
                  <input
                    id="telefono" type="tel" placeholder="464 123 4567"
                    value={form.telefono} onChange={handleChange("telefono")}
                    className={`${baseInput} ${errors.telefono ? errorInput : ""}`}
                    autoComplete="tel" disabled={loading}
                  />
                </Field>

              </div>
            </div>

            <div>
              <SectionDivider icon="bi-lock" label="Acceso" />
              <div className="space-y-3">

                <Field
                  label="Usuario" id="usuario" icon="bi-at"
                  error={errors.usuario} hint="Mínimo 3 caracteres, sin espacios">
                  <input
                    id="usuario" type="text" placeholder="maria_garcia"
                    value={form.usuario} onChange={handleChange("usuario")}
                    className={`${baseInput} ${errors.usuario ? errorInput : ""}`}
                    autoComplete="username" disabled={loading}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">

                  <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-lila-mid">
                      Contraseña
                    </label>
                    <div className="relative">
                      <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none" />
                      <input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange("password")}
                        className={`${baseInput} pr-10 ${errors.password ? errorInput : ""}`}
                        autoComplete="new-password" disabled={loading}
                      />
                      <button
                        type="button" onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-lila-mid transition-colors cursor-pointer bg-transparent border-none"
                        aria-label="Mostrar contraseña"
                      >
                        <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"} text-sm`} />
                      </button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength && i < strength.bars ? strength.barColor : "bg-lila/10"
                        }`} />
                      ))}
                    </div>
                    {errors.password ? (
                      <p className="text-[11px] text-rojo flex items-center gap-1">
                        <i className="bi bi-exclamation-circle text-xs" />{errors.password}
                      </p>
                    ) : form.password && strength ? (
                      <p className={`text-[11px] ${strength.textColor}`}>
                        Seguridad: {strength.label}
                      </p>
                    ) : (
                      <p className="text-[11px] text-text-muted">Mínimo 6 caracteres</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-wider text-lila-mid">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none" />
                      <input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.confirm}
                        onChange={handleChange("confirm")}
                        className={`${baseInput} pr-10 ${errors.confirm ? errorInput : ""}`}
                        autoComplete="new-password" disabled={loading}
                      />
                      <button
                        type="button" onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-lila-mid transition-colors cursor-pointer bg-transparent border-none"
                        aria-label="Mostrar contraseña">
                        <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"} text-sm`} />
                      </button>
                    </div>
                    {errors.confirm ? (
                      <p className="text-[11px] text-rojo flex items-center gap-1">
                        <i className="bi bi-exclamation-circle text-xs" />{errors.confirm}
                      </p>
                    ) : form.confirm && form.password ? (
                      <p className={`text-[11px] flex items-center gap-1 ${
                        form.password === form.confirm ? "text-verde" : "text-rojo"
                      }`}>
                        <i className={`bi ${form.password === form.confirm ? "bi-check-circle" : "bi-x-circle"} text-xs`} />
                        {form.password === form.confirm ? "Coinciden" : "No coinciden"}
                      </p>
                    ) : null}
                  </div>

                </div>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox" checked={form.terminos}
                  onChange={handleChange("terminos")}
                  className="mt-0.5 accent-lila cursor-pointer flex-shrink-0"
                  disabled={loading}
                />
                <span className="text-xs text-text-muted leading-relaxed group-hover:text-lila-soft transition-colors">
                  Acepto los{" "}
                  <button type="button" className="text-lila-mid font-semibold hover:text-lila bg-transparent border-none cursor-pointer p-0">
                    Términos y condiciones
                  </button>{" "}
                  y el{" "}
                  <button type="button" className="text-lila-mid font-semibold hover:text-lila bg-transparent border-none cursor-pointer p-0">
                    Aviso de privacidad
                  </button>.
                </span>
              </label>
              {errors.terminos && (
                <p className="text-[11px] text-rojo flex items-center gap-1 mt-1 ml-6">
                  <i className="bi bi-exclamation-circle text-xs" />{errors.terminos}
                </p>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-lila text-oscuro font-bold text-sm rounded-xl py-3
                         hover:bg-lila-soft transition-all active:scale-[0.98] cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2">
              {loading ? (
                <><i className="bi bi-arrow-repeat animate-spin text-base" />Creando cuenta...</>
              ) : (
                <><i className="bi bi-person-plus text-base" />Crear cuenta</>
              )}
            </button>

            <p className="text-center text-xs text-text-muted">
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button" onClick={() => navigate("/login")}
                className="text-lila-mid font-bold hover:text-lila transition-colors bg-transparent border-none cursor-pointer p-0">
                Inicia sesión
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
