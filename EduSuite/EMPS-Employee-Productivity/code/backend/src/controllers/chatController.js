const Chat = require('../models/Chat');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'firstName lastName employeeId profilePhoto')
    .populate('lastMessage.sender', 'firstName lastName employeeId')
    .populate('messages.sender', 'firstName lastName employeeId')
    .sort({ 'lastMessage.timestamp': -1 });

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats'
    });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'firstName lastName employeeId profilePhoto')
      .populate('messages.sender', 'firstName lastName employeeId')
      .populate('lastMessage.sender', 'firstName lastName employeeId');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat'
    });
  }
};

exports.createChat = async (req, res) => {
  try {
    const { participants, type, name, department } = req.body;

    const chat = new Chat({
      participants: [req.user.id, ...participants],
      type: type || 'private',
      name,
      department,
      isActive: true
    });

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'firstName lastName employeeId profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: populatedChat
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat'
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, attachments } = req.body;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const message = {
      sender: req.user.id,
      text,
      attachments: attachments || [],
      readBy: [{ user: req.user.id, readAt: new Date() }],
      deliveredTo: [{ user: req.user.id, deliveredAt: new Date() }],
      createdAt: new Date()
    };

    chat.messages.push(message);
    chat.lastMessage = {
      sender: req.user.id,
      text: text || 'Attachment',
      timestamp: new Date()
    };

    await chat.save();

    for (const participant of chat.participants) {
      if (participant.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: participant,
          sender: req.user.id,
          type: 'message',
          title: 'New Message',
          message: text || 'Sent an attachment',
          data: { chatId: chat._id },
          link: `/chat/${chat._id}`,
          channels: ['push', 'in-app']
        });
        await notification.save();
      }
    }

    const updatedChat = await Chat.findById(id)
      .populate('participants', 'firstName lastName employeeId profilePhoto')
      .populate('messages.sender', 'firstName lastName employeeId')
      .populate('lastMessage.sender', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: updatedChat
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    for (const message of chat.messages) {
      if (message.sender.toString() !== userId.toString()) {
        const alreadyRead = message.readBy.some(r => r.user.toString() === userId.toString());
        if (!alreadyRead) {
          message.readBy.push({ user: userId, readAt: new Date() });
        }
      }
    }

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      participants: userId,
      isActive: true
    });

    let totalUnread = 0;

    for (const chat of chats) {
      for (const message of chat.messages) {
        if (message.sender.toString() !== userId.toString()) {
          const isRead = message.readBy.some(r => r.user.toString() === userId.toString());
          if (!isRead) {
            totalUnread++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};