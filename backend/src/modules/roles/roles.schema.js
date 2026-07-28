import { z } from 'zod'

export const listRolesQuerySchema = z.object({
  q: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const roleIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createRoleSchema = z.object({}).strict()

export const updateRoleSchema = z.object({
  descripcion: z.string().nullable().optional()
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})
