import { useState, useMemo, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import HeaderTienda from "../components/tienda/HeaderTienda";
import FooterTienda from "../components/tienda/FooterTienda";
import HeroCarrusel from "../components/tienda/HeroCarrusel";
import FiltrosSidebar, { DrawerFiltros } from "../components/tienda/FiltrosSidebar";
import { RANGO_PRECIO } from "../constants/precio";
import BarraOrdenamiento from "../components/tienda/BarraOrdenamiento";
import TarjetaProductoTienda from "../components/tienda/TarjetaProductoTienda";
import VistaRapida from "../components/tienda/VistaRapida";
import SeccionCarrito from "../components/tienda/SeccionCarrito";
import ModalCheckout from "../components/tienda/ModalCheckout";
import Wishlist from "../components/tienda/Wishlist";
import ToastTienda from "../components/tienda/ToastTienda";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";
import { useRequireAuth, esClienteTienda } from "../context/LoginRequeridoContext";
import { useCarrito } from "../context/CarritoContext";

const filtrosIniciales = {
  precioMin: RANGO_PRECIO.min,
  precioMax: RANGO_PRECIO.max,
  departamento: "",
  tallas: [],
  soloEnStock: false,
};

export default function Tienda() {
  useTitulo("Tienda");

  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const { logout, usuario } = useContext(AuthContext);

  // Identidad efectiva para carrito/wishlist: solo cuentas de CLIENTE cuentan.
  // Si un admin/staff entra desde "Ir a la Tienda", se le trata como invitado
  // aquí — no hereda un carrito/wishlist ligado a su cuenta de staff, y no
  // se le cierra su sesión real al volver al dashboard.
  const clienteReal = esClienteTienda(usuario) ? usuario : null;

  const { carrito, agregarAlCarrito, cambiarCantidad, eliminarDelCarrito, cantidadCarrito, carritoAbierto, setCarritoAbierto, setToast } = useCarrito();
  const [busqueda, setBusqueda]               = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [ordenamiento, setOrdenamiento]       = useState("relevancia");
  const [vista, setVista]                     = useState("grid");
  const [filtros, setFiltros]                 = useState(filtrosIniciales);
  const [productos, setProductos]             = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [checkoutAbierto, setCheckoutAbierto]   = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos]   = useState(false);
  const [toast]                       = useState(null);

  // ── Favoritos ─────────────────────────────────────────────────────────────
  const claveWishlist = `favoritos_${clienteReal?.id ?? "guest"}`;
  const [favoritos, setFavoritos] = useState(
    () => JSON.parse(localStorage.getItem(claveWishlist) ?? "[]")
  );
  const [wishlistAbierto, setWishlistAbierto] = useState(false);

  // Sincronizar favoritos → localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem(claveWishlist, JSON.stringify(favoritos));
  }, [favoritos, claveWishlist]);

  useEffect(() => {
    api.get("/products?activo=true&limit=100")
      .then((data) => {
        const datosReales = (data.items || data.data?.items || (Array.isArray(data) ? data : []))
          .filter((producto) => producto.activo !== false);
        setProductos(datosReales);
      })
      .catch((error) => {
        console.error("Error al cargar productos de la tienda:", error);
        setProductos([]);
      })
      .finally(() => setCargando(false));
  }, []);

  // Recibe (productoId, "agregado" | "quitado") desde TarjetaProductoTienda
  const handleFavoritoChange = (productoId, accion) => {
  requireAuth(() => {
    if (accion === "agregado") {
      setFavoritos((prev) => {
        if (prev.includes(productoId)) return prev;
        return [...prev, productoId];
      });
      setToast({
        tipo: "exito",
        titulo: "Guardado en wishlist",
        mensaje: "El producto se agregó a tu lista de deseos.",
        accion: { label: "Ver wishlist", onClick: () => setWishlistAbierto(true) },
      });
    } else {
      setFavoritos((prev) => prev.filter((id) => id !== productoId));
    }
  }, "Inicia sesión para guardar tus favoritos");
};

  const catalogoRef = useRef(null);
  const scrollAlCatalogo = () =>
    catalogoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleBuscar = () => {
    if (busqueda.trim()) { setCategoriaActiva("todas"); limpiarFiltros(); }
    scrollAlCatalogo();
  };

  const seleccionarCategoria = (id) => {
    setCategoriaActiva(id);
    scrollAlCatalogo();
  };
  
  const setFiltro     = (key, value) => setFiltros((f) => ({ ...f, [key]: value }));
  const limpiarFiltros = () => setFiltros(filtrosIniciales);
  const handleLogout  = () => { logout(); navigate("/login"); };

  const productosFiltrados = useMemo(() => {
    let lista = [...productos];
    if (categoriaActiva !== "todas")
      lista = lista.filter((p) => p.categoria === categoriaActiva);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q)
      );
    }
    lista = lista.filter(
      (p) =>
        p.precioVenta >= filtros.precioMin &&
        p.precioVenta <= filtros.precioMax
    );
    if (filtros.departamento)
      lista = lista.filter((p) => p.departamento === filtros.departamento);
    if (filtros.tallas.length > 0)
      lista = lista.filter((p) =>
        (p.inventario ?? []).some((i) => filtros.tallas.includes(i.talla) && i.stock > 0)
      );
    if (filtros.soloEnStock)
      lista = lista.filter((p) => p.stock > 0);
    switch (ordenamiento) {
      case "precio_asc":  lista.sort((a, b) => a.precioVenta - b.precioVenta); break;
      case "precio_desc": lista.sort((a, b) => b.precioVenta - a.precioVenta); break;
      case "nombre_asc":  lista.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
      case "nombre_desc": lista.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
      default: break;
    }
    return lista;
  }, [productos, categoriaActiva, busqueda, filtros, ordenamiento]);

  const clasesGrid =
    vista === "lista"
      ? "grid-cols-1"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    
    <div className="min-h-screen" style={{ background: "var(--ivory-deep)" }}>

      <HeaderTienda
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onBuscar={handleBuscar}
        cantidadCarrito={cantidadCarrito}
        cantidadWishlist={favoritos.length}
        onAbrirCarrito={() => setCarritoAbierto(true)}
        onAbrirWishlist={() => setWishlistAbierto(true)}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={seleccionarCategoria}
        onLogout={handleLogout}
        usuario={usuario}
        onIrAlDashboard={() => navigate("/dashboard")}
      />

      <HeroCarrusel />

      <section ref={catalogoRef} className="max-w-[1480px] mx-auto px-6 lg:px-10 mt-10">
        <div className="flex gap-6">
          <FiltrosSidebar filtros={filtros} setFiltro={setFiltro} onLimpiar={limpiarFiltros} />

          <div className="flex-1 min-w-0">
            <BarraOrdenamiento
              total={productosFiltrados.length}
              ordenamiento={ordenamiento}
              setOrdenamiento={setOrdenamiento}
              vista={vista}
              setVista={setVista}
              onAbrirFiltros={() => setFiltrosAbiertos(true)}
              filtrosActivos={
                (filtros.departamento ? 1 : 0) +
                filtros.tallas.length +
                (filtros.soloEnStock ? 1 : 0) +
                (filtros.precioMax < 2000 ? 1 : 0)
              }
            />

            {cargando ? (
              <div
                className="rounded-[2px] py-24 text-center"
                style={{ background: "var(--snow)", border: "1px solid var(--border-gold-20)" }}
              >
                <i className="bi bi-arrow-repeat text-3xl animate-spin" style={{ color: "var(--gold-dark)" }} />
                <p
                  className="mt-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontStyle: "italic",
                    fontSize: "15px",
                    color: "var(--ash)",
                  }}
                >
                  Cargando productos…
                </p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div
                className="rounded-[2px] py-24 text-center"
                style={{ background: "var(--snow)", border: "1px solid var(--border-gold-20)" }}
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{ background: "var(--gold-08)" }}
                >
                  <i className="bi bi-search text-2xl" style={{ color: "var(--gold-dark)" }} />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: "clamp(20px, 2.4vw, 26px)",
                    color: "var(--noir)",
                  }}
                >
                  Sin coincidencias
                </p>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    color: "var(--ash)",
                  }}
                >
                  Prueba con otros filtros o categorías
                </p>
                <button
                  onClick={limpiarFiltros}
                  className="mt-6 rounded-[2px] transition"
                  style={{
                    fontFamily: "var(--font-tag)",
                    fontWeight: 600,
                    fontSize: "11px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    padding: "11px 28px",
                    background: "var(--gold)",
                    color: "var(--noir)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className={`grid ${clasesGrid} gap-4`}>
                {productosFiltrados.map((producto) => (
                  <TarjetaProductoTienda
                    key={producto.id}
                    producto={producto}
                    vista={vista}
                    onVistaRapida={(producto) => navigate(`/tienda/producto/${producto.id}`)}
                    onFavoritoChange={handleFavoritoChange}
                    favoritos={favoritos}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <FooterTienda />

      <SeccionCarrito
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        carrito={carrito}
        onCambiarCantidad={cambiarCantidad}
        onEliminar={eliminarDelCarrito}
        onCheckout={() => { setCarritoAbierto(false); setCheckoutAbierto(true); }}
        onVerDetalle={(producto) => { setCarritoAbierto(false); navigate(`/tienda/producto/${producto.id}`); }}
      />

      <Wishlist
        abierto={wishlistAbierto}
        onCerrar={() => setWishlistAbierto(false)}
        favoritos={favoritos}
        productos={productos}
        carrito={carrito}
        onProductoClick={(producto) => navigate(`/tienda/producto/${producto.id}`)}
        onAgregarAlCarrito={agregarAlCarrito}       
        onQuitar={(productoId) =>
          setFavoritos((prev) => prev.filter((id) => id !== productoId))
        }
      />

      <DrawerFiltros
        filtros={filtros}
        setFiltro={setFiltro}
        onLimpiar={limpiarFiltros}
        abierto={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
      />
    </div>
  );
}