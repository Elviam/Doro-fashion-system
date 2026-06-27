import { db } from '../../config/firebase.js'

const COLLECTION = 'clients'

export class ClientsRepository {
  async findAll() {
    const snapshot = await db.collection(COLLECTION).get()

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

export const clientsRepository = new ClientsRepository()