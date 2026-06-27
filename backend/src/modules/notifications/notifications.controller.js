import { notificationsService } from './notifications.service.js'

export class NotificationsController {
  async list(req, res) {
    const permissions = req.user?.permissions ?? []
    const result = await notificationsService.getNotifications(permissions)
    return res.status(200).json(result)
  }
}

export const notificationsController = new NotificationsController()