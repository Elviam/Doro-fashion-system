import crypto from 'crypto'

export function errorHandler(error, req, res, next) {
  const errorId = crypto.randomUUID()
  const code = error?.code

  console.error(`[${errorId}] ${req.method} ${req.originalUrl}`, error)

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorId,
      ...(error.field && { field: error.field }),
    })
  }

  if (code === 'P2002') {
    return res.status(409).json({
      message: 'Ya existe un registro con esos datos.',
      errorId,
    })
  }

  if (code === 'P2025') {
    return res.status(404).json({
      message: 'El registro solicitado ya no existe.',
      errorId,
    })
  }

  if (['P1001', 'P1002', 'P1017', 'P6001'].includes(code) || error?.name === 'PrismaClientInitializationError') {
    return res.status(503).json({
      message: 'No fue posible conectar con la base de datos. Intenta de nuevo en unos minutos.',
      errorId,
    })
  }

  return res.status(500).json({
    message: 'Ocurrió un error interno. Comparte el identificador de error con el administrador.',
    errorId,
  })
}
