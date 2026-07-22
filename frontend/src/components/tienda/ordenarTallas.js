const ORDEN_TALLAS_SUPERIORES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

/** Orden visual de tallas en la tienda, sin considerar el stock. */
export function compararTallas(a, b) {
  const tallaA = String(a?.talla ?? "").trim().toUpperCase();
  const tallaB = String(b?.talla ?? "").trim().toUpperCase();
  const numeroA = Number(tallaA);
  const numeroB = Number(tallaB);

  if (Number.isFinite(numeroA) && Number.isFinite(numeroB)) {
    return numeroA - numeroB;
  }

  const indiceA = ORDEN_TALLAS_SUPERIORES.indexOf(tallaA);
  const indiceB = ORDEN_TALLAS_SUPERIORES.indexOf(tallaB);
  if (indiceA !== -1 || indiceB !== -1) {
    return (indiceA === -1 ? Number.MAX_SAFE_INTEGER : indiceA)
      - (indiceB === -1 ? Number.MAX_SAFE_INTEGER : indiceB);
  }

  return tallaA.localeCompare(tallaB, "es", { numeric: true });
}

export function ordenarTallas(tallas = []) {
  return [...tallas].sort(compararTallas);
}

export function obtenerTallasValidasTienda(producto) {
  const tallasPermitidas = TALLAS_POR_CATEGORIA[producto?.categoria] || [];
  return ordenarTallas(producto?.inventario).filter((variante) =>
    tallasPermitidas.includes(variante.talla)
  );
}
import { TALLAS_POR_CATEGORIA } from "../../constants/categorias";
