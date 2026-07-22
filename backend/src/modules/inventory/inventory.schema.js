import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

export const listInventoryQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  lowStock: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const inventoryProductIdParamSchema = z.object({
  productId: z.string().min(1, 'El productId es obligatorio')
})

export const adjustInventorySchema = z.object({
  ajustes: z.array(z.object({
    talla: z.string().min(1, 'La talla es obligatoria'),
    cantidadNueva: z.coerce.number().int().min(0, 'La cantidad debe ser igual o mayor a 0')
  })).min(1, 'Debes ajustar al menos una talla'),
  motivo: z
    .string({ required_error: 'El motivo es obligatorio' })
    .min(3, 'El motivo debe tener al menos 3 caracteres'),
  notas: z.string().optional().nullable(),
  evidencia: z.array(z.string().url()).max(4).optional().default([])
})

export const listInventoryMovementsQuerySchema = z.object({
  q: z.string().optional().default(''),
  productId: z.string().optional(),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})
