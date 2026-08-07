const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getAllAnnouncements = async (req, res) => {
  try {
    const { type, priority, department } = req.query;
    const query = { isActive: true };

    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (department) query.department = department;

    const announcements = await Announcement.find(query)
      .populate('author', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('views.user', 'firstName lastName employeeId')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get announcements'
    });
  }
};

exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('views.user', 'firstName lastName employeeId')
      .populate('comments.user', 'firstName lastName employeeId');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const userId = req.user.id;
    if (!announcement.views.some(v => v.user.toString() === userId)) {
      announcement.views.push({ user: userId, viewedAt: new Date() });
      await announcement.save();
    }

    res.status(200).json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get announcement'
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title, content, type, department, targetRoles,
      priority, attachments, expiresAt, isPinned
    } = req.body;

    const announcement = new Announcement({
      title,
      content,
      type,
      author: req.user.id,
      department,
      targetRoles,
      priority,
      attachments,
      expiresAt,
      isPinned: isPinned || false,
      isActive: true
    });

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'firstName lastName employeeId')
      .populate('department', 'name code');

    let recipients = [];
    if (targetRoles && targetRoles.length > 0) {
      recipients = await User.find({ role: { $in: targetRoles } });
    } else if (department) {
      recipients = await User.find({ department });
    } else {
      recipients = await User.find({});
    }

    for (const recipient of recipients) {
      if (recipient._id.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: recipient._id,
          sender: req.user.id,
          type: 'announcement',
          title: `Announcement: ${title}`,
          message: content.substring(0, 200),
          data: { announcementId: announcement._id },
          link: `/announcements/${announcement._id}`,
          priority: priority === 'urgent' ? 'high' : 'medium',
          channels: ['email', 'push', 'in-app']
        });
        await notification.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: populatedAnnouncement
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this announcement'
      });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('author', 'firstName lastName employeeId')
    .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (announcement.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this announcement'
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.comments.push({
      user: req.user.id,
      text,
      createdAt: new Date()
    });

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(id)
      .populate('comments.user', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedAnnouncement
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

exports.getHolidayList = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      type: 'holiday',
      isActive: true
    })
    .populate('author', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });

  } catch (error) {
    console.error('Get holiday list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get holiday list'
    });
  }
};