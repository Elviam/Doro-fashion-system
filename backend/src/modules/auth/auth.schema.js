import { z } from 'zod'

export const loginSchema = z.object({
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .trim(),
  rfc: z
    .string({ required_error: 'El RFC es obligatorio' })
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i, 'RFC inválido'),
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El email no es válido')
    .trim()
    .toLowerCase(),
  telefono: z
    .string({ required_error: 'El teléfono es obligatorio' })
    .min(10, 'Mínimo 10 dígitos'),
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const passwordResetSchema = z.object({
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres')
})

export const validateResetPasswordSchema = z.object({
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .length(6, 'El código debe tener 6 dígitos'),
  newPassword: z
    .string({ required_error: 'La nueva contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})