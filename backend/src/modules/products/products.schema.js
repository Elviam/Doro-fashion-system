import { z } from 'zod'

const DEPARTAMENTOS_PERMITIDOS = ["Dama", "Caballero", "Unisex", ""]

const CATEGORIAS_PERMITIDAS = [
  "Playeras", "Blusas", "Camisas", "Suéteres", "Sudaderas", 
  "Chamarras", "Abrigos", "Vestidos", "Faldas", "Shorts", 
  "Pantalones", "Calzado", "Accesorios", ""
]

const TALLAS_SUPERIORES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"]
const TALLAS_INFERIORES = ["22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"]
const TALLAS_CALZADO = ["22", "22.5", "23", "23.5", "24", "24.5", "25", "25.5", "26", "26.5", "27", "27.5", "28", "28.5", "29", "29.5", "30", "31"]
const TALLAS_ACCESORIOS = ["Unitalla"]

const TALLAS_POR_CATEGORIA = {
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
  
  "Calzado": TALLAS_CALZADO,
  "Accesorios": TALLAS_ACCESORIOS
}

const TODAS_LAS_TALLAS = [...new Set(Object.values(TALLAS_POR_CATEGORIA).flat())]

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

const nullableString = z.string().optional().nullable()

const inventarioSchema = z.object({
  talla: z.enum(TODAS_LAS_TALLAS, {
    errorMap: () => ({ message: 'La talla ingresada no existe en el catálogo general' })
  }),
  stock: z.coerce.number().min(0)
})

export const listProductsQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const productIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createProductSchema = z.object({
  sku: z
    .string({ required_error: 'El SKU es obligatorio' })
    .min(2, 'El SKU debe tener al menos 2 caracteres'),

  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),

  descripcion: nullableString,

  categoria: z.enum(CATEGORIAS_PERMITIDAS, {
    errorMap: () => ({ message: 'Categoría no válida' })
  }).optional().nullable(),
  
  departamento: z.enum(DEPARTAMENTOS_PERMITIDOS, {
    errorMap: () => ({ message: 'Departamento no válido' })
  }).optional().nullable(),
  
  unidad: nullableString,
  marca: nullableString,
  modelo: nullableString,
  supplierId: nullableString,
  supplierNombre: nullableString,
  precioCompra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional().default(0),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo').optional().default(0),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional().default(0),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').optional().default(0),
  activo: z.boolean().optional().default(true),
  imagen: z.string().optional().nullable(),
  inventario: z.array(inventarioSchema).optional().default([])
})

.superRefine((data, ctx) => {
  if (data.categoria && data.inventario && data.inventario.length > 0) {
    const tallasValidas = TALLAS_POR_CATEGORIA[data.categoria] || ["Unitalla"];
    
    data.inventario.forEach((item, index) => {
      if (!tallasValidas.includes(item.talla)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La talla '${item.talla}' no es válida para la categoría '${data.categoria}'`,
          path: ['inventario', index, 'talla']
        });
      }
    });
  }
})

export const updateProductSchema = z.object({
  sku: z.string().min(2, 'El SKU debe tener al menos 2 caracteres').optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  descripcion: z.string().nullable().optional(),
  categoria: z.enum(CATEGORIAS_PERMITIDAS, {
    errorMap: () => ({ message: 'Categoría no válida' })
  }).nullable().optional(),
  departamento: z.enum(DEPARTAMENTOS_PERMITIDOS, {
    errorMap: () => ({ message: 'Departamento no válido' })
  }).nullable().optional(),
  unidad: z.string().nullable().optional(),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  supplierNombre: z.string().nullable().optional(),
  precioCompra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional(),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo').optional(),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional(),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').optional(),
  activo: z.boolean().optional(),
  imagen: z.string().nullable().optional(),
  inventario: z.array(inventarioSchema).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

.superRefine((data, ctx) => {
  // Al editar, si envían la categoría y el inventario juntos, verificamos que coincidan
  if (data.categoria && data.inventario && data.inventario.length > 0) {
    const tallasValidas = TALLAS_POR_CATEGORIA[data.categoria] || ["Unitalla"];
    
    data.inventario.forEach((item, index) => {
      if (!tallasValidas.includes(item.talla)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La talla '${item.talla}' no es válida para la categoría '${data.categoria}'`,
          path: ['inventario', index, 'talla']
        });
      }
    });
  }
})

export const toggleProductActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})