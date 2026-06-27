import { db } from '../../config/firebase.js'

const COLLECTION = 'suppliers'

export class SuppliersRepository {
   async findAll({ q = '', activo, page = 1, limit = 10 } = {}) {
    let query = db.collection(COLLECTION)

    // Filtro por activo si se recibe
    if (typeof activo === 'boolean') {
      query = query.where('activo', '==', activo)
    }

    const snapshot = await query.get()

    let items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    // Filtro por búsqueda en JS (Firestore no hace LIKE)
    if (q) {
      const q_lower = q.toLowerCase()
      items = items.filter((s) =>
        s.nombre?.toLowerCase().includes(q_lower) ||
        s.rfc?.toLowerCase().includes(q_lower) ||
        s.giro?.toLowerCase().includes(q_lower) ||
        s.telefono?.toLowerCase().includes(q_lower)
      )
    }

    const total = items.length

    // Paginación manual
    const start = (page - 1) * limit
    const paginated = items.slice(start, start + limit)

    return { items: paginated, total, page, limit }
  }

  async findById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get()

    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async findByEmail(email) {
    const snapshot = await db
      .collection(COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async findByRfc(rfc) {
    const snapshot = await db
      .collection(COLLECTION)
      .where('rfc', '==', rfc)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async create(data) {
    const ref = await db.collection(COLLECTION).add(data)
    const doc = await ref.get()

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async update(id, data) {
    await db.collection(COLLECTION).doc(id).update(data)
    return this.findById(id)
  }

  async remove(id) {
    await db.collection(COLLECTION).doc(id).delete()
    return true
  }
}

export const suppliersRepository = new SuppliersRepository()