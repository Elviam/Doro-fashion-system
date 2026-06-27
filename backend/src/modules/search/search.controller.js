import { performSearch } from './search.service.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "El término de búsqueda debe tener al menos 2 caracteres." });
    }

    const resultados = await performSearch(q.trim());
    
    res.status(200).json(resultados);
  } catch (error) {
    next(error);
  }
};