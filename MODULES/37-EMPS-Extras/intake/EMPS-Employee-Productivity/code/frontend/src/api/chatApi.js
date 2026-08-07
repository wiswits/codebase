import axios from './axios';

export const chatApi = {
  getChats: () => axios.get('/chat'),
  getById: (id) => axios.get(`/chat/${id}`),
  getUnread: () => axios.get('/chat/unread'),
  create: (data) => axios.post('/chat', data),
  sendMessage: (id, data) => axios.post(`/chat/${id}/messages`, data),
  markAsRead: (id) => axios.put(`/chat/${id}/read`),
};