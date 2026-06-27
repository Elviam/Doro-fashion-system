import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userCanAccessDashboard } from "../../utils/roleChecker";

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
  { id: "Calzado",    label: "Calzado"    },
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
}) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [mostrarDropdownUsuario, setMostrarDropdownUsuario] = useState(false);
  const dropdownRef = useRef(null);
  const usuarioRef = useRef(null);
  const navigate = useNavigate();

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
    <header className={`sticky top-0 z-40 bg-oscuro/95 backdrop-blur-md border-b border-lila/10 transition-transform duration-300 md:translate-y-0 ${visible ? "translate-y-0" : "-translate-y-full"}`}>
      
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-3 md:py-4 flex flex-col md:grid md:grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6 box-border">
        
        <div className="w-full flex flex-row md:contents items-center justify-between gap-4">
          
          <div className="flex items-baseline gap-1.5 shrink-0 select-none">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl text-lila tracking-tight leading-none drop-shadow-[0_0_18px_rgba(231,214,255,0.25)]"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}
            >
              AURA
            </h1>
            <span className="text-[8px] sm:text-[10px] tracking-[2px] sm:tracking-[4px] text-lila-mid uppercase font-semibold">Boutique</span>
          </div>

          <div className="flex items-center gap-1.5 md:hidden shrink-0">
            <div className="relative">
              <button
                ref={usuarioRef}
                onClick={() => setMostrarDropdownUsuario(!mostrarDropdownUsuario)}
                className="w-9 h-9 rounded-full text-lila hover:bg-lila/10 flex items-center justify-center transition active:scale-95"
                title="Mi cuenta"
              >
                <i className="bi bi-person text-lg" />
              </button>

              {mostrarDropdownUsuario && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full right-0 mt-2 w-48 bg-[#1A1730] border border-lila/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-4 py-2.5 border-b border-lila/10 bg-black/20">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-lila-soft">
                      Mi Cuenta
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigate("/perfil");
                      setMostrarDropdownUsuario(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-lila/10 transition-colors flex items-center gap-3 text-xs font-medium text-lila"
                  >
                    <i className="bi bi-person-fill text-sm"></i>
                    Mi Perfil
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setMostrarDropdownUsuario(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-lila/10 transition-colors flex items-center gap-3 text-xs font-medium text-rojo"
                  >
                    <i className="bi bi-box-arrow-right text-sm"></i>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            <button onClick={onAbrirWishlist} className="relative w-9 h-9 rounded-full text-lila hover:bg-lila/10 flex items-center justify-center transition active:scale-95" title="Wishlist">
              <i className="bi bi-heart text-base" />
              {cantidadWishlist > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rojo text-blanco text-[9px] font-bold flex items-center justify-center border border-oscuro">
                  {cantidadWishlist}
                </span>
              )}
            </button>

            <button
              onClick={onAbrirCarrito}
              className="relative w-9 h-9 rounded-full bg-lila text-oscuro hover:bg-lila-soft flex items-center justify-center transition active:scale-95 shadow-md"
              title="Carrito"
            >
              <i className="bi bi-bag text-base" />
              {cantidadCarrito > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rojo text-blanco text-[9px] font-bold flex items-center justify-center border border-oscuro">
                  {cantidadCarrito}
                </span>
              )}
            </button>

            {userCanAccessDashboard(usuario) && (
              <button
                onClick={onIrAlDashboard}
                className="w-9 h-9 rounded-full text-verde hover:bg-verde hover:text-oscuro flex items-center justify-center transition active:scale-95"
                title="Ir al dashboard"
              >
                <i className="bi bi-speedometer2 text-base" />
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full box-border">
          <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-lila-soft/50 text-sm" />
          <input
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); if (!e.target.value) onBuscar(); }}
            onKeyDown={(e) => e.key === "Enter" && onBuscar()}
            placeholder="Busca prendas, categorías…"
            className="w-full bg-bg-card/40 text-lila border border-lila/20 rounded-full pl-11 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none hover:border-lila/40 focus:border-lila focus:ring-1 focus:ring-lila transition placeholder-lila/30 box-border"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 justify-end shrink-0">
          <div className="relative">
            <button
              ref={usuarioRef}
              onClick={() => setMostrarDropdownUsuario(!mostrarDropdownUsuario)}
              className="w-10 h-10 rounded-full text-lila hover:bg-lila/10 flex items-center justify-center transition active:scale-95"
              title="Mi cuenta"
            >
              <i className="bi bi-person text-lg" />
            </button>

            {mostrarDropdownUsuario && (
              <div
                ref={dropdownRef}
                className="absolute top-full right-0 mt-2 w-48 bg-[#1A1730] border border-lila/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="px-4 py-2.5 border-b border-lila/10 bg-black/20">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-lila-soft">
                    Mi Cuenta
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate("/perfil");
                    setMostrarDropdownUsuario(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-lila/10 transition-colors flex items-center gap-3 text-xs font-medium text-lila"
                >
                  <i className="bi bi-person-fill text-sm"></i>
                  Mi Perfil
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    setMostrarDropdownUsuario(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-lila/10 transition-colors flex items-center gap-3 text-xs font-medium text-rojo"
                >
                  <i className="bi bi-box-arrow-right text-sm"></i>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          <button onClick={onAbrirWishlist} className="relative w-10 h-10 rounded-full text-lila hover:bg-lila/10 flex items-center justify-center transition active:scale-95" title="Wishlist">
            <i className="bi bi-heart text-lg" />
            {cantidadWishlist > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rojo text-blanco text-[10px] font-bold flex items-center justify-center border-2 border-oscuro">
                {cantidadWishlist}
              </span>
            )}
          </button>

          <button onClick={onAbrirCarrito} className="relative w-10 h-10 rounded-full bg-lila text-oscuro hover:bg-lila-soft flex items-center justify-center transition active:scale-95 shadow-md" title="Carrito">
            <i className="bi bi-bag text-lg" />
            {cantidadCarrito > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rojo text-blanco text-[10px] font-bold flex items-center justify-center border-2 border-oscuro">
                {cantidadCarrito}
              </span>
            )}
          </button>

          {userCanAccessDashboard(usuario) && (
            <button
              onClick={onIrAlDashboard}
              className="w-10 h-10 rounded-full text-verde hover:bg-verde hover:text-oscuro flex items-center justify-center transition active:scale-95"
              title="Ir al dashboard"
            >
              <i className="bi bi-speedometer2 text-lg" />
            </button>
          )}
        </div>
      </div>

      <div className="md:hidden w-full border-t border-lila/5 overflow-x-auto scrollbar-none bg-black/10">
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSeleccionarCategoria(cat.id)}
              className={`px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase rounded-full transition-all box-border whitespace-nowrap active:scale-95 ${
                categoriaActiva === cat.id
                  ? "bg-lila text-oscuro shadow-md"
                  : "text-lila-soft bg-lila/5 hover:bg-lila/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="hidden md:block border-t border-lila/5 overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-center gap-1 min-w-max mx-auto px-6 lg:px-10">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSeleccionarCategoria(cat.id)}
              className={`relative px-4 py-3 text-[13px] font-semibold tracking-wide uppercase whitespace-nowrap transition-colors ${
                categoriaActiva === cat.id
                  ? "text-blanco"
                  : "text-lila-soft hover:text-blanco"
              }`}
            >
              {cat.label}
              {categoriaActiva === cat.id && (
                <span className="absolute left-3 right-3 -bottom-px h-[2px] rounded-full bg-lila shadow-[0_0_10px_rgba(231,214,255,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}