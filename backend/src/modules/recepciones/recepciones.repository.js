import { db } from '../../config/firebase.js'

const RECEPCIONES_COLLECTION = 'recepciones'
const SUPPLIERS_COLLECTION = 'suppliers'
const PRODUCTS_COLLECTION = 'products'
const MOVEMENTS_COLLECTION = 'inventory_movements'

export class RecepcionesRepository {
  async findAll() {
    const snapshot = await db.collection(RECEPCIONES_COLLECTION).get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async findById(id) {
    const doc = await db.collection(RECEPCIONES_COLLECTION).doc(id).get()

    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async findByFolio(folio) {
    const snapshot = await db
      .collection(RECEPCIONES_COLLECTION)
      .where('folio', '==', folio)
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
    const ref = await db.collection(RECEPCIONES_COLLECTION).add(data)
    const doc = await ref.get()

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async update(id, data) {
    await db.collection(RECEPCIONES_COLLECTION).doc(id).update(data)
    return this.findById(id)
  }

  async remove(id) {
    await db.collection(RECEPCIONES_COLLECTION).doc(id).delete()
    return true
  }

  async findSupplierById(id) {
    const doc = await db.collection(SUPPLIERS_COLLECTION).doc(id).get()

    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async findProductById(id) {
    const doc = await db.collection(PRODUCTS_COLLECTION).doc(id).get()

    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async updateProduct(id, data) {
    await db.collection(PRODUCTS_COLLECTION).doc(id).update(data)
    return this.findProductById(id)
  }

  async createInventoryMovement(data) {
    const ref = await db.collection(MOVEMENTS_COLLECTION).add(data)
    const doc = await ref.get()

    return {
      id: doc.id,
      ...doc.data()
    }
  }
}

export const recepcionesRepository = new RecepcionesRepository()