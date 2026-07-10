import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { useRequireAuth, esClienteTienda } from "./LoginRequeridoContext";
import ToastTienda from "../components/tienda/ToastTienda";

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const requireAuth = useRequireAuth();
  const { usuario } = useContext(AuthContext);
  const clienteReal = esClienteTienda(usuario) ? usuario : null;
  const claveCarrito = `carrito_${clienteReal?.id ?? "guest"}`;

  const [carrito, setCarrito] = useState(
    () => JSON.parse(localStorage.getItem(claveCarrito) ?? "[]")
  );
  const [toast, setToast] = useState(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  useEffect(() => {
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
  }, [carrito, claveCarrito]);

  const agregarAlCarrito = (producto, { talla, cantidad = 1 }) => {
    requireAuth(() => {
      const stockTalla = producto.inventario?.find((i) => i.talla === talla)?.stock ?? 0;
      const existe = carrito.find((i) => i.producto.id === producto.id && i.talla === talla);
      const cantidadEnCarrito = existe ? existe.cantidad : 0;

      if (stockTalla === 0) {
        setToast({ tipo: "error", titulo: "Talla agotada", mensaje: `La talla ${talla} de "${producto.nombre}" ya no tiene stock disponible.` });
        return;
      }
      if (cantidadEnCarrito + cantidad > stockTalla) {
        setToast({ tipo: "error", titulo: "Sin unidades disponibles", mensaje: `Solo hay ${stockTalla} unidad${stockTalla === 1 ? "" : "es"} disponible${stockTalla === 1 ? "" : "s"} de talla ${talla}.` });
        return;
      }

      setCarrito((prev) => {
        if (existe) {
          return prev.map((i) =>
            i.producto.id === producto.id && i.talla === talla ? { ...i, cantidad: i.cantidad + cantidad } : i
          );
        }
        return [...prev, { producto, talla, cantidad }];
      });

      setToast({
        tipo: "exito",
        titulo: "Agregado al carrito",
        mensaje: `${producto.nombre} · Talla ${talla} × ${cantidad}`,
        accion: { label: "Ver carrito", onClick: () => setCarritoAbierto(true) },
      });
    }, "Inicia sesión para agregar productos a tu carrito");
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

  const vaciarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem(claveCarrito);
  };

  const cantidadCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        cambiarCantidad,
        eliminarDelCarrito,
        vaciarCarrito,
        cantidadCarrito,
        carritoAbierto,
        setCarritoAbierto,
        setToast,
      }}
    >
      {children}
      <ToastTienda toast={toast} onCerrar={() => setToast(null)} />
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}