export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',

  // Chat events
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  USER_TYPING: 'user_typing',
  MARK_AS_READ: 'mark_as_read',
  MESSAGES_READ: 'messages_read',
  GET_MESSAGES: 'get_messages',
  CHAT_MESSAGES: 'chat_messages',

  // Notification events
  GET_NOTIFICATIONS: 'get_notifications',
  NOTIFICATIONS: 'notifications',
  MARK_NOTIFICATION_READ: 'mark_notification_read',
  NOTIFICATION_READ: 'notification_read',
  MARK_ALL_READ: 'mark_all_read',
  ALL_READ: 'all_read',
  DELETE_NOTIFICATION: 'delete_notification',
  NOTIFICATION_DELETED: 'notification_deleted',
  GET_UNREAD_COUNT: 'get_unread_count',
  UNREAD_COUNT: 'unread_count',
  NEW_NOTIFICATION: 'new_notification',

  // Presence events
  PRESENCE: 'presence',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_PRESENCE: 'user_presence',
  GET_ONLINE_USERS: 'get_online_users',
  ONLINE_USERS: 'online_users',
  GET_USER_STATUS: 'get_user_status',
  USER_STATUS: 'user_status',

  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',

  // Error events
  ERROR: 'error',
  AUTH_ERROR: 'auth_error',
};

export const SOCKET_ROOMS = {
  USER: (userId) => `user_${userId}`,
  CHAT: (chatId) => `chat_${chatId}`,
  DEPARTMENT: (departmentId) => `department_${departmentId}`,
  NOTIFICATIONS: (userId) => `notifications_${userId}`,
  ALL_USERS: 'all_users',
  ROLE: (role) => `role_${role}`,
};

export const getSocketRoom = (type, id) => {
  switch (type) {
    case 'user':
      return SOCKET_ROOMS.USER(id);
    case 'chat':
      return SOCKET_ROOMS.CHAT(id);
    case 'department':
      return SOCKET_ROOMS.DEPARTMENT(id);
    case 'notifications':
      return SOCKET_ROOMS.NOTIFICATIONS(id);
    default:
      return null;
  }
};

export const emitEvent = (socket, event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
    return true;
  }
  return false;
};

export const onEvent = (socket, event, callback) => {
  if (socket) {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }
  return () => {};
};