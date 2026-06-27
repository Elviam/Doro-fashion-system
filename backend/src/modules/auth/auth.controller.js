import { authService } from './auth.service.js'

export class AuthController {
  async login(req, res) {
    const result = await authService.login(req.body)

    return res.status(200).json(result)
  }

  async register(req, res) {
    const result = await authService.register(req.body)
    return res.status(201).json(result)
}

  async me(req, res) {
    const userId = req.user?.sub

    const user = await authService.me(userId)

    return res.status(200).json({
      user
    })
  }

  async requestPasswordReset(req, res) {
    const result = await authService.requestPasswordReset(req.body)
    return res.status(200).json(result)
  }

  async validateAndResetPassword(req, res) {
    const result = await authService.validateAndResetPassword(req.body)
    return res.status(200).json(result)
  }
}

export const authController = new AuthController()