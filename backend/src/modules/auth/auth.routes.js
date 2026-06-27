import { Router } from 'express'
import { authController } from './auth.controller.js'
import { validate } from '../../middlewares/validate.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { loginSchema,registerSchema, passwordResetSchema, validateResetPasswordSchema } from './auth.schema.js'

const router = Router()

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController))
)

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me.bind(authController))
)
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController))
)

router.post(
  '/request-password-reset',
  validate(passwordResetSchema),
  asyncHandler(authController.requestPasswordReset.bind(authController))
)

router.post(
  '/validate-and-reset-password',
  validate(validateResetPasswordSchema),
  asyncHandler(authController.validateAndResetPassword.bind(authController))
)

export default router