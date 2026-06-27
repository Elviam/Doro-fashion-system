import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, Users, Truck, UserCog, ShieldCheck, Shield, ShoppingCart, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Boton from "./Boton";

const navItems = [
  {
    section: "GENERAL",
    items: [
      { label: "Dashboard",   ruta: "/dashboard",   icon: LayoutDashboard, permiso: "dashboard:read" },
      { label: "Productos",   ruta: "/productos",   icon: Package,         permiso: "products:read" },
    ],
  },
  {
    section: "GESTIÓN",
    items: [
      { label: "Recepciones", ruta: "/recepciones", icon: ClipboardList,   permiso: "recepciones:read" },
      { label: "Ventas",      ruta: "/ventas",      icon: ShoppingCart,    permiso: "ventas:read" },
      { label: "Clientes",    ruta: "/clientes",    icon: Users,           permiso: "clients:read" },
      { label: "Proveedores", ruta: "/proveedores", icon: Truck,           permiso: "suppliers:read" },
      { label: "Usuarios",    ruta: "/usuarios",    icon: UserCog,         permiso: "users:read" },
    ],
  },
  {
    section: "CONTROL",
    items: [
      { label: "Roles",       ruta: "/roles",       icon: Shield,          permiso: "roles:read" },
      { label: "Auditoría",   ruta: "/auditoria",   icon: ShieldCheck,     permiso: "audit:read" },
      { label: "Inventario",  ruta: "/inventario",  icon: Package,         permiso: "inventory:read" },

    ],
  },
];

export default function Sidebar() {
  const { logout, usuario } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true"
  );

  const handleIrAlaTienda = () => {
    navigate("/tienda");   
  };

  const tienePermiso = (permisoRequerido) => {
    if (!permisoRequerido) return true; 
    
    // Permitir a admins directamente
    if (usuario?.roleId === "role_admin" || usuario?.roleId === "ADMIN" || usuario?.roleId === "GERENTE") {
      return true;
    }
    
    // Para otros, verificar permisos dinámicos
    if (!usuario?.permissions) return false; 
    return usuario.permissions.includes(permisoRequerido);
  };

  return (
    <aside
      className="relative flex flex-col h-screen shrink-0 overflow-hidden border-r border-oscuro/10 dark:border-white/5 transition-all duration-300 bg-lila dark:bg-bg-card"
      style={{ width: collapsed ? "72px" : "260px" }}
    >
      {/* Glow decorativo */}
      <div className="absolute -top-30 -left-25 w-62.5 h-62.5 blur-3xl rounded-full pointer-events-none bg-blanco/50 dark:bg-lila/10" />

      {/* Botón toggle */}
      <button
        onClick={() => setCollapsed((c) => {
          localStorage.setItem("sidebar-collapsed", String(!c));
          return !c;
        })}
        className="absolute top-4 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-blanco/50 hover:bg-blanco text-oscuro dark:bg-lila-mid/15 dark:hover:bg-lila-mid/30 dark:text-lila shadow-sm dark:shadow-none"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div className={`shrink-0 text-center overflow-hidden transition-all duration-300 ${collapsed ? "px-2 pt-8 pb-4" : "px-8 pt-8 pb-10"}`}>
        {collapsed ? (
          <div className="flex justify-center mt-8">
            <div className="w-2.5 h-2.5 rounded-full bg-verde shadow-[0_0_8px_var(--color-verde)] opacity-80 dark:opacity-100" />
          </div>
        ) : (
          <>
            <h1 className="text-6xl tracking-tight leading-none drop-shadow-[0_0_12px_rgba(44,42,74,0.15)] dark:drop-shadow-[0_0_12px_rgba(231,214,255,0.15)] font-cinzel text-oscuro dark:text-lila">
              AURA
            </h1>

            <div className="relative mt-7 flex items-center justify-center">
              <div className="w-full h-px bg-linear-to-r from-transparent via-oscuro/20 dark:via-lila-mid/50 to-transparent" />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-oscuro shadow-[0_0_15px_4px_rgba(44,42,74,0.3)] dark:bg-lila-soft dark:shadow-[0_0_15px_4px_rgba(201,184,232,0.6)]" />
            </div>

            <div className="mt-7 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-sm border-oscuro/10 bg-blanco/60 dark:border-lila-soft/20 dark:bg-white/3">
                <div className="w-2 h-2 rounded-full bg-verde" />
                <span className="text-sm tracking-[2px] font-medium font-poppins text-oscuro/70 dark:text-lila-soft">
                  ONLINE
                </span>
              </div>
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
            <div key={group.section} className="mb-6">
              {collapsed
                ? <div className="mb-2 h-px bg-oscuro/5 dark:bg-white/5" />
                : (
                  <h2 className="px-4 mb-4 text-[12px] tracking-[4px] font-medium font-poppins text-oscuro/50 dark:text-lila-soft/60">
                    {group.section}
                  </h2>
                )
              }

              <div className="flex flex-col gap-2">
                {itemsConPermiso.map(({ label, ruta, icon: Icon }) => {
                  const isActive = location.pathname === ruta;

                  return (
                    <button
                      key={label}
                      onClick={() => navigate(ruta)}
                      title={collapsed ? label : undefined}
                      
                      className={`group relative flex items-center w-full h-12.5 rounded-2xl transition-all duration-300 overflow-hidden ${
                        collapsed ? "justify-center px-0" : "gap-4 px-5"
                      } ${
                        isActive
                          ? "bg-blanco shadow-[0_0_20px_rgba(166,141,200,0.35)] dark:bg-[#31275E] dark:shadow-[0_0_20px_rgba(139,92,246,0.18)]"
                          : "hover:bg-blanco/40 dark:hover:bg-white/4"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-[70%] rounded-r-full bg-lila-mid shadow-[0_0_15px_rgba(166,141,200,0.8)] dark:bg-[#BFA7FF] dark:shadow-[0_0_15px_rgba(191,167,255,0.9)]" />
                      )}

                      <div className={`transition-all duration-300 group-hover:scale-110 ${isActive ? "text-oscuro dark:text-white" : "text-oscuro/70 dark:text-lila"}`}>
                        <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                      </div>

                      {!collapsed && (
                        <span className={`text-[17px] transition-all duration-300 group-hover:translate-x-1 font-poppins ${
                          isActive ? "text-oscuro font-semibold dark:text-white" : "text-oscuro/80 font-medium dark:text-lila/80"
                        }`}>
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

      {/* Footer */}
      <div className="shrink-0 p-3 border-t backdrop-blur-sm bg-blanco/50 border-oscuro/5 dark:bg-black/10 dark:border-white/5">
        <Boton
          variante="claro"
          onClick={handleIrAlaTienda}
          title={collapsed ? "Tienda" : undefined}
          className={`group flex items-center justify-center w-full py-3! rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(231,214,255,0.25)] font-poppins ${
            collapsed ? "px-0!" : "gap-3 text-lg" 
          }`}
        >
          <ShoppingCart size={21} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-x-1" />
          {!collapsed && "Tienda"}
        </Boton>
      </div>
    </aside>
  );
}