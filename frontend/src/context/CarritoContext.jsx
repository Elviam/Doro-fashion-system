import { createContext, useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { useRequireAuth, esClienteTienda } from "./LoginRequeridoContext";
import ToastTienda from "../components/tienda/ToastTienda";
import { api } from "../services/api";

const CarritoContext = createContext(null);

function leerCarrito(clave) {
  if (!clave) return [];
  try {
    const valor = JSON.parse(localStorage.getItem(clave) ?? "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

export function CarritoProvider({ children }) {
  const requireAuth = useRequireAuth();
  const { usuario } = useContext(AuthContext);
  const clienteReal = esClienteTienda(usuario) ? usuario : null;
  const claveCarrito = clienteReal ? `carrito_v2_${clienteReal.id}` : null;
  const [carrito, setCarrito] = useState([]);
  const [toast, setToast] = useState(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const claveHidratada = useRef(null);

  useEffect(() => {
    let cancelado = false;
    if (!claveCarrito) {
      claveHidratada.current = null;
      setCarrito([]);
      setCarritoAbierto(false);
      return undefined;
    }

    api.get("/products?activo=true&limit=100")
      .then((respuesta) => {
        const productos = respuesta.items || respuesta.data?.items || (Array.isArray(respuesta) ? respuesta : []);
        const porId = new Map(productos.filter((producto) => producto.activo !== false).map((producto) => [producto.id, producto]));
        const carritoValido = leerCarrito(claveCarrito).flatMap((item) => {
          const producto = porId.get(item?.producto?.id);
          const variante = producto?.inventario?.find((v) => v.talla === item?.talla);
          const cantidad = Number(item?.cantidad);
          if (!producto || !variante || variante.stock <= 0 || !Number.isInteger(cantidad) || cantidad < 1) return [];
          return [{ producto, talla: variante.talla, cantidad: Math.min(cantidad, variante.stock) }];
        });
        if (!cancelado) {
          claveHidratada.current = claveCarrito;
          setCarrito(carritoValido);
        }
      })
      .catch(() => {
        if (!cancelado) {
          claveHidratada.current = claveCarrito;
          setCarrito([]);
        }
      });

    return () => { cancelado = true; };
  }, [claveCarrito]);

  useEffect(() => {
    if (!claveCarrito || claveHidratada.current !== claveCarrito) return;
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
  }, [carrito, claveCarrito]);

  const agregarAlCarrito = (producto, { talla, cantidad = 1 }) => {
    requireAuth(() => {
      if (!clienteReal || producto?.activo === false) return;
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
    if (claveCarrito) localStorage.removeItem(claveCarrito);
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
