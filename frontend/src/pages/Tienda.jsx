import { useState, useMemo, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import HeaderTienda from "../components/tienda/HeaderTienda";
import FooterTienda from "../components/tienda/FooterTienda";
import BarraAnuncios from "../components/tienda/BarraAnuncios";
import HeroCarrusel from "../components/tienda/HeroCarrusel";
import RielCategorias from "../components/tienda/RielCategorias";
import FiltrosSidebar, { DrawerFiltros } from "../components/tienda/FiltrosSidebar";
import BarraOrdenamiento from "../components/tienda/BarraOrdenamiento";
import TarjetaProductoTienda from "../components/tienda/TarjetaProductoTienda";
import VistaRapida from "../components/tienda/VistaRapida";
import SeccionCarrito from "../components/tienda/SeccionCarrito";
import ModalCheckout from "../components/tienda/ModalCheckout";
import Wishlist from "../components/tienda/Wishlist";
import ToastTienda from "../components/tienda/ToastTienda";
import { api } from "../services/api";
import useTitulo from "../hooks/useTitulo";

const filtrosIniciales = {
  precioMax:    2000,
  departamento: "",
  tallas:       [],
  soloEnStock:  false,
};

export default function Tienda() {
  useTitulo("Tienda");

  const navigate = useNavigate();
  const { logout, usuario } = useContext(AuthContext);
  const claveCarrito = `carrito_${usuario?.id ?? "guest"}`;

  const [busqueda, setBusqueda]               = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [ordenamiento, setOrdenamiento]       = useState("relevancia");
  const [vista, setVista]                     = useState("grid");
  const [filtros, setFiltros]                 = useState(filtrosIniciales);
  const [productoEnVistaRapida, setProductoEnVistaRapida] = useState(null);
  const [productos, setProductos]             = useState([]);
  const [cargando, setCargando]               = useState(true);
  const [carrito, setCarrito]                 = useState(
    () => JSON.parse(localStorage.getItem(claveCarrito) ?? "[]")
  );
  const [carritoAbierto, setCarritoAbierto]     = useState(false);
  const [checkoutAbierto, setCheckoutAbierto]   = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos]   = useState(false);
  const [toast, setToast]                       = useState(null);

  // ── Favoritos ──────────────────────────────────────────────────────────────
  const claveWishlist = `favoritos_${usuario?.id ?? "guest"}`;
  const [favoritos, setFavoritos] = useState(
    () => JSON.parse(localStorage.getItem(`favoritos_${usuario?.id ?? "guest"}`) ?? "[]")
  );
  const [wishlistAbierto, setWishlistAbierto] = useState(false);

  // Sincronizar favoritos → localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem(claveWishlist, JSON.stringify(favoritos));
  }, [favoritos, claveWishlist]);

  useEffect(() => {
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
  }, [carrito, claveCarrito]);

  useEffect(() => {
    api.get("/products?activo=true&limit=100")
      .then((data) => setProductos(data.items ?? []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, []);

  // Recibe (productoId, "agregado" | "quitado") desde TarjetaProductoTienda
  const handleFavoritoChange = (productoId, accion) => {
    if (accion === "agregado") {
      setFavoritos((prev) => {
        // Evitar duplicados
        if (prev.includes(productoId)) return prev;
        return [...prev, productoId];
      });
      // Toast solo al agregar, igual que el de carrito
      setToast({
        tipo:   "exito",
        titulo: "Guardado en wishlist",
        mensaje: "El producto se agregó a tu lista de deseos.",
        accion: {
          label:   "Ver wishlist",
          onClick: () => setWishlistAbierto(true),
        },
      });
    } else {
      // "quitado" — se quita sin toast (ya hay botón de papelera visible)
      setFavoritos((prev) => prev.filter((id) => id !== productoId));
    }
  };

  const agregarAlCarrito = (producto, { talla, cantidad = 1 }) => {
    const stockTalla       = producto.inventario?.find((i) => i.talla === talla)?.stock ?? 0;
    const existe           = carrito.find((i) => i.producto.id === producto.id && i.talla === talla);
    const cantidadEnCarrito = existe ? existe.cantidad : 0;

    if (stockTalla === 0) {
      setToast({
        tipo:   "error",
        titulo: "Talla agotada",
        mensaje: `La talla ${talla} de "${producto.nombre}" ya no tiene stock disponible.`,
      });
      return;
    }

    if (cantidadEnCarrito + cantidad > stockTalla) {
      setToast({
        tipo:   "error",
        titulo: "Sin unidades disponibles",
        mensaje: `Solo hay ${stockTalla} unidad${stockTalla === 1 ? "" : "es"} disponible${stockTalla === 1 ? "" : "s"} de talla ${talla}.`,
      });
      return;
    }

    setCarrito((prev) => {
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id && i.talla === talla
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [...prev, { producto, talla, cantidad }];
    });

    setToast({
      tipo:   "exito",
      titulo: "Agregado al carrito",
      mensaje: `${producto.nombre} · Talla ${talla} × ${cantidad}`,
      accion: { label: "Ver carrito", onClick: () => { setWishlistAbierto(false); setCarritoAbierto(true); } },
    });
  };

  const cambiarCantidad = (productoId, talla, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito((prev) => prev.filter((i) => !(i.producto.id === productoId && i.talla === talla)));
    } else {
      setCarrito((prev) =>
        prev.map((i) =>
          i.producto.id === productoId && i.talla === talla ? { ...i, cantidad: nuevaCantidad } : i
        )
      );
    }
  };

  const eliminarDelCarrito = (productoId, talla) => {
    setCarrito((prev) => prev.filter((i) => !(i.producto.id === productoId && i.talla === talla)));
  };

  const cantidadCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);

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
    lista = lista.filter((p) => p.precioVenta <= filtros.precioMax);
    if (filtros.departamento)
      lista = lista.filter((p) => p.departamento === filtros.departamento);
    if (filtros.tallas.length > 0)
      lista = lista.filter((p) =>
        p.inventario.some((i) => filtros.tallas.includes(i.talla) && i.stock > 0)
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
    <div className="min-h-screen bg-oscuro">

      <BarraAnuncios />

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
        <div className="md:hidden">
          <RielCategorias
            categoriaActiva={categoriaActiva}
            onSeleccionarCategoria={seleccionarCategoria}
          />
        </div>

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
              <div className="bg-bg-card border border-lila/10 rounded-2xl py-20 text-center">
                <i className="bi bi-arrow-repeat text-3xl text-lila animate-spin" />
                <p className="text-sm text-text-muted mt-3">Cargando productos…</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="bg-bg-card border border-lila/10 rounded-2xl py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-lila/10 mx-auto flex items-center justify-center mb-3">
                  <i className="bi bi-search text-2xl text-lila" />
                </div>
                <p className="text-base font-bold text-blanco">Sin coincidencias</p>
                <p className="text-sm text-text-muted mt-1">
                  Prueba con otros filtros o categorías
                </p>
                <button
                  onClick={limpiarFiltros}
                  className="mt-4 bg-lila text-oscuro font-bold px-5 py-2 rounded-lg text-sm hover:bg-lila-soft transition"
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
                    onVistaRapida={setProductoEnVistaRapida}
                    onFavoritoChange={handleFavoritoChange}
                    favoritos={favoritos}          // ← prop nueva
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
        onVerDetalle={(producto) => { setCarritoAbierto(false); setProductoEnVistaRapida(producto); }}
      />

      {productoEnVistaRapida && (
        <VistaRapida
          producto={productoEnVistaRapida}
          onCerrar={() => setProductoEnVistaRapida(null)}
          onAgregarAlCarrito={agregarAlCarrito}
        />
      )}

      {/* Un solo sistema de toast para toda la tienda */}
      <ToastTienda toast={toast} onCerrar={() => setToast(null)} />

      <Wishlist
        abierto={wishlistAbierto}
        onCerrar={() => setWishlistAbierto(false)}
        favoritos={favoritos}
        productos={productos}
        carrito={carrito}
        onProductoClick={setProductoEnVistaRapida}
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

      {checkoutAbierto && (
        <ModalCheckout
          onCerrar={() => setCheckoutAbierto(false)}
          carrito={carrito}
          usuario={usuario}
          onPedidoConfirmado={() => {
            setCarrito([]);
            localStorage.removeItem(claveCarrito);
          }}
        />
      )}
    </div>
  );
}