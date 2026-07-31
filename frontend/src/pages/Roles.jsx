import { useEffect, useState } from "react";
import { staffApi } from "../services/api";
import Encabezado from "../components/Encabezado";
import Toast from "../components/Toast";
import useTitulo from "../hooks/useTitulo";
import { getRoleCode } from "../utils/accessControl";

const ROLE_COPY = {
  ADMIN: {
    title: "Administrador",
    description: "Gestiona la operación, el catálogo y el control administrativo de D'oro.",
  },
  BODEGUERO: {
    title: "Bodeguero",
    description: "Opera inventario, preparación de pedidos y recepción de mercancía.",
  },
};

function PermissionList({ permissions }) {
  if (!permissions.length) return <p className="text-sm text-[var(--ash)]">Sin permisos base registrados.</p>;
  return <div className="flex flex-wrap gap-2">{permissions.map((permission) => <span key={permission} className="rounded-[2px] border border-[var(--border-gold-25)] bg-[var(--gold-08)] px-2.5 py-1 font-tag text-[10px] font-semibold tracking-wide text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">{permission}</span>)}</div>;
}

export default function Roles() {
  useTitulo("Roles y permisos");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await staffApi.get("/roles");
      const items = Array.isArray(response.items) ? response.items : [];
      setRoles(items.filter((role) => ["ADMIN", "BODEGUERO"].includes(getRoleCode(role))));
      setError("");
    } catch (requestError) {
      setRoles([]);
      setError(requestError.message || "No fue posible cargar los roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return <div className="min-h-screen bg-[var(--snow)] p-4 sm:p-6 lg:p-8 dark:bg-[var(--noir-soft)]">
    <Toast message={error} type="error" onClose={() => setError("")} />
    <Encabezado titulo="Roles y permisos" onActualizar={load} actualizando={loading} />
    <section className="mt-6 rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--gold-08)] p-5 dark:border-[var(--border-gold-20)]">
      <h2 className="font-display text-xl text-[var(--noir)] dark:text-[var(--snow)]">Roles internos fijos</h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">D'oro opera únicamente con ADMIN y BODEGUERO. Los permisos individuales de cada integrante se ajustan desde Personal; esta vista es informativa y no modifica roles ni claves técnicas.</p>
    </section>
    {loading ? <p className="py-12 text-center text-sm text-[var(--ash)]"><i className="bi bi-arrow-repeat mr-2 inline-block animate-spin text-[var(--gold)]" />Cargando roles y permisos...</p> : (
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        {["ADMIN", "BODEGUERO"].map((code) => {
          const role = roles.find((item) => getRoleCode(item) === code);
          const permissions = Array.isArray(role?.permissions) ? role.permissions.map((permission) => typeof permission === "string" ? permission : permission.code).filter(Boolean) : [];
          return <article key={code} className="rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] p-5 shadow-sm dark:border-[var(--border-gold-20)] dark:bg-[var(--noir)]">
            <p className="font-tag text-xs font-bold tracking-[0.2em] text-[var(--gold-dark)] dark:text-[var(--gold-light)]">{code}</p>
            <h3 className="mt-2 font-display text-2xl text-[var(--noir)] dark:text-[var(--snow)]">{ROLE_COPY[code].title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--noir-soft)] dark:text-[var(--ash)]">{ROLE_COPY[code].description}</p>
            <div className="mt-5 border-t border-[var(--border-gold-20)] pt-4"><p className="mb-3 font-tag text-[10px] font-bold uppercase tracking-wider text-[var(--ash)]">Permisos base</p><PermissionList permissions={permissions} /></div>
          </article>;
        })}
      </section>
    )}
  </div>;
}
