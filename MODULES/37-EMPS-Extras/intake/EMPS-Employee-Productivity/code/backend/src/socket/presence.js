const User = require('../models/User');
const { updateUserPresence, getConnectedUsers } = require('../utils/socketHelpers');

module.exports = (io, socket) => {
  const handlePresence = async (data) => {
    try {
      const { status } = data;
      
      await User.findByIdAndUpdate(socket.user._id, {
        lastSeen: new Date(),
        status: status || 'online'
      });
      
      updateUserPresence(io, socket.user._id, status || 'online');
      
    } catch (error) {
      console.error('Presence update error:', error);
    }
  };
  
  const handleGetOnlineUsers = async () => {
    try {
      const users = getConnectedUsers(io);
      
      const onlineUsers = users.map(u => ({
        userId: u.userId,
        name: u.name,
        role: u.role
      }));
      
      socket.emit('online_users', { users: onlineUsers });
      
    } catch (error) {
      console.error('Get online users error:', error);
      socket.emit('error', { message: 'Failed to get online users' });
    }
  };
  
  const handleGetUserStatus = async (data) => {
    try {
      const { userId } = data;
      
      const user = await User.findById(userId).select('status lastSeen');
      
      if (!user) {
        return socket.emit('error', { message: 'User not found' });
      }
      
      const isOnline = io.sockets.sockets.some(
        s => s.user && s.user._id.toString() === userId.toString()
      );
      
      socket.emit('user_status', {
        userId,
        status: isOnline ? 'online' : user.status || 'offline',
        lastSeen: user.lastSeen
      });
      
    } catch (error) {
      console.error('Get user status error:', error);
      socket.emit('error', { message: 'Failed to get user status' });
    }
  };
  
  socket.on('presence', handlePresence);
  socket.on('get_online_users', handleGetOnlineUsers);
  socket.on('get_user_status', handleGetUserStatus);
  
  io.emit('user_online', {
    userId: socket.user._id,
    name: `${socket.user.firstName} ${socket.user.lastName}`,
    timestamp: new Date()
  });
};