const { verifySocketToken } = require('../utils/socketHelpers');
const chatHandlers = require('./chat');
const notificationHandlers = require('./notification');
const presenceHandlers = require('./presence');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await verifySocketToken(token);
      
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.user = user;
      socket.join(`user_${user._id}`);
      socket.join(`role_${user.role}`);
      socket.join('all_users');
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);

    presenceHandlers(io, socket);
    chatHandlers(io, socket);
    notificationHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
      
      socket.leave(`user_${socket.user._id}`);
      socket.leave(`role_${socket.user.role}`);
      socket.leave('all_users');
      
      io.emit('user_offline', {
        userId: socket.user._id,
        timestamp: new Date()
      });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};