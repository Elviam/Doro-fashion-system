export function errorHandler(error, req, res, next) {
  console.error('ERROR =>', error)

  const status = error.statusCode || 500
  const message = error.message || 'Error interno del servidor'

  return res.status(status).json({
    message
  })
}