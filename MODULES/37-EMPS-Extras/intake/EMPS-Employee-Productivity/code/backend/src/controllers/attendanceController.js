const Attendance = require('../models/Attendance');
const User = require('../models/User');

exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, address, notes } = req.body;
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today'
      });
    }

    const checkInTime = new Date();
    const startTime = new Date();
    startTime.setHours(9, 0, 0);
    
    const isLate = checkInTime > startTime;
    const lateMinutes = isLate ? Math.floor((checkInTime - startTime) / (1000 * 60)) : 0;

    let attendance = existingAttendance;

    if (!attendance) {
      attendance = new Attendance({
        employee: userId,
        date: today,
        workingHours: { scheduled: 8 }
      });
    }

    attendance.checkIn = {
      time: checkInTime,
      location: { latitude, longitude, address },
      ip: req.ip,
      deviceInfo: req.headers['user-agent'],
      notes
    };

    attendance.status = isLate ? 'late' : 'present';
    attendance.lateLogin = {
      isLate,
      minutes: lateMinutes
    };

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: attendance
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in'
    });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude, address, notes } = req.body;
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in found for today'
      });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out'
      });
    }

    const checkOutTime = new Date();
    const endTime = new Date();
    endTime.setHours(18, 0, 0);
    
    const isEarly = checkOutTime < endTime;
    const earlyMinutes = isEarly ? Math.floor((endTime - checkOutTime) / (1000 * 60)) : 0;

    attendance.checkOut = {
      time: checkOutTime,
      location: { latitude, longitude, address },
      ip: req.ip,
      deviceInfo: req.headers['user-agent'],
      notes
    };

    attendance.earlyLogout = {
      isEarly,
      minutes: earlyMinutes
    };

    if (attendance.checkIn.time) {
      const checkInTime = new Date(attendance.checkIn.time).getTime();
      const checkOutTimeMs = checkOutTime.getTime();
      
      let totalHours = (checkOutTimeMs - checkInTime) / (1000 * 60 * 60);
      
      if (attendance.lunchBreak.start && attendance.lunchBreak.end) {
        const lunchDuration = (new Date(attendance.lunchBreak.end).getTime() - new Date(attendance.lunchBreak.start).getTime()) / (1000 * 60 * 60);
        totalHours -= lunchDuration;
        attendance.lunchBreak.duration = lunchDuration * 60;
      }
      
      attendance.workingHours.actual = parseFloat(totalHours.toFixed(2));
      attendance.workingHours.totalHours = parseFloat(totalHours.toFixed(2));
      
      const scheduledHours = attendance.workingHours.scheduled || 8;
      if (totalHours > scheduledHours) {
        attendance.workingHours.overtime = parseFloat((totalHours - scheduledHours).toFixed(2));
      }
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: attendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out'
    });
  }
};

exports.lunchBreakStart = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Please check in first'
      });
    }

    if (attendance.lunchBreak.start) {
      return res.status(400).json({
        success: false,
        message: 'Lunch break already started'
      });
    }

    attendance.lunchBreak.start = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Lunch break started',
      data: attendance
    });

  } catch (error) {
    console.error('Lunch break start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start lunch break'
    });
  }
};

exports.lunchBreakEnd = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Please check in first'
      });
    }

    if (!attendance.lunchBreak.start) {
      return res.status(400).json({
        success: false,
        message: 'Lunch break not started'
      });
    }

    if (attendance.lunchBreak.end) {
      return res.status(400).json({
        success: false,
        message: 'Lunch break already ended'
      });
    }

    const endTime = new Date();
    attendance.lunchBreak.end = endTime;
    
    const duration = (endTime - new Date(attendance.lunchBreak.start)) / (1000 * 60);
    attendance.lunchBreak.duration = Math.round(duration);

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Lunch break ended',
      data: attendance
    });

  } catch (error) {
    console.error('Lunch break end error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end lunch break'
    });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const userId = req.user.id;

    const query = { employee: userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (status) query.status = status;

    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance history'
    });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const attendances = await Attendance.find({
      employee: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const stats = {
      present: attendances.filter(a => a.status === 'present').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      late: attendances.filter(a => a.status === 'late').length,
      halfDay: attendances.filter(a => a.status === 'half-day').length,
      onLeave: attendances.filter(a => a.status === 'on-leave').length,
      totalWorkingHours: 0,
      totalOvertime: 0,
      totalLateMinutes: 0
    };

    attendances.forEach(a => {
      if (a.workingHours.actual) {
        stats.totalWorkingHours += a.workingHours.actual;
      }
      if (a.workingHours.overtime) {
        stats.totalOvertime += a.workingHours.overtime;
      }
      if (a.lateLogin.minutes) {
        stats.totalLateMinutes += a.lateLogin.minutes;
      }
    });

    stats.totalWorkingHours = parseFloat(stats.totalWorkingHours.toFixed(2));
    stats.totalOvertime = parseFloat(stats.totalOvertime.toFixed(2));

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance statistics'
    });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (status) query.status = status;

    let attendances = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 });

    if (department) {
      attendances = attendances.filter(a => 
        a.employee && a.employee.department && a.employee.department.toString() === department
      );
    }

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances
    });

  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance data'
    });
  }
};

exports.correctAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { corrections, reason } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const correctionHistory = {
      isCorrected: true,
      correctedBy: req.user.id,
      reason,
      corrections: corrections.map(c => ({
        field: c.field,
        oldValue: attendance[c.field],
        newValue: c.value,
        correctedAt: new Date()
      })),
      correctedAt: new Date()
    };

    corrections.forEach(c => {
      attendance[c.field] = c.value;
    });

    attendance.manualCorrection = correctionHistory;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance corrected successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Correct attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to correct attendance'
    });
  }
};

exports.getDepartmentAttendance = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendances = await Attendance.find(query)
      .populate({
        path: 'employee',
        match: { department: departmentId },
        select: 'firstName lastName employeeId'
      })
      .sort({ date: -1 });

    const filtered = attendances.filter(a => a.employee);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });

  } catch (error) {
    console.error('Get department attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department attendance'
    });
  }
};