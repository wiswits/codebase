const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Notification = require('../models/Notification');

class MeetingService {
  async createMeeting(data) {
    const duration = (new Date(data.endTime) - new Date(data.startTime)) / (1000 * 60);

    const meeting = new Meeting({
      title: data.title,
      description: data.description,
      organizer: data.organizer,
      attendees: data.attendees,
      department: data.department,
      startTime: data.startTime,
      endTime: data.endTime,
      duration,
      location: data.location,
      meetingLink: data.meetingLink,
      meetingType: data.meetingType || 'virtual',
      platform: data.platform || 'google-meet',
      notes: data.notes,
      reminder: data.reminder !== undefined ? data.reminder : true,
      reminderTime: data.reminderTime || 15,
      status: 'scheduled'
    });

    await meeting.save();
    return meeting;
  }

  async updateMeeting(meetingId, updates, userId) {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.organizer.toString() !== userId) {
      const user = await User.findById(userId);
      if (user.role !== 'admin') {
        throw new Error('You are not authorized to update this meeting');
      }
    }

    if (updates.startTime && updates.endTime) {
      updates.duration = (new Date(updates.endTime) - new Date(updates.startTime)) / (1000 * 60);
    }

    Object.assign(meeting, updates);
    await meeting.save();

    return meeting;
  }

  async cancelMeeting(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.organizer.toString() !== userId) {
      const user = await User.findById(userId);
      if (user.role !== 'admin') {
        throw new Error('You are not authorized to cancel this meeting');
      }
    }

    meeting.status = 'cancelled';
    await meeting.save();

    return meeting;
  }

  async addMeetingNotes(meetingId, userId, text) {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    meeting.meetingNotes.push({
      user: userId,
      text,
      createdAt: new Date()
    });

    await meeting.save();
    return meeting;
  }

  async getUpcomingMeetings(userId) {
    const now = new Date();

    return Meeting.find({
      $or: [
        { organizer: userId },
        { attendees: userId }
      ],
      startTime: { $gt: now },
      status: 'scheduled'
    })
    .populate('organizer', 'firstName lastName employeeId')
    .populate('attendees', 'firstName lastName employeeId')
    .populate('department', 'name code')
    .sort({ startTime: 1 });
  }

  async getTodayMeetings(userId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return Meeting.find({
      $or: [
        { organizer: userId },
        { attendees: userId }
      ],
      startTime: { $gte: startOfDay, $lt: endOfDay },
      status: 'scheduled'
    })
    .populate('organizer', 'firstName lastName employeeId')
    .populate('attendees', 'firstName lastName employeeId')
    .populate('department', 'name code')
    .sort({ startTime: 1 });
  }

  async getMeetingReminders() {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

    const meetings = await Meeting.find({
      startTime: { $gt: now, $lt: reminderThreshold },
      status: 'scheduled',
      reminder: true,
      'reminder.sent': { $ne: true }
    })
    .populate('organizer', 'firstName lastName employeeId email')
    .populate('attendees', 'firstName lastName employeeId email');

    return meetings;
  }

  async markReminderSent(meetingId) {
    await Meeting.findByIdAndUpdate(meetingId, {
      'reminder.sent': true,
      'reminder.sentAt': new Date()
    });
  }

  async generateMeetingLink(meeting) {
    if (meeting.platform === 'google-meet') {
      // Google Meet link generation logic
      return `https://meet.google.com/${this.generateMeetCode()}`;
    } else if (meeting.platform === 'zoom') {
      // Zoom link generation logic
      return `https://zoom.us/j/${this.generateZoomMeetingId()}`;
    }
    return meeting.meetingLink || '';
  }

  generateMeetCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateZoomMeetingId() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  async sendMeetingInvites(meeting) {
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    const meetingLink = await this.generateMeetingLink(populatedMeeting);
    populatedMeeting.meetingLink = meetingLink;
    await populatedMeeting.save();

    const notifications = [];
    for (const attendee of populatedMeeting.attendees) {
      const notification = new Notification({
        recipient: attendee._id,
        sender: populatedMeeting.organizer._id,
        type: 'meeting-reminder',
        title: `Meeting Invitation: ${populatedMeeting.title}`,
        message: `You have been invited to a meeting on ${new Date(populatedMeeting.startTime).toLocaleString()}`,
        data: { meetingId: populatedMeeting._id },
        link: `/meetings/${populatedMeeting._id}`,
        channels: ['email', 'push', 'in-app']
      });
      await notification.save();
      notifications.push(notification);
    }

    return notifications;
  }

  async getMeetingStats(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const meetings = await Meeting.find({
      $or: [
        { organizer: userId },
        { attendees: userId }
      ],
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    return {
      total: meetings.length,
      scheduled: meetings.filter(m => m.status === 'scheduled').length,
      completed: meetings.filter(m => m.status === 'completed').length,
      cancelled: meetings.filter(m => m.status === 'cancelled').length,
      upcoming: meetings.filter(m => m.status === 'scheduled' && new Date(m.startTime) > now).length,
      averageDuration: meetings.reduce((sum, m) => sum + (m.duration || 0), 0) / (meetings.length || 1)
    };
  }
}

module.exports = new MeetingService();