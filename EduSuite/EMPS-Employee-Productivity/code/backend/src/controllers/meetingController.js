const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getAllMeetings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'firstName lastName employeeId')
      .populate('attendees', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });

  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meetings'
    });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'firstName lastName employeeId')
      .populate('attendees', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('meetingNotes.user', 'firstName lastName employeeId');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.status(200).json({
      success: true,
      data: meeting
    });

  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meeting'
    });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const {
      title, description, attendees, department, startTime, endTime,
      location, meetingLink, meetingType, platform, notes
    } = req.body;

    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60);

    const meeting = new Meeting({
      title,
      description,
      organizer: req.user.id,
      attendees,
      department,
      startTime,
      endTime,
      duration,
      location,
      meetingLink,
      meetingType,
      platform,
      notes,
      status: 'scheduled'
    });

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'firstName lastName employeeId')
      .populate('attendees', 'firstName lastName employeeId')
      .populate('department', 'name code');

    for (const attendee of attendees) {
      const notification = new Notification({
        recipient: attendee,
        sender: req.user.id,
        type: 'meeting-reminder',
        title: 'New Meeting Scheduled',
        message: `You have been invited to: ${title}`,
        data: { meetingId: meeting._id },
        link: `/meetings/${meeting._id}`,
        channels: ['email', 'push', 'in-app']
      });
      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: populatedMeeting
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting'
    });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this meeting'
      });
    }

    if (updates.startTime && updates.endTime) {
      updates.duration = (new Date(updates.endTime) - new Date(updates.startTime)) / (1000 * 60);
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('organizer', 'firstName lastName employeeId')
    .populate('attendees', 'firstName lastName employeeId')
    .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting'
    });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this meeting'
      });
    }

    await meeting.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting'
    });
  }
};

exports.addMeetingNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    meeting.meetingNotes.push({
      user: req.user.id,
      text,
      createdAt: new Date()
    });

    await meeting.save();

    const updatedMeeting = await Meeting.findById(id)
      .populate('meetingNotes.user', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Meeting note added successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Add meeting notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add meeting notes'
    });
  }
};

exports.getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      $or: [
        { organizer: userId },
        { attendees: userId }
      ]
    })
    .populate('organizer', 'firstName lastName employeeId')
    .populate('attendees', 'firstName lastName employeeId')
    .populate('department', 'name code')
    .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });

  } catch (error) {
    console.error('Get my meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meetings'
    });
  }
};