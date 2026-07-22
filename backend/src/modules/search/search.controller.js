import { performSearch } from './search.service.js'

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Escribe un término de búsqueda.' })
    }

    const resultados = await performSearch(q, req.user?.permissions || [])
    return res.status(200).json(resultados)
  } catch (error) {
    next(error)
  }
}
