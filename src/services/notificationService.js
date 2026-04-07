import axiosInstance from '../api/axiosConfig';

const notificationService = {
  getNotifications: () => axiosInstance.get('/notifications'),
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count'),
  markAllRead: () => axiosInstance.put('/notifications/mark-read'),
};

export default notificationService;
