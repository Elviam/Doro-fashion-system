export function healthCheck(req, res) {
  return res.status(200).json({
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  })
}