import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, Users, Truck, UserCog, ShieldCheck, Shield, ShoppingCart, ChevronLeft, ChevronRight, Book } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  {
    section: "GENERAL",
    items: [
      { label: "Dashboard",   ruta: "/dashboard",   icon: LayoutDashboard, permiso: "dashboard:read" },
      
    ],
  },
  {
    section: "GESTIÓN",
    items: [
      { label: "Ventas",      ruta: "/ventas",      icon: ShoppingCart,    permiso: "ventas:read" },
      { label: "Productos",   ruta: "/productos",   icon: Package,         permiso: "products:read" },
      { label: "Inventario",  ruta: "/inventario",  icon: Book,         permiso: "inventory:read" },
      { label: "Recepciones", ruta: "/recepciones", icon: ClipboardList,   permiso: "recepciones:read" },
      { label: "Clientes",    ruta: "/clientes",    icon: Users,           permiso: "clients:read" },
      { label: "Proveedores", ruta: "/proveedores", icon: Truck,           permiso: "suppliers:read" },
      
    ],
  },
  {
    section: "CONTROL",
    items: [
      { label: "Usuarios",    ruta: "/usuarios",    icon: UserCog,         permiso: "users:read" },
      { label: "Roles",       ruta: "/roles",       icon: Shield,          permiso: "roles:read" },
      { label: "Auditoría",   ruta: "/auditoria",   icon: ShieldCheck,     permiso: "audit:read" },
      

    ],
  },
];

// ---------------------------------------------------------------------------
// Google Fonts 
// ---------------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  `}</style>
);

export default function Sidebar({ onCerrar }) {
  const { logout, usuario } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true"
  );

  const [esDesktop, setEsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setEsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isCollapsed = collapsed && esDesktop;
   const manejarToggle = () => {
    if (esDesktop) {
      // En desktop: colapsa/expande el sidebar
      setCollapsed((c) => {
        localStorage.setItem("sidebar-collapsed", String(!c));
        return !c;
      });
    } else {
      // En móvil: el sidebar es un drawer, así que "<" lo cierra
      onCerrar?.();
    }
  };
  const tienePermiso = (permisoRequerido) => {
      if (!permisoRequerido) return true;

      // Permitir a admins y gerentes directamente
      if (usuario?.role === "ADMIN" || usuario?.role === "GERENTE") {
        return true;
      }

      // Para otros roles, verificar permisos dinámicos del JWT
      if (!usuario?.permissions) return false;
      return usuario.permissions.includes(permisoRequerido);
    };

    return (
      <aside
        className="relative z-10 flex flex-col h-screen shrink-0 overflow-hidden transition-all duration-300 bg-[var(--ivory-deep)] dark:bg-[var(--noir)] border-r border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)]"
        style={{
          width: isCollapsed ? "64px" : "225px",
        }}
      >
      <FontLoader />

      {/* Glow decorativo dorado */}
        <div
        className="absolute -top-30 -left-25 w-62.5 h-62.5 blur-3xl rounded-full pointer-events-none"
        style={{ background: "var(--gold-15)" }}
      />

      {/* Botón toggle — visible en todos los tamaños de pantalla */}
       <button
            onClick={manejarToggle}
            className="flex absolute top-3.5 right-2.5 z-10 w-6 h-6 rounded-full items-center justify-center transition-colors duration-300
              bg-[var(--gold-08)] text-[var(--gold-dark)] border border-[var(--border-gold-40)]
              hover:bg-[var(--gold-15)] hover:border-[var(--border-gold-55)]
              dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:border-[var(--border-gold-40)]"
          >
            {esDesktop
              ? (collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />)
              : <ChevronLeft size={12} />}
      </button>

      {/* Header */}
      <div
        className={`shrink-0 text-center overflow-hidden transition-all duration-300 ${
          isCollapsed ? "px-2 pt-7 pb-3.5" : "px-7 pt-7 pb-8.5"
        }`}
      >
        {!isCollapsed && (
          <>
            <h1
              className="flex items-baseline justify-center gap-0.5 uppercase text-[var(--noir)] dark:text-[var(--snow)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: "31px",
                letterSpacing: "0.22em",
                lineHeight: 1,
                filter: "drop-shadow(0 0 12px var(--gold-15))",
              }}
            >
              D
              <span className="text-[var(--gold)]">'</span>
              ORO
            </h1>

            <div className="relative mt-6 flex items-center justify-center">
              <div
                className="w-full h-px"
                style={{
                  background:
                    "linear-gradient(to right, transparent, var(--border-gold-55), transparent)",
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {navItems.map((group) => {
          const itemsConPermiso = group.items.filter(item => tienePermiso(item.permiso));
          if (itemsConPermiso.length === 0) return null;

          return (
            <div key={group.section} className="mb-5">
              {isCollapsed
                ? <div className="mb-2 h-px" style={{ background: "var(--border-gold-20)" }} />
                : (
                  <h2
                    className="px-4 mb-3.5 text-[var(--gold-dark)] dark:text-[var(--gold-60)]"
                    style={{
                      fontFamily: "var(--font-tag)",
                      fontSize: "12px",
                      letterSpacing: "3.5px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                    }}
                  >
                    {group.section}
                  </h2>
                )
              }

              <div className="flex flex-col gap-1.5">
                {itemsConPermiso.map(({ label, ruta, icon: Icon }) => {
                  const isActive = location.pathname === ruta;

                  return (
                    <button
                      key={label}
                      onClick={() => {
                        navigate(ruta);
                        if (!esDesktop) {
                          onCerrar?.();
                        }
                      }}
                      title={isCollapsed ? label : undefined}
                      
                      className={`group relative flex items-center w-full h-11 rounded-[2px] transition-all duration-300 overflow-hidden ${
                        isCollapsed ? "justify-center px-0" : "gap-3.5 px-4.5"
                      } ${
                        isActive
                          ? "bg-[var(--gold-15)] border border-[var(--border-gold-25)] shadow-[0_0_20px_var(--gold-15)]"
                          : "bg-transparent hover:bg-[var(--gold-08)]"
                      }`}
                    >
                      {isActive && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-[70%] rounded-r-full"
                          style={{ background: "var(--gold)", boxShadow: "0 0 15px var(--gold-50)" }}
                        />
                      )}

                      <div
                        className={`transition-all duration-300 group-hover:scale-110 ${
                          isActive ? "text-[var(--gold-dark)] dark:text-[var(--gold-light)]" : "text-[var(--gold-dark)]/70 dark:text-[var(--ash)]"
                        }`}
                      >
                        <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                      </div>

                      {!isCollapsed && (
                        <span
                          className={`transition-all duration-300 group-hover:translate-x-1 ${
                            isActive ? "text-[var(--noir-soft)] dark:text-[var(--snow)]" : "text-[var(--noir-soft)]/80 dark:text-[var(--ash)]"
                          }`}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "16px",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}