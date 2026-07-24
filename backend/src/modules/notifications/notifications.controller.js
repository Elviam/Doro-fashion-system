import { notificationsService } from './notifications.service.js'

export class NotificationsController {
  async list(req, res) {
    const result = await notificationsService.getNotifications(req.user)
    return res.status(200).json(result)
  }
}

export const notificationsController = new NotificationsController()
