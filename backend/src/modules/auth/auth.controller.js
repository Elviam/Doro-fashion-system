import { authService } from './auth.service.js'

export class AuthController {
  async googleLogin(req, res) {
    const result = await authService.googleLogin(req.body)
    return res.status(200).json(result)
  }
  async staffLogin(req, res) {
    const result = await authService.staffLogin(req.body)
    return res.status(200).json(result)
  }
  async clientLogin(req, res) {
    const result = await authService.clientLogin(req.body)
    return res.status(200).json(result)
  }

  async register(req, res) {
    const result = await authService.register(req.body)
    return res.status(201).json(result)
}

  async me(req, res) {
    const user = await authService.me(req.user)

    return res.status(200).json({
      user
    })
  }

  async changePassword(req, res) {
    const result = await authService.changePassword(req.user, req.body)
    return res.status(200).json(result)
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
