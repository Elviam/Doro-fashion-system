import { verifyAccessToken } from '../config/jwt.js'

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No autorizado'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido o expirado'
    })
  }
}