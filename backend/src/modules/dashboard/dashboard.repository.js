import { db } from '../../config/firebase.js'

export class DashboardRepository {
  async getCollectionItems(collectionName) {
    const snapshot = await db.collection(collectionName).get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  }
}

export const dashboardRepository = new DashboardRepository()