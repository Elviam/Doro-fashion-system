import { useRef, useState } from "react";
import { staffApi } from "../services/api";
import Toast from "./Toast";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };
const PASSWORD_POLICY_MESSAGE = "La nueva contraseña debe tener al menos 8 caracteres.";

export default function CambioPasswordForm({ onSuccess, submitLabel = "Cambiar contraseña" }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "exito" });
  const refs = useRef({});

  const validate = () => {
    const next = {};
    if (!form.currentPassword) next.currentPassword = "Ingresa tu contraseña actual.";
    else if (form.currentPassword.length < 6) next.currentPassword = "La contraseña actual debe tener al menos 6 caracteres.";
    if (!form.newPassword) next.newPassword = "Ingresa una nueva contraseña.";
    else if (form.newPassword.length < 8) next.newPassword = PASSWORD_POLICY_MESSAGE;
    if (!form.confirmPassword) next.confirmPassword = "Confirma la nueva contraseña.";
    else if (form.newPassword !== form.confirmPassword) next.confirmPassword = "Las contraseñas no coinciden.";
    if (form.currentPassword && form.newPassword === form.currentPassword) next.newPassword = "La nueva contraseña debe ser diferente de la contraseña actual.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) refs.current[first]?.focus();
    return Object.keys(next).length === 0;
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      await staffApi.patch("/auth/change-password", form);
      setForm(EMPTY_FORM);
      setErrors({});
      if (onSuccess) onSuccess();
      else setToast({ message: "Contraseña actualizada correctamente.", type: "exito" });
    } catch (error) {
      const rawMessage = error.message || "";
      const message = /actual.*incorrect/i.test(rawMessage)
        ? "La contraseña actual no es correcta."
        : rawMessage || "No fue posible actualizar la contraseña. Inténtalo nuevamente.";
      if (message.includes("contraseña actual")) {
        setErrors({ currentPassword: message });
        refs.current.currentPassword?.focus();
      } else if (message.includes("nueva contraseña")) {
        setErrors({ newPassword: message });
        refs.current.newPassword?.focus();
      } else if (message.includes("contraseñas no coinciden")) {
        setErrors({ confirmPassword: "Las contraseñas no coinciden." });
        refs.current.confirmPassword?.focus();
      }
      setToast({ message: message === "No autorizado." ? "No fue posible actualizar la contraseña. Inténtalo nuevamente." : message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, message: "" }))} />
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PasswordField name="currentPassword" label="Contraseña actual" placeholder="Tu contraseña actual" value={form.currentPassword} error={errors.currentPassword} visible={visible.currentPassword} inputRef={(node) => { refs.current.currentPassword = node; }} onChange={handleChange} onToggle={() => setVisible((current) => ({ ...current, currentPassword: !current.currentPassword }))} disabled={submitting} />
        <PasswordField name="newPassword" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" value={form.newPassword} error={errors.newPassword} visible={visible.newPassword} inputRef={(node) => { refs.current.newPassword = node; }} onChange={handleChange} onToggle={() => setVisible((current) => ({ ...current, newPassword: !current.newPassword }))} disabled={submitting} />
        <PasswordField name="confirmPassword" label="Confirmar nueva contraseña" placeholder="Repite la nueva contraseña" value={form.confirmPassword} error={errors.confirmPassword} visible={visible.confirmPassword} inputRef={(node) => { refs.current.confirmPassword = node; }} onChange={handleChange} onToggle={() => setVisible((current) => ({ ...current, confirmPassword: !current.confirmPassword }))} disabled={submitting} />
        <div className="flex justify-end pt-1 lg:col-span-3">
          <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-5 py-2.5 font-tag text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold)] hover:text-[var(--noir)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--gold)] dark:text-[var(--noir)]">
            <i className={`bi ${submitting ? "bi-arrow-repeat animate-spin" : "bi-key"}`} />
            {submitting ? "Actualizando..." : submitLabel}
          </button>
        </div>
      </form>
      <div className="mt-5 rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] p-4 text-sm text-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--ash)]">
        <p className="font-semibold text-[var(--noir)] dark:text-[var(--snow)]">¿No recuerdas tu contraseña actual?</p>
        <p className="mt-1">Contacta al área de sistemas para solicitar un restablecimiento de contraseña.</p>
      </div>
    </>
  );
}

function PasswordField({ name, label, placeholder, value, error, visible, inputRef, onChange, onToggle, disabled }) {
  return (
    <div>
      <label htmlFor={`change-password-${name}`} className="mb-1.5 block pl-1 font-tag text-[11px] uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{label}</label>
      <div className="relative">
        <input ref={inputRef} id={`change-password-${name}`} type={visible ? "text" : "password"} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={`w-full rounded-[2px] border bg-[var(--snow)] px-4 py-2.5 pr-11 text-sm text-[var(--noir)] transition-colors focus:outline-none dark:bg-[var(--noir)] dark:text-[var(--snow)] ${error ? "border-rojo focus:border-rojo" : "border-[var(--border-gold-40)] focus:border-[var(--gold-dark)] dark:border-[var(--border-gold-20)]"}`} />
        <button type="button" onClick={onToggle} disabled={disabled} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--gold-dark)] hover:text-[var(--noir)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] disabled:opacity-60 dark:text-[var(--gold-light)]" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}><i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} /></button>
      </div>
      {error && <p id={`${name}-error`} className="mt-1 pl-1 text-xs text-rojo" role="alert">{error}</p>}
    </div>
  );
}
