import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { esClienteTienda } from "./LoginRequeridoContext";
import { api } from "../services/api";

const WishlistContext = createContext(null);

function leerFavoritos(clave) {
  if (!clave) return [];
  try {
    const valor = JSON.parse(localStorage.getItem(clave) ?? "[]");
    return Array.isArray(valor) ? valor.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { usuario } = useContext(AuthContext);
  const cliente = esClienteTienda(usuario) ? usuario : null;
  const claveWishlist = cliente ? `favoritos_v2_${cliente.id}` : null;
  const [favoritos, setFavoritos] = useState([]);
  const claveHidratada = useRef(null);

  useEffect(() => {
    let cancelado = false;
    if (!claveWishlist) {
      claveHidratada.current = null;
      setFavoritos([]);
      return undefined;
    }

    api.get("/products?activo=true&limit=100")
      .then((respuesta) => {
        const productos = respuesta.items || respuesta.data?.items || (Array.isArray(respuesta) ? respuesta : []);
        const idsValidos = new Set(productos.filter((producto) => producto.activo !== false).map((producto) => producto.id));
        const favoritosValidos = [...new Set(leerFavoritos(claveWishlist).filter((id) => idsValidos.has(id)))];
        if (!cancelado) {
          claveHidratada.current = claveWishlist;
          setFavoritos(favoritosValidos);
        }
      })
      .catch(() => {
        if (!cancelado) {
          claveHidratada.current = claveWishlist;
          setFavoritos([]);
        }
      });

    return () => { cancelado = true; };
  }, [claveWishlist]);

  useEffect(() => {
    if (!claveWishlist || claveHidratada.current !== claveWishlist) return;
    localStorage.setItem(claveWishlist, JSON.stringify(favoritos));
  }, [favoritos, claveWishlist]);

  return (
    <WishlistContext.Provider value={{ favoritos, setFavoritos }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist debe usarse dentro de <WishlistProvider>");
  return context;
}
