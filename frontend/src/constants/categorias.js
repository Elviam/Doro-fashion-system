export const DEPARTAMENTOS_PERMITIDOS = ["Dama", "Caballero", "Unisex"]

export const CATEGORIAS_PERMITIDAS = [
  "Playeras", "Blusas", "Camisas", "Suéteres", "Sudaderas",
  "Chamarras", "Abrigos", "Vestidos", "Faldas", "Shorts",
  "Pantalones", "Accesorios"
]

const TALLAS_SUPERIORES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"]
const TALLAS_INFERIORES = ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"]
const TALLAS_ACCESORIOS = ["Unitalla"]

export const TALLAS_POR_CATEGORIA = {
  "Playeras": TALLAS_SUPERIORES,
  "Blusas": TALLAS_SUPERIORES,
  "Camisas": TALLAS_SUPERIORES,
  "Suéteres": TALLAS_SUPERIORES,
  "Sudaderas": TALLAS_SUPERIORES,
  "Chamarras": TALLAS_SUPERIORES,
  "Abrigos": TALLAS_SUPERIORES,
  "Vestidos": TALLAS_SUPERIORES,
  "Faldas": TALLAS_INFERIORES,
  "Shorts": TALLAS_INFERIORES,
  "Pantalones": TALLAS_INFERIORES,
  "Accesorios": TALLAS_ACCESORIOS
}