import { z } from 'zod'

const booleanLike = z.union([
  z.boolean(),
  z.enum(['true', 'false'])
]).transform((value) => {
  if (typeof value === 'boolean') return value
  return value === 'true'
})

export const listClientsQuerySchema = z.object({
  q: z.string().optional().default(''),
  activo: booleanLike.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const clientIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createClientSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  rfc: z
    .string()
    .optional()
    .nullable(),
  email: z
    .string()
    .email('El email no es válido')
    .optional()
    .or(z.literal(''))
    .nullable(),
  telefono: z
    .string()
    .optional()
    .nullable(),
  direccion: z
    .string()
    .optional()
    .nullable(),
  contacto: z
    .string()
    .optional()
    .nullable(),
  notas: z
    .string()
    .optional()
    .nullable(),
  roleId: z
    .string()
    .optional()
    .default('CLIENTE'),
  activo: z.boolean().optional().default(true)
})

export const updateClientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  rfc: z.string().nullable().optional(),
  email: z.string().email('El email no es válido').optional().or(z.literal('')).nullable(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  roleId: z.string().optional(),
  activo: z.boolean().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

export const toggleClientActiveSchema = z.object({
  activo: z.boolean({
    required_error: 'El campo activo es obligatorio'
  })
})

export const addressIdParamSchema = z.object({
  addressId: z.string().min(1, 'El id de la dirección es obligatorio')
})

export const addressSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(1, 'El alias debe tener al menos 1 carácter')
    .max(40, 'El alias no puede tener más de 40 caracteres')
    .optional(),

  calle: z
    .string()
    .trim()
    .min(3, 'La calle debe tener al menos 3 caracteres'),

  numeroExterior: z
    .string()
    .trim()
    .min(1, 'El número exterior es obligatorio'),

  numeroInterior: z
    .string()
    .trim()
    .max(30, 'El número interior no puede tener más de 30 caracteres')
    .optional()
    .default(''),

  cp: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),

  estado: z
    .string()
    .trim()
    .min(2, 'Selecciona un estado válido'),

  ciudad: z
    .string()
    .trim()
    .min(2, 'La ciudad debe tener al menos 2 caracteres'),

  colonia: z
    .string()
    .trim()
    .min(2, 'La colonia debe tener al menos 2 caracteres'),

  referencias: z
    .string()
    .trim()
    .max(300, 'Las referencias no pueden tener más de 300 caracteres')
    .optional()
    .default(''),

  telefono: z
    .string()
    .trim()
    .refine(
      (telefono) => /^\d{8,15}$/.test(telefono.replace(/\D/g, '')),
      'El teléfono debe tener entre 8 y 15 dígitos'
    ),

  esPredeterminada: z.boolean().optional()
})
