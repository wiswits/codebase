const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.getSocketToken = (socket) => {
  const token = socket.handshake.auth.token || 
                socket.handshake.headers.authorization?.split(' ')[1];
  return token;
};

exports.verifySocketToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('_id firstName lastName employeeId role');
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Socket token verification error:', error);
    return null;
  }
};

exports.getUserRooms = (userId) => {
  return [
    `user_${userId}`,
    'all_users',
    `role_${userId.role}`
  ];
};

exports.getChatRooms = (chatId) => {
  return `chat_${chatId}`;
};

exports.getDepartmentRooms = (departmentId) => {
  return `department_${departmentId}`;
};

exports.getNotificationRoom = (userId) => {
  return `notifications_${userId}`;
};

exports.emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

exports.emitToChat = (io, chatId, event, data) => {
  io.to(`chat_${chatId}`).emit(event, data);
};

exports.emitToDepartment = (io, departmentId, event, data) => {
  io.to(`department_${departmentId}`).emit(event, data);
};

exports.emitToAll = (io, event, data) => {
  io.to('all_users').emit(event, data);
};

exports.broadcastToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

exports.sendNotification = async (io, userId, notification) => {
  io.to(`notifications_${userId}`).emit('new_notification', notification);
};

exports.sendMessage = async (io, chatId, message) => {
  io.to(`chat_${chatId}`).emit('new_message', message);
};

exports.sendTyping = (io, chatId, userId, isTyping) => {
  io.to(`chat_${chatId}`).emit('user_typing', {
    userId,
    isTyping
  });
};

exports.updateUserPresence = (io, userId, status) => {
  io.to('all_users').emit('user_presence', {
    userId,
    status,
    timestamp: new Date()
  });
};

exports.getConnectedUsers = (io) => {
  const sockets = io.sockets.sockets;
  const users = [];
  
  for (const [id, socket] of sockets) {
    if (socket.user) {
      users.push({
        socketId: id,
        userId: socket.user._id,
        name: `${socket.user.firstName} ${socket.user.lastName}`,
        role: socket.user.role
      });
    }
  }
  
  return users;
};

exports.getUserSockets = (io, userId) => {
  const sockets = io.sockets.sockets;
  const userSockets = [];
  
  for (const [id, socket] of sockets) {
    if (socket.user && socket.user._id.toString() === userId.toString()) {
      userSockets.push(id);
    }
  }
  
  return userSockets;
};

exports.disconnectUser = (io, userId) => {
  const sockets = io.sockets.sockets;
  
  for (const [id, socket] of sockets) {
    if (socket.user && socket.user._id.toString() === userId.toString()) {
      socket.disconnect();
    }
  }
};

exports.emitEvent = (io, event, data, options = {}) => {
  const {
    to,
    room,
    department,
    role,
    broadcast = false
  } = options;

  if (to) {
    exports.emitToUser(io, to, event, data);
  } else if (room) {
    exports.emitToChat(io, room, event, data);
  } else if (department) {
    exports.emitToDepartment(io, department, event, data);
  } else if (role) {
    exports.broadcastToRole(io, role, event, data);
  } else if (broadcast) {
    exports.emitToAll(io, event, data);
  } else {
    io.emit(event, data);
  }
};