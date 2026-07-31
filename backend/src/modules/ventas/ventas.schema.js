import { z } from 'zod'

const ESTADOS_PERMITIDOS = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'CANCELADO']
const METODOS_PAGO = ['tarjeta', 'oxxo']

const itemVentaSchema = z.object({
  productoId:     z.string().min(1, 'El id del producto es obligatorio'),
  talla:          z.string().min(1, 'La talla es obligatoria'),
  cantidad:       z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
})

export const createVentaSchema = z.object({
  cliente: z.object({
    nombre:  z.string().min(2, 'El nombre es obligatorio'),
    email:   z.string().email('El email no es válido'),
    calle:   z.string().min(3, 'La calle es obligatoria'),
    numeroExterior: z.string().min(1, 'El número exterior es obligatorio'),
    numeroInterior: z.string().max(30).optional().default(''),
    cp:      z.string().min(4, 'El código postal es obligatorio'),
    estado:  z.string().min(2, 'El estado es obligatorio'),
    ciudad:  z.string().min(2, 'La ciudad es obligatoria'),
    colonia: z.string().min(2, 'La colonia es obligatoria'),
    referencias: z.string().max(300).optional().default(''),
    telefono: z.string().trim().refine(
      (telefono) => /^\d{8,15}$/.test(telefono.replace(/\D/g, '')),
      'El teléfono debe tener entre 8 y 15 dígitos'
    ),
  }),
  metodoPago: z.enum(METODOS_PAGO, {
    errorMap: () => ({ message: 'Método de pago no válido' })
  }),
  items:    z.array(itemVentaSchema).min(1, 'Debe incluir al menos un producto'),
})

export const ventaIdParamSchema = z.object({
  id: z.string().min(1, 'El id es obligatorio')
})

export const updateEstadoSchema = z.object({
  estado: z.enum(ESTADOS_PERMITIDOS, {
    errorMap: () => ({ message: `Estado no válido. Debe ser: ${ESTADOS_PERMITIDOS.join(', ')}` })
  }),
  motivoCancelacion: z.string().trim().min(5, 'El motivo de cancelación debe tener al menos 5 caracteres').max(300).optional(),
}).superRefine((data, context) => {
  if (data.estado === 'CANCELADO' && !data.motivoCancelacion) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['motivoCancelacion'], message: 'El motivo de cancelación es obligatorio' })
  }
})

export const listVentasQuerySchema = z.object({
  estado:    z.enum([...ESTADOS_PERMITIDOS, '']).optional().default(''),
  metodoPago: z.enum([...METODOS_PAGO, 'spei', '']).optional().default(''),
  email:     z.string().optional().default(''),
  clienteId: z.string().optional().default(''),
  q:         z.string().trim().max(100).optional().default(''),
  desde:     z.preprocess((value) => value === '' ? undefined : value, z.string().date().optional()),
  hasta:     z.preprocess((value) => value === '' ? undefined : value, z.string().date().optional()),
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(100).optional().default(10),
})
