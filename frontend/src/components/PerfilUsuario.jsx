import { useState, useEffect } from "react";
import { api } from "../services/api";
import Toast from "./Toast";

const ACTION_CFG = {
  CREATE:        { label: "CREATE",  clases: "bg-verde/12 border-verde/35 text-green-700 dark:text-verde" },
  UPDATE:        { label: "UPDATE",  clases: "bg-amarillo/12 border-amarillo/35 text-yellow-700 dark:text-amarillo" },
  DELETE:        { label: "DELETE",  clases: "bg-rojo/12 border-rojo/35 text-red-700 dark:text-rojo" },
  TOGGLE_ACTIVE: { label: "TOGGLE",  clases: "bg-azul/12 border-azul/35 text-blue-700 dark:text-azul" },
};

function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CFG[action] || {
    label: action,
    clases: "bg-[var(--gold-08)] border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs lg:text-sm font-tag font-semibold whitespace-nowrap border ${cfg.clases}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDetails(details) {
  if (!details) return "Sin detalles";
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ");
  }
  return String(details);
}

export default function PerfilUsuario({ usuario }) {
  const [auditoria, setAuditoria] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordVisible, setPasswordVisible] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "exito" });

  useEffect(() => {
    const cargarAuditoria = async () => {
      try {
        const data = await api.get("/audit?limit=50");
        const movimientos = (data.items || [])
          .filter(item => item.usuario === usuario?.usuario)
          .slice(0, 20);
        setAuditoria(movimientos);
      } catch (error) {
        console.error("Error cargando auditoría:", error);
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.usuario) {
      cargarAuditoria();
    }
  }, [usuario?.usuario]);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({ ...current, [name]: value }));
  };

  const handleCambiarPassword = async (event) => {
    event.preventDefault();
    if (passwordData.newPassword.length < 8) {
      setToast({ message: "La nueva contraseña debe tener al menos 8 caracteres.", type: "error" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ message: "Las nuevas contraseñas no coinciden.", type: "error" });
      return;
    }

    try {
      setGuardandoPassword(true);
      const result = await api.patch("/auth/change-password", passwordData);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToast({ message: result.message || "Contraseña actualizada correctamente.", type: "exito" });
    } catch (error) {
      setToast({ message: error.message || "No fue posible cambiar la contraseña.", type: "error" });
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 box-border">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, message: "" }))} />
      
      <div className="rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] p-5 shadow-lg dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)] sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-[var(--gold-08)] text-[var(--gold-dark)] dark:text-[var(--gold-light)]"><i className="bi bi-shield-lock text-lg" /></div>
          <div>
            <h3 className="font-display text-base font-bold text-[var(--noir)] dark:text-[var(--snow)] lg:text-lg">Seguridad</h3>
            <p className="mt-1 font-body text-xs text-[var(--noir-soft)] dark:text-[var(--ash)]">Cambia tu contraseña conociendo la actual. Nadie puede verla después de guardarla.</p>
          </div>
        </div>

        <form onSubmit={handleCambiarPassword} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PasswordField label="Contraseña actual" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} visible={passwordVisible.currentPassword} onToggle={() => setPasswordVisible((current) => ({ ...current, currentPassword: !current.currentPassword }))} placeholder="Tu contraseña actual" />
          <PasswordField label="Nueva contraseña" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} visible={passwordVisible.newPassword} onToggle={() => setPasswordVisible((current) => ({ ...current, newPassword: !current.newPassword }))} placeholder="Mínimo 8 caracteres" />
          <PasswordField label="Confirmar nueva contraseña" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} visible={passwordVisible.confirmPassword} onToggle={() => setPasswordVisible((current) => ({ ...current, confirmPassword: !current.confirmPassword }))} placeholder="Repite la nueva contraseña" />
          <div className="flex justify-end pt-1 lg:col-span-3">
            <button type="submit" disabled={guardandoPassword} className="flex items-center gap-2 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-5 py-2.5 font-tag text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold)] hover:text-[var(--noir)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--gold)] dark:text-[var(--noir)]">
              <i className={`bi ${guardandoPassword ? "bi-arrow-repeat animate-spin" : "bi-key"}`} />
              {guardandoPassword ? "Guardando" : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] shadow-lg p-5 sm:p-6 w-full bg-[var(--snow)] dark:bg-[var(--noir-soft)] backdrop-blur-sm box-border">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] bg-gradient-to-br from-[var(--gold)] via-[var(--gold-dark)] to-[var(--gold-light)] flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--noir)] select-none">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-[var(--noir)] dark:text-[var(--snow)] mb-2.5 break-words">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <div className="space-y-2 font-body text-xs sm:text-sm lg:text-base">
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] truncate">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Usuario:</span> @{usuario?.usuario}
              </p>
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)] break-all sm:break-normal">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Email:</span> {usuario?.email}
              </p>
              <p className="text-[var(--noir-soft)] dark:text-[var(--ash)]">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Rol:</span> {usuario?.role || "N/A"}
              </p>
              <div className="text-[var(--noir-soft)] dark:text-[var(--ash)] flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="font-semibold text-[var(--gold-dark)] dark:text-[var(--gold-light)]">Estado:</span>
                <span className={`font-tag inline-block px-2 py-0.5 rounded-[2px] text-xs lg:text-sm font-semibold border ${
                  usuario?.activo
                    ? "bg-verde/20 text-green-700 dark:text-verde border-verde/30"
                    : "bg-rojo/20 text-red-700 dark:text-rojo border-rojo/30"
                }`}>
                  {usuario?.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] shadow-lg p-5 sm:p-6 w-full bg-[var(--snow)] dark:bg-[var(--noir-soft)] backdrop-blur-sm box-border">
        <h3 className="font-display text-base lg:text-lg font-bold text-[var(--noir)] dark:text-[var(--snow)] mb-4 flex items-center gap-2">
          <i className="bi bi-clock-history text-[var(--gold)]" />
          Movimientos Recientes
        </h3>

        {cargando ? (
          <div className="text-center py-10 font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm lg:text-base">
            <p>Cargando movimientos...</p>
          </div>
        ) : auditoria.length === 0 ? (
          <div className="text-center py-10 font-body text-[var(--noir-soft)] dark:text-[var(--ash)] text-sm lg:text-base">
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {auditoria.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] bg-[var(--gold-08)] hover:bg-[var(--gold-08)]/70 transition box-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 w-full">
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <ActionBadge action={item.action} />
                      <span className="font-tag text-[10px] lg:text-xs font-bold text-[var(--noir-soft)] dark:text-[var(--ash)] uppercase tracking-wider bg-[var(--snow)] dark:bg-[var(--noir)] px-2 py-0.5 rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] whitespace-nowrap">
                        {item.resource}
                      </span>
                    </div>
                    
                    <p className="font-mono text-xs sm:text-sm lg:text-base text-[var(--noir)] dark:text-[var(--snow)] bg-[var(--snow)] dark:bg-[var(--noir)] p-2.5 rounded-[2px] border border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] break-all sm:break-words max-h-24 overflow-y-auto custom-scrollbar w-full box-border">
                      {formatDetails(item.details)}
                    </p>
                  </div>

                  <div className="text-left lg:text-right shrink-0 border-t border-[var(--border-gold-25)] dark:border-[var(--border-gold-20)] lg:border-0 pt-2 lg:pt-0.5">
                    <span className="font-body text-[11px] lg:text-xs text-[var(--noir-soft)] dark:text-[var(--ash)] block lg:inline font-medium whitespace-nowrap">
                      <i className="bi bi-calendar3 lg:hidden mr-1.5 opacity-60" />
                      {fmtDateShort(item.createdAt)}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, visible, onToggle, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block pl-1 font-tag text-[11px] uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] px-4 py-2.5 pr-11 text-sm text-[var(--noir)] transition-colors focus:border-[var(--gold-dark)] focus:outline-none dark:border-[var(--border-gold-20)] dark:bg-[var(--noir)] dark:text-[var(--snow)]"
        />
        <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--gold-dark)] hover:text-[var(--noir)] dark:text-[var(--gold-light)]" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
          <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
        </button>
      </div>
    </div>
  );
}
