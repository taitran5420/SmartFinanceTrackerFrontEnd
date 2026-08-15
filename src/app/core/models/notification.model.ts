import { NotificationType } from './enums';

export interface NotificationResponse {
  id?: string;
  title?: string;
  message?: string;
  notificationType?: NotificationType;
  isRead?: boolean;
}
