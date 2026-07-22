import { api } from "./api";

const DURACION_CACHE_MS = 60_000;

let catalogoCache = null;
const productosCache = new Map();

const extraerProductos = (respuesta) =>
  (respuesta.items || respuesta.data?.items || (Array.isArray(respuesta) ? respuesta : []))
    .filter((producto) => producto.activo !== false);

const extraerProducto = (respuesta) => respuesta.item || respuesta.data?.item || respuesta;
const estaVigente = (entrada) => entrada && Date.now() - entrada.actualizadoEn < DURACION_CACHE_MS;

export const obtenerCatalogoEnCache = () => catalogoCache?.datos ?? null;
export const catalogoEstaVigente = () => estaVigente(catalogoCache);

export async function cargarCatalogoTienda() {
  if (catalogoEstaVigente()) return catalogoCache.datos;
  if (catalogoCache?.promesa) return catalogoCache.promesa;

  const promesa = api.get("/products?activo=true&limit=100")
    .then((respuesta) => {
      const datos = extraerProductos(respuesta);
      catalogoCache = { datos, actualizadoEn: Date.now() };
      return datos;
    })
    .catch((error) => {
      if (catalogoCache?.datos) return catalogoCache.datos;
      throw error;
    })
    .finally(() => {
      if (catalogoCache?.promesa) delete catalogoCache.promesa;
    });

  catalogoCache = { ...(catalogoCache || {}), promesa };
  return promesa;
}

export const obtenerProductoEnCache = (id) => productosCache.get(id)?.datos ?? null;
export const productoEstaVigente = (id) => estaVigente(productosCache.get(id));

export async function cargarProductoTienda(id) {
  const entrada = productosCache.get(id);
  if (productoEstaVigente(id)) return entrada.datos;
  if (entrada?.promesa) return entrada.promesa;

  const promesa = api.get(`/products/${id}`)
    .then((respuesta) => {
      const datos = extraerProducto(respuesta);
      productosCache.set(id, { datos, actualizadoEn: Date.now() });
      return datos;
    })
    .finally(() => {
      const actual = productosCache.get(id);
      if (actual?.promesa) delete actual.promesa;
    });

  productosCache.set(id, { ...(entrada || {}), promesa });
  return promesa;
}

export function precargarProductoTienda(id) {
  return cargarProductoTienda(id).catch(() => undefined);
}
