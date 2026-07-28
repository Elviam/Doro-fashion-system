import { z } from 'zod'

export const staffLoginSchema = z.object({
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})
export const clientLoginSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('El correo no es válido')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})
export const googleLoginSchema = z.object({
  credential: z
    .string({ required_error: 'El token de Google es obligatorio' })
    .min(10, 'Token inválido'),
})

export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .trim(),
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El email no es válido')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const passwordResetSchema = z.object({
  email: z.string({ required_error: 'El correo es obligatorio' }).email().trim().toLowerCase()
})

export const validateResetPasswordSchema = z.object({
  email: z.string({ required_error: 'El correo es obligatorio' }).email().trim().toLowerCase(),
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .length(6, 'El código debe tener 6 dígitos'),
  newPassword: z
    .string({ required_error: 'La nueva contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'La contraseña actual es obligatoria' })
    .min(6, 'La contraseña actual debe tener al menos 6 caracteres'),
  newPassword: z
    .string({ required_error: 'La nueva contraseña es obligatoria' })
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z
    .string({ required_error: 'Confirma la nueva contraseña' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las nuevas contraseñas no coinciden',
  path: ['confirmPassword']
})
