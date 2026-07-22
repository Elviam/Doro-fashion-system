import { Router } from 'express'
import { authController } from './auth.controller.js'
import { validate } from '../../middlewares/validate.js'
import { authenticate } from '../../middlewares/auth.js'
import { requirePermissions } from '../../middlewares/requirePermissions.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { changePasswordSchema, clientLoginSchema, staffLoginSchema, registerSchema, passwordResetSchema, validateResetPasswordSchema, googleLoginSchema } from './auth.schema.js'
const router = Router()

router.post(
  '/login',
  validate(clientLoginSchema),
  asyncHandler(authController.clientLogin.bind(authController))
)
router.post(
  '/staff-login',
  validate(staffLoginSchema),
  asyncHandler(authController.staffLogin.bind(authController))
)
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me.bind(authController))
)
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController))
)
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController))
)
router.post(
  '/google',
  validate(googleLoginSchema),
  asyncHandler(authController.googleLogin.bind(authController))
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
