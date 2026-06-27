import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

export const listSuppliersQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const supplierIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createSupplierSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  rfc: z.string().optional().nullable(),
  email: z
    .string()
    .email('El email no es válido')
    .optional()
    .or(z.literal(''))
    .nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  contacto: z.string().optional().nullable(),
  giro: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  activo: z.boolean().optional().default(true)
})

export const updateSupplierSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  rfc: z.string().nullable().optional(),
  email: z.string().email('El email no es válido').optional().or(z.literal('')).nullable(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  giro: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  activo: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

export const toggleSupplierActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})