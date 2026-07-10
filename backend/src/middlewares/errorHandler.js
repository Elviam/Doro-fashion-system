export function errorHandler(error, req, res, next) {
  console.error('ERROR =>', error)

  // Errores que tú mismo lanzas a propósito (tienen statusCode definido)
  // — su mensaje es seguro y está pensado para mostrarse al usuario.
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.field && { field: error.field }),
    })
  }

  // Cualquier otro error (Prisma, bugs no controlados, etc.) — nunca
  // exponer error.message al cliente, puede filtrar detalles internos
  // como hashes de contraseñas, nombres de columnas, o queries.
  return res.status(500).json({
    message: 'Ocurrió un error interno. Intenta de nuevo más tarde.',
  })
}