const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { sendMessage, sendTyping, emitToUser } = require('../utils/socketHelpers');

module.exports = (io, socket) => {
  const handleSendMessage = async (data) => {
    try {
      const { chatId, text, attachments } = data;
      
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      if (!chat.participants.includes(socket.user._id)) {
        return socket.emit('error', { message: 'Not a participant in this chat' });
      }
      
      const message = {
        sender: socket.user._id,
        text: text || '',
        attachments: attachments || [],
        readBy: [{ user: socket.user._id, readAt: new Date() }],
        deliveredTo: [{ user: socket.user._id, deliveredAt: new Date() }],
        createdAt: new Date()
      };
      
      chat.messages.push(message);
      chat.lastMessage = {
        sender: socket.user._id,
        text: text || 'Sent an attachment',
        timestamp: new Date()
      };
      
      await chat.save();
      
      const populatedChat = await Chat.findById(chatId)
        .populate('participants', 'firstName lastName employeeId profilePhoto')
        .populate('messages.sender', 'firstName lastName employeeId')
        .populate('lastMessage.sender', 'firstName lastName employeeId');
      
      const newMessage = populatedChat.messages[populatedChat.messages.length - 1];
      
      io.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message: newMessage,
        chat: populatedChat
      });
      
      for (const participant of chat.participants) {
        if (participant.toString() !== socket.user._id.toString()) {
          const notification = new Notification({
            recipient: participant,
            sender: socket.user._id,
            type: 'message',
            title: 'New Message',
            message: text || 'Sent an attachment',
            data: { chatId: chat._id },
            link: `/chat/${chat._id}`,
            channels: ['push', 'in-app']
          });
          await notification.save();
          
          emitToUser(io, participant, 'new_notification', notification);
        }
      }
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  };
  
  const handleTyping = async (data) => {
    try {
      const { chatId, isTyping } = data;
      
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.user._id,
        isTyping,
        name: `${socket.user.firstName} ${socket.user.lastName}`
      });
      
    } catch (error) {
      console.error('Typing error:', error);
    }
  };
  
  const handleMarkAsRead = async (data) => {
    try {
      const { chatId } = data;
      
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      let updated = false;
      
      for (const message of chat.messages) {
        if (message.sender.toString() !== socket.user._id.toString()) {
          const alreadyRead = message.readBy.some(
            r => r.user.toString() === socket.user._id.toString()
          );
          
          if (!alreadyRead) {
            message.readBy.push({
              user: socket.user._id,
              readAt: new Date()
            });
            updated = true;
          }
        }
      }
      
      if (updated) {
        await chat.save();
        
        io.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          userId: socket.user._id,
          readAt: new Date()
        });
      }
      
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };
  
  const handleGetMessages = async (data) => {
    try {
      const { chatId, limit = 50, skip = 0 } = data;
      
      const chat = await Chat.findById(chatId)
        .populate('messages.sender', 'firstName lastName employeeId');
      
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }
      
      const messages = chat.messages
        .slice(skip, skip + limit)
        .reverse();
      
      socket.emit('chat_messages', {
        chatId,
        messages,
        total: chat.messages.length,
        skip,
        limit
      });
      
    } catch (error) {
      console.error('Get messages error:', error);
      socket.emit('error', { message: 'Failed to get messages' });
    }
  };
  
  socket.on('send_message', handleSendMessage);
  socket.on('typing', handleTyping);
  socket.on('mark_as_read', handleMarkAsRead);
  socket.on('get_messages', handleGetMessages);
};