import { dashboardService } from './dashboard.service.js'

export class DashboardController {
  async summary(req, res) {
    const result = await dashboardService.summary()

    return res.status(200).json(result)
  }

  async recentActivity(req, res) {
    const result = await dashboardService.recentActivity(req.query.limit)

    return res.status(200).json(result)
  }
}

export const dashboardController = new DashboardController()