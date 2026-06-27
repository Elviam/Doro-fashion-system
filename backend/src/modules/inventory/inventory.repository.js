import { db } from '../../config/firebase.js'

const PRODUCTS_COLLECTION = 'products'
const MOVEMENTS_COLLECTION = 'inventory_movements'

export class InventoryRepository {
  async findAllProducts() {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async findProductById(productId) {
    const doc = await db.collection(PRODUCTS_COLLECTION).doc(productId).get()

    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async updateProductStock(productId, data) {
    await db.collection(PRODUCTS_COLLECTION).doc(productId).update(data)
    return this.findProductById(productId)
  }

  async createMovement(data) {
    const ref = await db.collection(MOVEMENTS_COLLECTION).add(data)
    const doc = await ref.get()

    return {
      id: doc.id,
      ...doc.data()
    }
  }

  async findAllMovements() {
    const snapshot = await db.collection(MOVEMENTS_COLLECTION).get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  }
}

export const inventoryRepository = new InventoryRepository()