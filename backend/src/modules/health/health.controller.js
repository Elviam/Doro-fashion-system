export function healthCheck(req, res) {
  return res.status(200).json({
    status: 'ok',
    service: 'doro-erp-api',
    timestamp: new Date().toISOString()
  })
}
