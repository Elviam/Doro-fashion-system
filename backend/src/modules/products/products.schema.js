import { z } from 'zod'
import {
  CATEGORIAS_PERMITIDAS,
  DEPARTAMENTOS_PERMITIDOS,
  TALLAS_POR_CATEGORIA,
  TODAS_LAS_TALLAS
} from './products.constants.js'

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
  imagenes: z
    .array(z.string())
    .min(1, 'Debes subir al menos una imagen del producto')
    .max(6, 'Máximo 6 imágenes por producto'),

  sku: z
    .string()
    .min(2, 'El SKU debe tener al menos 2 caracteres')
    .optional(),

  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),

  descripcion: nullableString,

  categoria: z.enum(CATEGORIAS_PERMITIDAS, {
    errorMap: () => ({ message: 'Categoría no válida' })
  }),

  departamento: z.enum(DEPARTAMENTOS_PERMITIDOS, {
    errorMap: () => ({ message: 'Departamento no válido' })
  }),

  supplierId: nullableString,
  supplierNombre: nullableString,
  precioCompra: z.coerce.number({ required_error: 'El precio de compra es obligatorio' }).finite('El precio de compra debe ser válido').gt(0, 'El precio de compra debe ser mayor que cero'),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo').optional().default(0),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional().default(0),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo'),
  stockIdeal: z.coerce.number({ required_error: 'El stock ideal es obligatorio' }).min(0, 'El stock ideal no puede ser negativo'),
  stockMaximo: z.coerce.number({ required_error: 'El stock máximo es obligatorio' }).min(0, 'El stock máximo no puede ser negativo'),
  activo: z.boolean().optional().default(true),
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

  if (data.stockMinimo > data.stockIdeal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El stock ideal debe ser mayor o igual al stock mínimo',
      path: ['stockIdeal']
    });
  }

  if (data.stockIdeal > data.stockMaximo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El stock máximo debe ser mayor o igual al stock ideal',
      path: ['stockMaximo']
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
  supplierId: z.string().nullable().optional(),
  supplierNombre: z.string().nullable().optional(),
  precioCompra: z.coerce.number().finite('El precio de compra debe ser válido').gt(0, 'El precio de compra debe ser mayor que cero').optional(),
  precioVenta: z.coerce.number().min(0, 'El precio de venta no puede ser negativo').optional(),
  stock: z.coerce.number().min(0, 'El stock no puede ser negativo').optional(),
  stockMinimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').optional(),
  stockIdeal: z.coerce.number().min(0, 'El stock ideal no puede ser negativo').optional(),
  stockMaximo: z.coerce.number().min(0, 'El stock máximo no puede ser negativo').optional(),
  activo: z.boolean().optional(),
  imagenes: z.array(z.string()).max(6, 'Máximo 6 imágenes por producto').optional(),
  inventario: z.array(inventarioSchema).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
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

  const minimo = data.stockMinimo;
  const ideal = data.stockIdeal;
  const maximo = data.stockMaximo;

  if (minimo !== undefined && ideal !== undefined && minimo > ideal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El stock ideal debe ser mayor o igual al stock mínimo',
      path: ['stockIdeal']
    });
  }

  if (ideal !== undefined && maximo !== undefined && ideal > maximo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El stock máximo debe ser mayor o igual al stock ideal',
      path: ['stockMaximo']
    });
  }
})

export const toggleProductActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})
