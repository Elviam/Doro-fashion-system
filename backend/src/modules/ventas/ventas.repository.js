import { db } from '../../config/firebase.js'

const COLLECTION = 'ventas'

export class VentasRepository {
  async findAll() {
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async findById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get()

    if (!doc.exists) return null

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
}

export const ventasRepository = new VentasRepository()
