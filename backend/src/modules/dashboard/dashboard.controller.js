import { dashboardService } from './dashboard.service.js'

export class DashboardController {
  async summary(req, res) {
    const days = [1, 7, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 30
    const result = await dashboardService.summary(days)

    return res.status(200).json(result)
  }

  async recentActivity(req, res) {
    const result = await dashboardService.recentActivity(req.query.limit)

    return res.status(200).json(result)
  }
}

export const dashboardController = new DashboardController()
