import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userCanAccessDashboard } from "../../utils/roleChecker";
import { useRequireAuth, esClienteTienda } from "../../context/LoginRequeridoContext";

const categorias = [
  { id: "todas",      label: "Todas"      },
  { id: "Playeras",   label: "Playeras"   },
  { id: "Blusas",     label: "Blusas"     },
  { id: "Camisas",    label: "Camisas"    },
  { id: "Suéteres",   label: "Suéteres"   },
  { id: "Sudaderas",  label: "Sudaderas"  },
  { id: "Chamarras",  label: "Chamarras"  },
  { id: "Abrigos",    label: "Abrigos"    },
  { id: "Vestidos",   label: "Vestidos"   },
  { id: "Faldas",     label: "Faldas"     },
  { id: "Shorts",     label: "Shorts"     },
  { id: "Pantalones", label: "Pantalones" },
  { id: "Accesorios", label: "Accesorios" },
];

export default function HeaderTienda({
  busqueda,
  setBusqueda,
  onBuscar,
  cantidadCarrito,
  cantidadWishlist,
  onAbrirCarrito,
  onAbrirWishlist,
  categoriaActiva,
  onSeleccionarCategoria,
  onLogout,
  usuario,
  onIrAlDashboard,
  onIrInicio,
  mostrarVolver = false,
  onVolver,
}) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [mostrarDropdownUsuario, setMostrarDropdownUsuario] = useState(false);
  const dropdownRefMobile = useRef(null);
  const usuarioRefMobile = useRef(null);
  const dropdownRefDesktop = useRef(null);
  const usuarioRefDesktop = useRef(null);
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const valorBusqueda = busqueda ?? busquedaLocal;
  const cambiarBusqueda = setBusqueda || setBusquedaLocal;
  const buscar = onBuscar || (() => navigate(`/tienda${valorBusqueda ? `?q=${encodeURIComponent(valorBusqueda)}` : ""}`));
  const seleccionarCategoria = onSeleccionarCategoria || ((id) => navigate(`/tienda${id && id !== "todas" ? `?categoria=${encodeURIComponent(id)}` : ""}`));
  const abrirCarrito = onAbrirCarrito || (() => {});
  const abrirWishlist = onAbrirWishlist || (() => {});
  const cerrarSesion = onLogout || (() => navigate("/login"));
  const irDashboard = onIrAlDashboard || (() => navigate("/dashboard"));
  const irInicio = onIrInicio || (() => navigate("/tienda"));
  const volver = onVolver || (() => navigate(-1));

  // Si hay sesión pero es de staff (admin/gerente/bodeguero/vendedor), la
  // tienda lo trata como invitado en todo lo que ve el cliente — sin tocar
  // su token real, así puede volver al dashboard sin volver a loguearse.
  const esCliente = esClienteTienda(usuario);

  const iniciarSesionCliente = () => {
    setMostrarDropdownUsuario(false);

    if (usuario && !esCliente) {
      cerrarSesion();
      return;
    }

    navigate("/login", { state: { from: window.location.pathname } });
  };

  useEffect(() => {
    const handleClickFuera = (e) => {
      const dentroDeMobile =
        dropdownRefMobile.current?.contains(e.target) ||
        usuarioRefMobile.current?.contains(e.target);
      const dentroDeDesktop =
        dropdownRefDesktop.current?.contains(e.target) ||
        usuarioRefDesktop.current?.contains(e.target);

      if (!dentroDeMobile && !dentroDeDesktop) {
        setMostrarDropdownUsuario(false);
      }
    };

    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-[var(--noir)] backdrop-blur-md border-b border-[var(--border-gold-20)] transition-transform duration-300 md:translate-y-0 ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >

      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-2 md:py-2.5 flex flex-col md:grid md:grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-5 box-border">

        <div className="w-full flex flex-row md:contents items-center justify-between gap-4">

          <div className="flex items-center gap-2 shrink-0 select-none">
            {mostrarVolver && <button type="button" onClick={volver} aria-label="Volver" title="Volver" className="font-display -mr-1 flex h-9 w-9 items-center justify-center bg-transparent p-0 text-2xl leading-none text-[var(--gold)] transition hover:text-[var(--gold-light)] sm:text-3xl">←</button>}
          {/* Logo */}
          <div className="flex items-baseline gap-1.5">
            <button
              type="button"
              onClick={irInicio}
              aria-label="Ir al inicio de la tienda D'ORO Boutique"
              className="flex items-baseline gap-1.5 shrink-0 select-none bg-transparent border-0 p-0 cursor-pointer"
            >
            <h1
              className="font-display text-xl sm:text-2xl md:text-2xl lg:text-3xl tracking-tight leading-none text-[var(--gold-light)]"
              style={{ fontWeight: 300, letterSpacing: "0.08em" }}
            >
              D<span className="italic text-[var(--gold)]">'</span>ORO
            </h1>
            <span className="font-tag text-[7px] sm:text-[9px] tracking-[2px] sm:tracking-[3px] text-[var(--ash)] uppercase font-semibold">
              Boutique
            </span>
            </button>
          </div>

          {/* Acciones — móvil (mismo estilo que desktop) */}
          </div>
          <div className="flex items-center gap-1 md:hidden shrink-0">
            <div className="relative">
              <button
                ref={usuarioRefMobile}
                onClick={() => setMostrarDropdownUsuario(!mostrarDropdownUsuario)}
                className="w-8 h-8 rounded-[2px] text-[var(--gold-light)] hover:bg-[var(--gold-08)] flex items-center justify-center transition"
                title="Mi cuenta"
              >
                <i className="bi bi-person text-base" />
              </button>

              {mostrarDropdownUsuario && (
                <div
                  ref={dropdownRefMobile}
                  className="absolute top-full right-0 mt-2 w-44 bg-[var(--noir-soft)] border border-[var(--border-gold-20)] rounded-[2px] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-2 border-b border-[var(--border-gold-20)] bg-black/20">
                    <p className="m-0 font-tag text-[9px] font-bold uppercase tracking-widest text-[var(--ash)]">
                      {esCliente ? "Sesión iniciada" : "Explorando la tienda"}
                    </p>
                    <p className="m-0 mt-0.5 font-body text-[11px] font-medium text-[var(--snow)] truncate">
                      {esCliente ? usuario?.email : "Invitado"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setMostrarDropdownUsuario(false);
                      requireAuth(() => navigate("/perfil"), "Inicia sesión para ver tu perfil");
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 font-body text-xs font-medium text-[var(--snow)]"
                  >
                    <i className="bi bi-person-fill text-xs"></i>
                    Mi Perfil
                  </button>

                  {esCliente ? (
                    <button
                      onClick={() => {
                        cerrarSesion();
                        setMostrarDropdownUsuario(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 font-body text-xs font-medium text-rojo"
                    >
                      <i className="bi bi-box-arrow-right text-xs"></i>
                      Cerrar sesión
                    </button>
                  ) : (
                    <button
                      onClick={iniciarSesionCliente}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 font-body text-xs font-medium text-[var(--gold-light)]"
                    >
                      <i className="bi bi-box-arrow-in-right text-xs"></i>
                      Iniciar sesión como cliente
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={abrirWishlist}
              className="relative w-8 h-8 rounded-[2px] text-[var(--gold-light)] hover:bg-[var(--gold-08)] flex items-center justify-center transition"
              title="Wishlist"
            >
              <i className="bi bi-heart text-sm" />
              {cantidadWishlist > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rojo text-[var(--snow)] text-[8px] font-bold flex items-center justify-center border border-[var(--noir)]">
                  {cantidadWishlist}
                </span>
              )}
            </button>

            <button
              onClick={abrirCarrito}
              className="relative w-8 h-8 rounded-[2px] bg-[var(--gold)] text-[var(--noir)] hover:bg-[var(--gold-light)] flex items-center justify-center transition"
              title="Carrito"
            >
              <i className="bi bi-bag text-sm" />
              {cantidadCarrito > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rojo text-[var(--snow)] text-[8px] font-bold flex items-center justify-center border border-[var(--noir)]">
                  {cantidadCarrito}
                </span>
              )}
            </button>

            {userCanAccessDashboard(usuario) && (
              <button
                onClick={irDashboard}
                className="w-8 h-8 rounded-[2px] text-verde hover:bg-verde hover:text-[var(--noir)] flex items-center justify-center transition"
                title="Ir al dashboard"
              >
                <i className="bi bi-speedometer2 text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative w-full box-border">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ash)] text-xs" />
          <input
            value={valorBusqueda}
            onChange={(e) => { cambiarBusqueda(e.target.value); if (!e.target.value) buscar(); }}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Busca prendas, categorías…"
            className="w-full bg-[var(--noir-soft)] text-[var(--snow)] border border-[var(--border-gold-20)] rounded-[2px] pl-9 pr-4 py-1.5 sm:py-2 font-body text-xs sm:text-sm outline-none hover:border-[var(--border-gold-40)] focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition placeholder-[var(--ash)] box-border"
          />
        </div>

        {/* Acciones — desktop */}
        <div className="hidden md:flex items-center gap-1.5 justify-end shrink-0">
          <div className="relative">
            <button
              ref={usuarioRefDesktop}
              onClick={() => setMostrarDropdownUsuario(!mostrarDropdownUsuario)}
              className="w-8 h-8 rounded-[2px] text-[var(--gold-light)] hover:bg-[var(--gold-08)] flex items-center justify-center transition"
              title="Mi cuenta"
            >
              <i className="bi bi-person text-base" />
            </button>

            {mostrarDropdownUsuario && (
              <div
                ref={dropdownRefDesktop}
                className="absolute top-full right-0 mt-2 w-44 bg-[var(--noir-soft)] border border-[var(--border-gold-20)] rounded-[2px] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="px-3 py-2 border-b border-[var(--border-gold-20)] bg-black/20">
                  <p className="m-0 font-tag text-[9px] font-bold uppercase tracking-widest text-[var(--ash)]">
                    {esCliente ? "Sesión iniciada" : "Explorando la tienda"}
                  </p>
                  <p className="m-0 mt-0.5 font-body text-[11px] font-medium text-[var(--snow)] truncate">
                    {esCliente ? usuario?.email : "Invitado"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setMostrarDropdownUsuario(false);
                    requireAuth(() => navigate("/perfil"), "Inicia sesión para ver tu perfil");
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 font-body text-xs font-medium text-[var(--snow)]"
                >
                  <i className="bi bi-person-fill text-xs"></i>
                  Mi Perfil
                </button>

                {esCliente ? (
                  <button
                    onClick={() => {
                      cerrarSesion();
                      setMostrarDropdownUsuario(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 font-body text-xs font-medium text-rojo"
                  >
                    <i className="bi bi-box-arrow-right text-xs"></i>
                    Cerrar sesión
                  </button>
                ) : (
                  <button
                    onClick={iniciarSesionCliente}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--gold-08)] transition-colors flex items-center gap-2.5 font-body text-xs font-medium text-[var(--gold-light)]"
                  >
                    <i className="bi bi-box-arrow-in-right text-xs"></i>
                    Iniciar sesión como cliente
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={abrirWishlist}
            className="relative w-8 h-8 rounded-[2px] text-[var(--gold-light)] hover:bg-[var(--gold-08)] flex items-center justify-center transition"
            title="Wishlist"
          >
            <i className="bi bi-heart text-sm" />
            {cantidadWishlist > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rojo text-[var(--snow)] text-[9px] font-bold flex items-center justify-center border-2 border-[var(--noir)]">
                {cantidadWishlist}
              </span>
            )}
          </button>

          <button
            onClick={abrirCarrito}
            className="relative w-8 h-8 rounded-[2px] bg-[var(--gold)] text-[var(--noir)] hover:bg-[var(--gold-light)] flex items-center justify-center transition"
            title="Carrito"
          >
            <i className="bi bi-bag text-sm" />
            {cantidadCarrito > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rojo text-[var(--snow)] text-[9px] font-bold flex items-center justify-center border-2 border-[var(--noir)]">
                {cantidadCarrito}
              </span>
            )}
          </button>

          {userCanAccessDashboard(usuario) && (
            <button
              onClick={irDashboard}
              className="w-8 h-8 rounded-[2px] text-verde hover:bg-verde hover:text-[var(--noir)] flex items-center justify-center transition"
              title="Ir al dashboard"
            >
              <i className="bi bi-speedometer2 text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Categorías — móvil */}
      <div className="md:hidden w-full border-t border-[var(--border-gold-20)] overflow-x-auto scrollbar-none bg-black/10">
        <div className="flex items-center gap-1 px-4 py-1.5 min-w-max">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => seleccionarCategoria(cat.id)}
              className={`relative px-2.5 py-1.5 font-tag text-[11px] sm:text-sm font-semibold tracking-wide uppercase whitespace-nowrap transition-colors ${
                categoriaActiva === cat.id
                  ? "text-[var(--snow)]"
                  : "text-[var(--ash)] hover:text-[var(--snow)]"
              }`}
            >
              {cat.label}
              {categoriaActiva === cat.id && (
                <span className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-[var(--gold)] shadow-[0_0_10px_rgba(214,171,52,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categorías — desktop */}
      <nav className="hidden md:block border-t border-[var(--border-gold-20)] overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-center gap-1 min-w-max mx-auto px-6 lg:px-10">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => seleccionarCategoria(cat.id)}
              className={`relative px-3.5 py-2.5 font-tag text-[12px] font-semibold tracking-wide uppercase whitespace-nowrap transition-colors ${
                categoriaActiva === cat.id
                  ? "text-[var(--snow)]"
                  : "text-[var(--ash)] hover:text-[var(--snow)]"
              }`}
            >
              {cat.label}
              {categoriaActiva === cat.id && (
                <span className="absolute left-3 right-3 -bottom-px h-[2px] rounded-full bg-[var(--gold)] shadow-[0_0_10px_rgba(214,171,52,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
