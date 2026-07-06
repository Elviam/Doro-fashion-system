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
  // Controla si en pantallas pequeñas el input de búsqueda está expandido (modo icono -> input)
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);

  const campanaRef = useRef(null);
  const buscadorRef = useRef(null);
  const inputBusquedaRef = useRef(null);
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

  // Cierra el modo búsqueda en móvil si se hace click fuera del buscador
  useEffect(() => {
    if (!busquedaMovilAbierta) return;
    const handleClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setBusquedaMovilAbierta(false);
        setMostrarModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [busquedaMovilAbierta]);

  useEffect(() => {
    if (busquedaMovilAbierta && inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  }, [busquedaMovilAbierta]);

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

  // Click en la barra de búsqueda: si ya está desplegado el dropdown, lo cierra (toggle).
  const manejarClickBuscador = () => {
    if (mostrarModal) {
      setMostrarModal(false);
    } else if (query.trim().length >= 2) {
      setMostrarModal(true);
    }
  };

  return (
    <header className="relative z-20 flex flex-nowrap items-center gap-2 sm:gap-2.5 lg:gap-3.5 w-full px-3 sm:px-5 lg:px-7 py-2.5 transition-colors duration-300 font-body bg-[var(--ivory-deep)] border-b border-[var(--border-gold-40)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)]">

      {/* Botón de menú (sólo móvil) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-[2px] transition-colors bg-[var(--gold-08)] border border-[var(--border-gold-40)] text-[var(--gold-dark)] hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)] dark:hover:bg-[var(--gold-15)]"
      >
        <i className="bi bi-list text-xl" />
      </button>

      {/* Sección Izquierda / Buscador + Notificaciones agrupados */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">

      <div
        ref={buscadorRef}
        className={`relative flex items-center min-w-0 transition-all duration-200 ${
          busquedaMovilAbierta ? "flex-1" : "shrink-0 sm:flex-1 sm:max-w-md lg:max-w-lg xl:max-w-xl"
        }`}
      >
        {/* Versión icono: visible sólo en pantallas muy pequeñas cuando el buscador está cerrado */}
        {!busquedaMovilAbierta && (
          <button
            onClick={() => setBusquedaMovilAbierta(true)}
            className="sm:hidden flex items-center justify-center w-10 h-10 shrink-0 rounded-[2px] bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
            title="Buscar"
          >
            <i className="bi bi-search text-lg" />
          </button>
        )}

        {/* Input completo: siempre visible en sm+, y en móvil sólo si está expandido */}
        <div className={`relative w-full ${busquedaMovilAbierta ? "block" : "hidden sm:block"}`}>
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--gold-dark)] dark:text-[var(--gold-light)]"></i>
          <input
            ref={inputBusquedaRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={manejarClickBuscador}
            placeholder="Buscar en todo el sitio..."
            className="w-full h-10 rounded-[2px] pl-9.5 pr-4 text-base outline-none transition-all shadow-sm font-body bg-[var(--snow)] border border-[var(--border-gold-40)] text-[var(--gold-dark)] placeholder:text-[var(--gold-dark)] focus:ring-1 focus:ring-[var(--gold)] dark:bg-[var(--noir-soft)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:focus:ring-1 dark:focus:ring-[var(--gold)] dark:placeholder-[var(--ash)]"
          />

          {mostrarModal && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-[2px] shadow-xl overflow-hidden flex flex-col max-h-[45vh] bg-[var(--snow)] border border-[var(--border-gold-40)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] z-50">
              <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
                {buscando ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-[var(--gold-dark)] dark:text-[var(--ash)]">
                    <i className="bi bi-arrow-repeat animate-spin text-2xl text-[var(--gold)]"></i>
                    <span className="text-sm">Buscando coincidencias...</span>
                  </div>
                ) : listaResultadosPlana.length > 0 ? (
                  <div className="space-y-1">
                    <p className="px-3 py-1 text-[11px] font-tag font-bold tracking-wider uppercase text-[var(--gold-dark)]/70 dark:text-[var(--ash)]">
                      Coincidencias encontradas
                    </p>
                    {listaResultadosPlana.map((item, index) => {
                      const config = obtenerConfiguracionRenglon(item._categoriaBackend, item);
                      return (
                        <div
                          key={`${item._categoriaBackend}-${item.id}-${index}`}
                          onClick={() => {
                            setMostrarModal(false);
                            setBusquedaMovilAbierta(false);
                            navigate(config.ruta);
                          }}
                          className="px-3 py-2 rounded-[2px] cursor-pointer transition-all flex justify-between items-center group gap-3 hover:bg-[var(--gold-08)] dark:hover:bg-[var(--gold-08)]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-[2px] flex items-center justify-center bg-[var(--snow)] border border-[var(--border-gold-20)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] shrink-0">
                              <i className={`bi ${config.icon} text-base`}></i>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate text-[var(--noir)] dark:text-[var(--snow)]">
                                {config.titulo}
                              </span>
                              <span className="text-xs truncate text-[var(--ash)] dark:text-[var(--ash)]">
                                {config.sub}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 hidden sm:block">
                            <span className="text-[10px] font-tag font-semibold uppercase tracking-wider px-2 py-1 rounded-[2px] bg-[var(--snow)] border border-[var(--gold)] text-[var(--gold-dark)] dark:bg-[var(--noir)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]">
                              {config.tag}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm italic text-[var(--ash)] dark:text-[var(--ash)]">
                    No se encontraron coincidencias para "{query}".
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative shrink-0">
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
            className="w-10 h-10 flex items-center justify-center rounded-[2px] border border-[var(--border-gold-40)] dark:border-[var(--border-gold-20)] cursor-pointer shadow-sm hover:bg-[var(--gold-08)] dark:hover:bg-[var(--gold-08)] relative"
            title="Notificaciones"
          >
            <i className="bi bi-bell text-lg text-[var(--gold-dark)] dark:text-[var(--gold-light)]"></i>
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
                className="bg-[var(--snow)] border border-[var(--border-gold-40)] rounded-[2px] shadow-xl z-[9999] overflow-hidden dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] sm:w-72"
              >
                <div className="px-3.5 py-2.5 border-b border-[var(--border-gold-20)] flex items-center justify-between font-tag">
                  <p className="text-sm font-bold text-[var(--noir)] m-0 dark:text-[var(--snow)]">Notificaciones</p>
                  {totalNotifs > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-[2px] bg-[var(--gold-08)] text-[var(--gold-dark)] font-semibold dark:bg-[var(--gold-08)] dark:text-[var(--gold-light)]">
                      {totalNotifs}
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-[var(--noir-soft)] opacity-80 dark:text-[var(--ash)]">
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
                        className="px-3.5 py-2 border-b border-[var(--border-gold-20)] hover:bg-[var(--gold-08)] cursor-pointer transition-colors flex items-start gap-2.5"
                      >
                        <div className={`mt-0.5 w-6 h-6 rounded-[2px] flex items-center justify-center shrink-0 ${
                          n.nivel === "critico" ? "bg-rojo/10 text-rojo" : "bg-[var(--gold-08)] text-[var(--gold-dark)] dark:text-[var(--gold-light)]"
                        }`}>
                          <i className={`bi ${n.icon} text-xs`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[var(--noir)] m-0 truncate dark:text-[var(--snow)]">{n.titulo}</p>
                          <p className="text-[11px] text-[var(--ash)] m-0 truncate">{n.mensaje}</p>
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

      {/* Sección derecha: tema y usuario, anclados a la esquina derecha */}
      <div className={`flex items-center gap-2 sm:gap-2.5 lg:gap-3.5 shrink-0 ml-auto ${busquedaMovilAbierta ? "hidden sm:flex" : "flex"}`}>

        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-[2px] transition-all duration-300 cursor-pointer shadow-sm active:scale-95 bg-[var(--ivory-deep)] text-[var(--gold-dark)] border border-[var(--border-gold-40)] hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]"
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? (
            <i className="bi bi-sun-fill text-lg"></i>
          ) : (
            <i className="bi bi-moon-stars-fill text-lg"></i>
          )}
        </button>
      </div>
        {/* Sección derecha: tienda, tema y usuario, anclados a la esquina derecha */}
<div className={`flex items-center gap-2 sm:gap-2.5 lg:gap-3.5 shrink-0 ml-auto ${busquedaMovilAbierta ? "hidden sm:flex" : "flex"}`}>

  <button
    onClick={() => navigate("/tienda")}
    className="flex items-center justify-center w-10 h-10 rounded-[2px] transition-all duration-300 cursor-pointer shadow-sm active:scale-95 bg-[var(--ivory-deep)] text-[var(--gold-dark)] border border-[var(--border-gold-40)] hover:bg-[var(--gold)] hover:text-[var(--noir)] dark:bg-[var(--noir-soft)] dark:text-[var(--gold-light)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold)] dark:hover:text-[var(--noir)]"
    title="Ir a la tienda"
  >
    <i className="bi bi-shop text-lg"></i>
  </button>

  {/* Perfil del Usuario ... (sin cambios) */}

        {/* Perfil del Usuario */}
        <div className="relative">
          <button
            ref={usuarioRef}
            onClick={() => setMostrarDropdownUsuario(!mostrarDropdownUsuario)}
            className="flex items-center justify-center sm:justify-start gap-0 sm:gap-2.5 w-10 h-10 sm:w-auto sm:px-3.5 sm:py-1 rounded-[2px] transition-all duration-300 cursor-pointer shadow-sm bg-[var(--gold-08)] border border-[var(--border-gold-40)] hover:bg-[var(--gold-15)] dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)] dark:hover:bg-[var(--gold-08)]"
          >
            <i className="bi bi-person-circle text-xl text-[var(--gold-dark)] dark:text-[var(--gold-light)]"></i>

            {/* Oculta los textos en pantallas pequeñas para mantener todo en una sola línea como iconos */}
            <div className="text-left leading-tight hidden sm:block max-w-[130px]">
              <p className="m-0 font-semibold text-base text-[var(--gold-dark)] dark:text-[var(--snow)] truncate font-body">
                {usuario?.nombre || "Usuario"}
              </p>
              <p className="m-0 text-[12px] uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-dark)] truncate font-tag">
                {usuario?.roleId || usuario?.role || "Invitado"}
              </p>
            </div>

            <i className={`hidden sm:inline-block bi bi-chevron-down text-[10px] text-[var(--gold-dark)] dark:text-[var(--gold-light)] transition-all duration-300 ${mostrarDropdownUsuario ? "rotate-180" : ""}`}></i>
          </button>

          {mostrarDropdownUsuario && (
            <div
              ref={dropdownRef}
              className="absolute top-full right-0 mt-2 w-44 bg-[var(--snow)] border border-[var(--border-gold-40)] rounded-[2px] shadow-lg overflow-hidden z-50 dark:bg-[var(--noir-soft)] dark:border-[var(--border-gold-20)]"
            >
              <div className="px-3.5 py-2 border-b border-[var(--border-gold-20)]">
                <p className="m-0 text-[12px] font-tag font-bold uppercase tracking-widest text-[var(--ash)]">
                  Mi Cuenta
                </p>
              </div>
              <button
                onClick={() => {
                  navigate("/perfil");
                  setMostrarDropdownUsuario(false);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 text-base font-body text-[var(--noir)] dark:text-[var(--snow)]"
              >
                <i className="bi bi-person-fill"></i> Mi Perfil
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                  setMostrarDropdownUsuario(false);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 text-base font-body text-[var(--noir)] dark:text-[var(--snow)]"
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