import { z } from 'zod'

export const listAuditQuerySchema = z.object({
  q: z.string().optional().default(''),
  resource: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  resourceId: z.string().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
})

export const auditIdParamSchema = z.object({ id: z.string().min(1, 'El id es obligatorio') })
