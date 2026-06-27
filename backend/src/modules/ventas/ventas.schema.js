import { z } from 'zod'

const ESTADOS_PERMITIDOS = ['pendiente', 'pagado', 'cancelado']
const METODOS_PAGO = ['tarjeta', 'oxxo', 'spei']

const itemVentaSchema = z.object({
  productoId:     z.string().min(1, 'El id del producto es obligatorio'),
  nombre:         z.string().min(1, 'El nombre del producto es obligatorio'),
  imagen:         z.string().optional().default(''),
  talla:          z.string().min(1, 'La talla es obligatoria'),
  cantidad:       z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  precioUnitario: z.coerce.number().min(0, 'El precio no puede ser negativo'),
})

export const createVentaSchema = z.object({
  numeroPedido: z.string().optional(),
  clienteId:    z.string().optional().default(''),
  cliente: z.object({
    nombre:  z.string().min(2, 'El nombre es obligatorio'),
    email:   z.string().email('El email no es válido'),
    calle:   z.string().min(3, 'La dirección es obligatoria'),
    cp:      z.string().min(4, 'El código postal es obligatorio'),
    ciudad:  z.string().min(2, 'La ciudad es obligatoria'),
  }),
  metodoPago: z.enum(METODOS_PAGO, {
    errorMap: () => ({ message: 'Método de pago no válido' })
  }),
  items:    z.array(itemVentaSchema).min(1, 'Debe incluir al menos un producto'),
  subtotal: z.coerce.number().min(0),
  envio:    z.coerce.number().min(0),
  total:    z.coerce.number().min(0),
})

export const ventaIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const updateEstadoSchema = z.object({
  estado: z.enum(ESTADOS_PERMITIDOS, {
    errorMap: () => ({ message: `Estado no válido. Debe ser: ${ESTADOS_PERMITIDOS.join(', ')}` })
  })
})

export const listVentasQuerySchema = z.object({
  estado:    z.enum([...ESTADOS_PERMITIDOS, '']).optional().default(''),
  email:     z.string().optional().default(''),
  clienteId: z.string().optional().default(''),
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(100).optional().default(10),
})
