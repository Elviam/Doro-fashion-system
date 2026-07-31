import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { esClienteTienda } from "../../context/LoginRequeridoContext";
import { useCarrito } from "../../context/CarritoContext";
import { useWishlist } from "../../context/WishlistContext";
import { cargarCatalogoTienda, obtenerCatalogoEnCache } from "../../services/tiendaCache";
import { setFlashMessage } from "../../utils/flash";
import HeaderTienda from "./HeaderTienda";
import SeccionCarrito from "./SeccionCarrito";
import Wishlist from "./Wishlist";

const TiendaPanelContext = createContext(null);

export function useTiendaPanel() {
  const context = useContext(TiendaPanelContext);
  if (!context) throw new Error("useTiendaPanel debe usarse dentro de TiendaLayout");
  return context;
}

export default function TiendaLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useContext(AuthContext);
  const { carrito, agregarAlCarrito, cambiarCantidad, eliminarDelCarrito, cantidadCarrito, carritoAbierto, setCarritoAbierto } = useCarrito();
  const { favoritos, setFavoritos } = useWishlist();
  const [wishlistAbierto, setWishlistAbierto] = useState(false);
  const [productos, setProductos] = useState(() => obtenerCatalogoEnCache() || []);

  useEffect(() => {
    let activo = true;
    cargarCatalogoTienda().then((datos) => {
      if (activo) setProductos(datos);
    }).catch(() => {});
    return () => { activo = false; };
  }, []);

  // El perfil de staff conserva su layout de dashboard existente.
  if (location.pathname === "/perfil" && usuario && !esClienteTienda(usuario)) {
    return children ?? <Outlet />;
  }

  return (
    <TiendaPanelContext.Provider value={{ setWishlistAbierto }}>
      <HeaderTienda
        cantidadCarrito={cantidadCarrito}
        cantidadWishlist={favoritos.length}
        onAbrirCarrito={() => setCarritoAbierto(true)}
        onAbrirWishlist={() => setWishlistAbierto(true)}
        onLogout={() => { logout("CLIENT"); setFlashMessage("Sesión cerrada correctamente."); navigate("/"); }}
        usuario={usuario}
        onIrAlDashboard={() => navigate("/dashboard")}
        mostrarVolver={location.pathname === "/perfil" || location.pathname === "/tienda/checkout" || location.pathname.startsWith("/tienda/producto/")}
        onVolver={() => navigate("/tienda")}
      />

      {children ?? <Outlet />}

      <SeccionCarrito
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        carrito={carrito}
        onCambiarCantidad={cambiarCantidad}
        onEliminar={eliminarDelCarrito}
        onCheckout={() => { setCarritoAbierto(false); navigate("/tienda/checkout"); }}
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
        onQuitar={(productoId) => setFavoritos((prev) => prev.filter((id) => id !== productoId))}
      />
    </TiendaPanelContext.Provider>
  );
}
