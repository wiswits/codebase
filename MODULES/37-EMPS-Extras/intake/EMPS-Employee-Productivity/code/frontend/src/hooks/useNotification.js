import { useNotification as useNotificationContext } from '../contexts/NotificationContext';

export const useNotification = () => {
  return useNotificationContext();
};