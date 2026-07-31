import { useState, useMemo, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import FooterTienda from "../components/tienda/FooterTienda";
import HeroCarrusel from "../components/tienda/HeroCarrusel";
import FiltrosSidebar, { DrawerFiltros } from "../components/tienda/FiltrosSidebar";
import { RANGO_PRECIO } from "../constants/precio";
import BarraOrdenamiento from "../components/tienda/BarraOrdenamiento";
import TarjetaProductoTienda from "../components/tienda/TarjetaProductoTienda";
import {
  cargarCatalogoTienda,
  catalogoEstaVigente,
  obtenerCatalogoEnCache,
  precargarProductoTienda,
} from "../services/tiendaCache";
import useTitulo from "../hooks/useTitulo";
import { useRequireAuth, esClienteTienda } from "../context/LoginRequeridoContext";
import { useCarrito } from "../context/CarritoContext";
import { useWishlist } from "../context/WishlistContext";
import { useTiendaPanel } from "../components/tienda/TiendaLayout";

const filtrosIniciales = {
  precioMin: RANGO_PRECIO.min,
  precioMax: RANGO_PRECIO.max,
  departamento: "",
  tallas: [],
  soloEnStock: false,
};

const contarFiltrosActivos = (filtros, categoriaActiva, busqueda) =>
  (categoriaActiva !== "todas" ? 1 : 0) +
  (busqueda.trim() ? 1 : 0) +
  (filtros.departamento ? 1 : 0) +
  filtros.tallas.length +
  (filtros.soloEnStock ? 1 : 0) +
  (filtros.precioMin > RANGO_PRECIO.min ? 1 : 0) +
  (filtros.precioMax < RANGO_PRECIO.max ? 1 : 0);

export default function Tienda() {
  useTitulo("Tienda");

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requireAuth = useRequireAuth();
  const { usuario } = useContext(AuthContext);

  // Identidad efectiva para carrito/wishlist: solo cuentas de CLIENTE cuentan.
  // Si un admin/staff entra desde "Ir a la Tienda", se le trata como invitado
  // aquí — no hereda un carrito/wishlist ligado a su cuenta de staff, y no
  // se le cierra su sesión real al volver al dashboard.
  const clienteReal = esClienteTienda(usuario) ? usuario : null;

  const { setToast } = useCarrito();
  const { favoritos, setFavoritos } = useWishlist();
  const { setWishlistAbierto } = useTiendaPanel();
  const [busqueda, setBusqueda]               = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [ordenamiento, setOrdenamiento]       = useState("relevancia");
  const [filtros, setFiltros]                 = useState(filtrosIniciales);
  const [productos, setProductos]             = useState(() => obtenerCatalogoEnCache() || []);
  const [cargando, setCargando]               = useState(() => !obtenerCatalogoEnCache());
  const [errorCarga, setErrorCarga]           = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos]   = useState(false);

  // ── Favoritos ─────────────────────────────────────────────────────────────

  // Sincronizar favoritos → localStorage cada vez que cambian
  useEffect(() => {
  const categoria = searchParams.get("categoria");
  const consulta = searchParams.get("q");

  setCategoriaActiva(categoria || "todas");
  setBusqueda(consulta || "");
}, [searchParams]);

  useEffect(() => {
    let activo = true;
    const datosEnCache = obtenerCatalogoEnCache();

    if (datosEnCache) {
      setProductos(datosEnCache);
      setCargando(false);
      setErrorCarga(false);
      if (catalogoEstaVigente()) return undefined;
    } else {
      setCargando(true);
    }

    cargarCatalogoTienda()
      .then((datos) => {
        if (!activo) return;
        setProductos(datos);
        setErrorCarga(false);
      })
      .catch((error) => {
        if (!activo) return;
        console.error("Error al cargar productos de la tienda:", error);
        setErrorCarga(true);
      })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, []);

  // Recibe (productoId, "agregado" | "quitado") desde TarjetaProductoTienda
  const handleFavoritoChange = (productoId, accion) => {
  requireAuth(() => {
    if (!clienteReal || !productos.some((producto) => producto.id === productoId)) return;
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
  const setFiltro     = (key, value) => setFiltros((f) => ({ ...f, [key]: value }));
  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
    setBusqueda("");
    setCategoriaActiva("todas");
    setSearchParams({}, { replace: true });
  };
  const filtrosActivos = contarFiltrosActivos(filtros, categoriaActiva, busqueda);

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
      default: break;
    }
    return lista;
  }, [productos, categoriaActiva, busqueda, filtros, ordenamiento]);

  const clasesGrid = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    
    <div className="min-h-screen" style={{ background: "var(--ivory-deep)" }}>

      <HeroCarrusel />

      <section className="max-w-[1480px] mx-auto px-6 lg:px-10 mt-10 pb-16">
        <div className="flex gap-6">
          <FiltrosSidebar filtros={filtros} setFiltro={setFiltro} onLimpiar={limpiarFiltros} filtrosActivos={filtrosActivos} />

          <div className="flex-1 min-w-0">
            <BarraOrdenamiento
              total={productosFiltrados.length}
              ordenamiento={ordenamiento}
              setOrdenamiento={setOrdenamiento}
              onAbrirFiltros={() => setFiltrosAbiertos(true)}
              filtrosActivos={filtrosActivos}
            />

            {cargando ? (
              <div
                className="rounded-[2px] py-24 text-center"
                style={{ background: "var(--snow)", border: "1px solid var(--border-gold-20)" }}
              >
                <p
                  className="mt-4 flex items-center justify-center gap-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontStyle: "italic",
                    fontSize: "15px",
                    color: "var(--ash)",
                  }}
                >
                  <i className="bi bi-arrow-repeat inline-block animate-spin" style={{ color: "var(--gold-dark)" }} />
                  Cargando productos…
                </p>
              </div>
            ) : errorCarga ? (
              <div
                className="rounded-[2px] py-24 text-center"
                style={{ background: "var(--snow)", border: "1px solid var(--border-gold-20)" }}
              >
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "rgba(244,63,94,0.08)" }}>
                  <i className="bi bi-cloud-slash text-3xl" style={{ color: "#F43F5E" }} />
                </div>
                <p className="font-display text-2xl italic font-light" style={{ color: "var(--noir)" }}>
                  No se pudieron cargar los productos
                </p>
                <p className="mt-2 font-body text-sm" style={{ color: "var(--ash)" }}>
                  Inténtalo más tarde.
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
                    vista="grid"
                    onVistaRapida={(producto) => navigate(`/tienda/producto/${producto.id}`)}
                    onPrecargarDetalle={(producto) => precargarProductoTienda(producto.id)}
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

      <DrawerFiltros
        filtros={filtros}
        setFiltro={setFiltro}
        onLimpiar={limpiarFiltros}
        filtrosActivos={filtrosActivos}
        abierto={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
      />
    </div>
  );
}
