const Attendance = require('../models/Attendance');
const User = require('../models/User');

class AttendanceService {
  async checkIn(userId, data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (attendance && attendance.checkIn.time) {
      throw new Error('Already checked in today');
    }

    const checkInTime = new Date();
    const startTime = new Date();
    startTime.setHours(9, 0, 0);
    
    const isLate = checkInTime > startTime;
    const lateMinutes = isLate ? Math.floor((checkInTime - startTime) / (1000 * 60)) : 0;

    if (!attendance) {
      attendance = new Attendance({
        employee: userId,
        date: today,
        workingHours: { scheduled: 8 }
      });
    }

    attendance.checkIn = {
      time: checkInTime,
      location: data.location || {},
      ip: data.ip,
      deviceInfo: data.deviceInfo,
      notes: data.notes
    };

    attendance.status = isLate ? 'late' : 'present';
    attendance.lateLogin = {
      isLate,
      minutes: lateMinutes
    };

    await attendance.save();
    return attendance;
  }

  async checkOut(userId, data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (!attendance) {
      throw new Error('No check-in found for today');
    }

    if (attendance.checkOut.time) {
      throw new Error('Already checked out today');
    }

    const checkOutTime = new Date();
    const endTime = new Date();
    endTime.setHours(18, 0, 0);
    
    const isEarly = checkOutTime < endTime;
    const earlyMinutes = isEarly ? Math.floor((endTime - checkOutTime) / (1000 * 60)) : 0;

    attendance.checkOut = {
      time: checkOutTime,
      location: data.location || {},
      ip: data.ip,
      deviceInfo: data.deviceInfo,
      notes: data.notes
    };

    attendance.earlyLogout = {
      isEarly,
      minutes: earlyMinutes
    };

    if (attendance.checkIn.time) {
      await this.calculateWorkingHours(attendance);
    }

    await attendance.save();
    return attendance;
  }

  async lunchBreakStart(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (!attendance) {
      throw new Error('Please check in first');
    }

    if (attendance.lunchBreak.start) {
      throw new Error('Lunch break already started');
    }

    attendance.lunchBreak.start = new Date();
    await attendance.save();

    return attendance;
  }

  async lunchBreakEnd(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: userId,
      date: today
    });

    if (!attendance) {
      throw new Error('Please check in first');
    }

    if (!attendance.lunchBreak.start) {
      throw new Error('Lunch break not started');
    }

    if (attendance.lunchBreak.end) {
      throw new Error('Lunch break already ended');
    }

    const endTime = new Date();
    attendance.lunchBreak.end = endTime;
    
    const duration = (endTime - new Date(attendance.lunchBreak.start)) / (1000 * 60);
    attendance.lunchBreak.duration = Math.round(duration);

    if (attendance.checkIn.time && attendance.checkOut.time) {
      await this.calculateWorkingHours(attendance);
    }

    await attendance.save();
    return attendance;
  }

  async calculateWorkingHours(attendance) {
    const checkInTime = new Date(attendance.checkIn.time).getTime();
    const checkOutTime = new Date(attendance.checkOut.time).getTime();
    
    let totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
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

    return attendance;
  }

  async getAttendanceHistory(userId, filters = {}) {
    const query = { employee: userId };

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    if (filters.status) query.status = filters.status;

    return Attendance.find(query)
      .sort({ date: -1 })
      .limit(filters.limit || 100);
  }

  async getAttendanceStats(userId) {
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
      totalLateMinutes: 0,
      averageWorkingHours: 0
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

    const totalDays = attendances.length || 1;
    stats.averageWorkingHours = parseFloat((stats.totalWorkingHours / totalDays).toFixed(2));
    stats.totalWorkingHours = parseFloat(stats.totalWorkingHours.toFixed(2));
    stats.totalOvertime = parseFloat(stats.totalOvertime.toFixed(2));

    return stats;
  }

  async getTeamAttendance(managerId, filters = {}) {
    const teamMembers = await User.find({
      manager: managerId,
      isActive: true
    });

    const teamIds = teamMembers.map(m => m._id);
    const query = { employee: { $in: teamIds } };

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    if (filters.status) query.status = filters.status;

    return Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ date: -1 });
  }

  async manualCorrection(attendanceId, corrections, reason, correctedBy) {
    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    const correctionHistory = {
      isCorrected: true,
      correctedBy,
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

    return attendance;
  }
}

module.exports = new AttendanceService();