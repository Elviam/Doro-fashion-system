import { z } from 'zod'

export const listPermissionsQuerySchema = z.object({
  q: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
})

export const permissionIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createPermissionSchema = z.object({
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .min(3, 'El código debe tener al menos 3 caracteres'),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional().nullable(),
  modulo: z.string().optional().nullable()
})

export const updatePermissionSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').optional(),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').optional(),
  descripcion: z.string().nullable().optional(),
  modulo: z.string().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})