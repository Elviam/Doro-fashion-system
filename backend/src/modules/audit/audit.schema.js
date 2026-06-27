import { z } from 'zod'

export const listAuditQuerySchema = z.object({
  q: z.string().optional().default(''),
  resource: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const auditIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createAuditSchema = z.object({
  action: z
    .string({ required_error: 'La acción es obligatoria' })
    .min(2, 'La acción debe tener al menos 2 caracteres'),
  resource: z
    .string({ required_error: 'El recurso es obligatorio' })
    .min(2, 'El recurso debe tener al menos 2 caracteres'),
  resourceId: z.string().optional().nullable(),
  details: z.record(z.any()).optional().default({}),
  userId: z.string().optional().nullable(),
  usuario: z.string().optional().nullable()
})