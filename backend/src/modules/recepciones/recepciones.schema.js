import { z } from 'zod'

const ESTADOS = ['BORRADOR', 'ENVIADA', 'CONFIRMADA', 'CANCELADA']
const ORIGENES = ['MANUAL', 'REABASTECIMIENTO']

const recepcionItemSchema = z.object({
  productId: z.string({ required_error: 'El productId es obligatorio' }).min(1, 'El productId es obligatorio'),
  talla: z.string().optional(),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  costoUnitario: z.coerce.number().min(0, 'El costo unitario no puede ser negativo')
})

export const listRecepcionesQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(ESTADOS).optional(),
  origen: z.enum(ORIGENES).optional(),
  fechaDesde: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(10)
})

export const recepcionIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const createRecepcionSchema = z.object({
  supplierId: z.string().min(1, 'El supplierId no puede ser una cadena vacía').optional().nullable(),
  facturaProveedor: z.string().optional().nullable(),
  fecha: z.string({ required_error: 'La fecha es obligatoria' }).min(1, 'La fecha es obligatoria'),
  folio: z.union([z.string().min(2, 'El folio debe tener al menos 2 caracteres'), z.literal(''), z.undefined()]).optional(),
  comentarios: z.string().optional().nullable(),
  origen: z.enum(ORIGENES).optional().default('MANUAL'),
  items: z.array(recepcionItemSchema).min(1, 'Debes agregar al menos una partida')
})

export const updateRecepcionSchema = z.object({
  folio: z.string().min(2, 'El folio debe tener al menos 2 caracteres').optional(),
  comentarios: z.string().nullable().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
})

export const confirmRecepcionSchema = z.object({
  facturaProveedor: z.string().nullable().optional(),
  facturaUrl: z.string().url('La URL de la factura no es válida').nullable().optional(),
  items: z.array(z.object({
    id: z.string().min(1, 'El id de la partida es obligatorio'),
    cantidadRecibida: z.coerce.number().int().min(0, 'La cantidad recibida no puede ser negativa'),
    costoUnitarioReal: z.coerce.number().min(0, 'El costo unitario real no puede ser negativo').nullable().optional()
  })).min(1, 'Debes incluir las cantidades recibidas')
})
