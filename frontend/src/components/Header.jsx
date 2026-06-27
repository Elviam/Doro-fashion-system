import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import { fetchNotifications } from "../services/notifications.service";
import { createPortal } from "react-dom";

export default function Header({ onMenuClick }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme !== "light";
    }
    return true;
  });

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const campanaRef = useRef(null);
  const buscadorRef = useRef(null);
  const notifsRef = useRef(null);
  const usuarioRef = useRef(null);
  const dropdownRef = useRef(null);

  const [posNotifs, setPosNotifs] = useState({ top: 0, right: 0 });
  const [totalNotifs, setTotalNotifs] = useState(0);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [mostrarDropdownUsuario, setMostrarDropdownUsuario] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados(null);
      setMostrarModal(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setBuscando(true);
      setMostrarModal(true);

      try {
        const response = await api.get(
          `/search?q=${encodeURIComponent(query.trim())}`
        );
        setResultados(response.data || response);
      } catch (error) {
        console.error("Error en la búsqueda global:", error);
        setResultados(null);
      } finally {
        setBuscando(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
    const handleClickFuera = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setMostrarModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await fetchNotifications();
        setNotifs(data.items ?? []);
        setTotalNotifs(data.total ?? 0);
      } catch {}
    };
    cargar();
  }, []);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (
        notifsRef.current &&
        !notifsRef.current.contains(e.target) &&
        campanaRef.current &&
        !campanaRef.current.contains(e.target)
      ) {
        setMostrarNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        usuarioRef.current &&
        !usuarioRef.current.contains(e.target)
      ) {
        setMostrarDropdownUsuario(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const obtenerConfiguracionRenglon = (tipo, item) => {
    switch (tipo) {
      case "productos":
        return { titulo: item.nombre, sub: `SKU: ${item.sku || "N/A"}`, ruta: "/productos", tag: "Productos", icon: "bi-box-seam text-blue-500" };
      case "clientes":
        return { titulo: item.nombre, sub: item.email || "", ruta: "/clientes", tag: "Clientes", icon: "bi-people text-pink-500" };
      case "proveedores":
        return { titulo: item.nombre, sub: item.contacto || "", ruta: "/proveedores", tag: "Proveedores", icon: "bi-truck text-orange-500" };
      case "usuarios":
        return { titulo: `${item.nombre} ${item.apellido || ""}`, sub: `@${item.usuario}`, ruta: "/usuarios", tag: "Usuarios", icon: "bi-person-badge text-green-500" };
      case "recepciones":
        return { titulo: `Recepción: ${item.proveedor}`, sub: item.comentarios || "", ruta: "/recepciones", tag: "Recepciones", icon: "bi-file-earmark-arrow-down text-purple-500" };
      case "auditoria":
        return { titulo: `Acción: ${item.action}`, sub: item.usuario || "Sistema", ruta: "/auditoria", tag: "Auditoría", icon: "bi-shield-check text-red-500" };
      default:
        return { titulo: "Registro", sub: "", ruta: "/dashboard", tag: "Sistema", icon: "bi-gear text-gris" };
    }
  };

  const listaResultadosPlana = [];
  if (resultados) {
    Object.keys(resultados).forEach((categoria) => {
      if (Array.isArray(resultados[categoria])) {
        resultados[categoria].forEach((item) => {
          listaResultadosPlana.push({ ...item, _categoriaBackend: categoria });
        });
      }
    });
  }

  return (
    <header className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4 w-full px-4 sm:px-6 lg:px-8 py-4 z-50 transition-colors duration-300 bg-blanco border-b border-lila dark:bg-oscuro dark:border-lila-soft/10">
      
      {/* Sección Izquierda / Buscador */}
      <div className="flex items-center gap-3 flex-1 min-w-[240px] w-full md:w-auto">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-lila/30 border border-lila text-morado hover:bg-lila hover:text-oscuro transition-colors dark:bg-bg-card dark:border-lila/20 dark:text-lila dark:hover:bg-lila/20"
        >
          <i className="bi bi-list text-xl" />
        </button>

        <div ref={buscadorRef} className="relative w-full md:max-w-md lg:max-w-lg xl:max-w-xl">
          <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-sm text-morado dark:text-lila-soft"></i>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setMostrarModal(true)}
            placeholder="Buscar en todo el sitio..."
            className="w-full rounded-full pl-10 pr-4 py-2 text-sm outline-none transition-all shadow-sm bg-lila/30 border border-lila text-oscuro placeholder:text-morado/60 focus:ring-2 focus:ring-lila-mid/40 dark:bg-bg-card dark:text-lila dark:border-lila/20 dark:focus:ring-1 dark:focus:ring-lila dark:placeholder-lila/30"
          />

          {mostrarModal && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[45vh] bg-blanco border border-oscuro/10 dark:bg-bg-card dark:border-lila/20 z-50">
              <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
                {buscando ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-gris dark:text-lila-soft">
                    <i className="bi bi-arrow-repeat animate-spin text-2xl text-lila-mid"></i>
                    <span className="text-sm">Buscando coincidencias...</span>
                  </div>
                ) : listaResultadosPlana.length > 0 ? (
                  <div className="space-y-1">
                    <p className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-gris dark:text-lila-soft/60">
                      Coincidencias encontradas
                    </p>
                    {listaResultadosPlana.map((item, index) => {
                      const config = obtenerConfiguracionRenglon(item._categoriaBackend, item);
                      return (
                        <div
                          key={`${item._categoriaBackend}-${item.id}-${index}`}
                          onClick={() => {
                            setMostrarModal(false);
                            navigate(config.ruta);
                          }}
                          className="px-3 py-2 rounded-lg cursor-pointer transition-all flex justify-between items-center group gap-3 hover:bg-lila/30 dark:hover:bg-lila/10"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg flex items-center justify-center bg-bg/30 border dark:bg-oscuro/40 dark:border-lila/5 shrink-0">
                              <i className={`bi ${config.icon} text-base`}></i>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate text-oscuro dark:text-blanco">
                                {config.titulo}
                              </span>
                              <span className="text-xs truncate text-gris dark:text-text-muted">
                                {config.sub}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 hidden sm:block">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-blanco border border-lila-mid text-lila-mid dark:bg-oscuro dark:border-lila/10 dark:text-lila-soft">
                              {config.tag}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm italic text-gris dark:text-lila-soft">
                    No se encontraron coincidencias para "{query}".
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full md:w-auto shrink-0 border-t border-lila/20 pt-3 md:pt-0 md:border-0">
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer shadow-sm active:scale-95 bg-blanco text-morado border border-lila hover:bg-morado hover:text-blanco dark:bg-bg-card dark:text-lila dark:border-lila/20 dark:hover:bg-lila dark:hover:text-oscuro"
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDark ? (
              <i className="bi bi-sun-fill text-lg"></i>
            ) : (
              <i className="bi bi-moon-stars-fill text-lg"></i>
            )}
          </button>

          <div className="relative">
            <div
              ref={campanaRef}
              onClick={() => {
                if (!mostrarNotifs) {
                  const rect = campanaRef.current.getBoundingClientRect();
                  const isMobile = window.innerWidth < 640;
                  setPosNotifs({
                    top: rect.bottom + 12,
                    right: isMobile ? 16 : window.innerWidth - rect.right,
                    isMobile,
                  });
                }
                setMostrarNotifs((v) => !v);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-lila/40 dark:border-lila/10 cursor-pointer hover:bg-lila/20 dark:hover:bg-bg-card relative"
              title="Notificaciones"
            >
              <i className="bi bi-bell text-lg text-morado dark:text-lila"></i>
              {totalNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-rojo text-blanco text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                  {totalNotifs > 99 ? "99+" : totalNotifs}
                </span>
              )}
            </div>

            {mostrarNotifs &&
              createPortal(
                <div
                  ref={notifsRef}
                  style={{
                    position: "fixed",
                    top: posNotifs.top,
                    right: posNotifs.right,
                    ...(posNotifs.isMobile && { left: 16 }),
                  }}
                  className="bg-blanco border border-gris/20 rounded-xl shadow-xl z-[9999] overflow-hidden dark:bg-bg-card dark:border-lila/20 sm:w-80"
                >
                  <div className="px-4 py-3 border-b border-gris/10 flex items-center justify-between dark:border-lila/10">
                    <p className="text-sm font-bold text-oscuro m-0 dark:text-blanco">Notificaciones</p>
                    {totalNotifs > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-lila/30 text-morado font-semibold dark:bg-lila/20 dark:text-lila">
                        {totalNotifs}
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gris opacity-60 dark:text-lila-soft">
                        Todo en orden
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            navigate(n.ruta);
                            setMostrarNotifs(false);
                          }}
                          className="px-4 py-2.5 border-b border-lila/10 hover:bg-lila/30 cursor-pointer transition-colors flex items-start gap-3 dark:border-lila/5 dark:hover:bg-lila/10"
                        >
                          <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            n.nivel === "critico" ? "bg-rojo/10 text-rojo" : "bg-lila/30 text-morado dark:bg-lila/20 dark:text-lila-mid"
                          }`}>
                            <i className={`bi ${n.icon} text-xs`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-oscuro m-0 truncate dark:text-blanco">{n.titulo}</p>
                            <p className="text-[11px] text-gris m-0 truncate dark:text-lila-soft">{n.mensaje}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>

        {/* Perfil del Usuario */}
        <div className="relative">
          <button
            ref={usuarioRef}
            onClick={() => setMostrarDropdownUsuario(!mostrarDropdownUsuario)}
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer shadow-sm bg-lila/30 border border-lila hover:bg-lila dark:bg-bg-card dark:border-lila-soft/20 dark:hover:bg-lila/10"
          >
            <i className="bi bi-person-circle text-xl sm:text-2xl text-morado dark:text-lila-mid"></i>
            
            {/* Oculta los textos en pantallas extremadamente pequeñas para evitar colisiones */}
            <div className="text-left leading-tight hidden xs:block sm:block max-w-[90px] sm:max-w-none">
              <p className="m-0 font-semibold text-xs sm:text-sm text-morado dark:text-blanco truncate">
                {usuario?.nombre || "Usuario"}
              </p>
              <p className="m-0 text-[10px] opacity-80 uppercase tracking-wider text-lila-mid dark:text-lila-soft truncate">
                {usuario?.roleId || usuario?.role || "Invitado"}
              </p>
            </div>

            <i className={`bi bi-chevron-down text-[10px] text-lila-mid transition-all duration-300 dark:text-lila-soft ${mostrarDropdownUsuario ? "rotate-180" : ""}`}></i>
          </button>

          {mostrarDropdownUsuario && (
            <div
              ref={dropdownRef}
              className="absolute top-full right-0 mt-2 w-48 bg-blanco border border-lila/20 rounded-xl shadow-lg overflow-hidden z-50 dark:bg-bg-card dark:border-lila/20"
            >
              <div className="px-4 py-2 border-b border-lila/10 dark:border-lila/10">
                <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gris dark:text-lila-soft">
                  Mi Cuenta
                </p>
              </div>
              <button
                onClick={() => {
                  navigate("/perfil");
                  setMostrarDropdownUsuario(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-lila/20 transition-colors flex items-center gap-3 text-sm text-oscuro dark:text-blanco dark:hover:bg-lila/10"
              >
                <i className="bi bi-person-fill"></i> Mi Perfil
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                  setMostrarDropdownUsuario(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-lila/20 transition-colors flex items-center gap-3 text-sm text-oscuro dark:text-blanco dark:hover:bg-lila/10"
              >
                <i className="bi bi-box-arrow-right"></i> Cerrar sesión
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}