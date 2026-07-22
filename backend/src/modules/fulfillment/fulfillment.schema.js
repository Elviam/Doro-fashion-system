import { z } from 'zod'

export const fulfillmentSaleIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const shippingStatusSchema = z.object({
  estadoEnvio: z.enum(['EN_TRANSITO', 'ENTREGADO', 'INCIDENCIA'])
})
