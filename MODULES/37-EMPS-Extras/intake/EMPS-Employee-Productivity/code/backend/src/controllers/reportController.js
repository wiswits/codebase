const Report = require('../models/Report');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const User = require('../models/User');

exports.generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate, department } = req.body;

    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    let reportData = {};
    let metrics = {};

    switch(type) {
      case 'daily':
        reportData = await generateDailyReport(dateRange, department);
        break;
      case 'weekly':
        reportData = await generateWeeklyReport(dateRange, department);
        break;
      case 'monthly':
        reportData = await generateMonthlyReport(dateRange, department);
        break;
      case 'task-completion':
        reportData = await generateTaskReport(dateRange, department);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(dateRange, department);
        break;
      case 'attendance':
        reportData = await generateAttendanceReport(dateRange, department);
        break;
      case 'leave':
        reportData = await generateLeaveReport(dateRange, department);
        break;
    }

    metrics = {
      totalEmployees: reportData.totalEmployees || 0,
      presentEmployees: reportData.presentEmployees || 0,
      absentEmployees: reportData.absentEmployees || 0,
      tasksCompleted: reportData.tasksCompleted || 0,
      tasksPending: reportData.tasksPending || 0,
      leavesTaken: reportData.leavesTaken || 0,
      productivity: reportData.productivity || 0
    };

    const report = new Report({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      type,
      generatedBy: req.user.id,
      department,
      dateRange,
      data: reportData,
      summary: generateSummary(reportData, type),
      metrics,
      format: 'json'
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'firstName lastName employeeId')
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: populatedReport
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { type, department, startDate, endDate } = req.query;
    const query = {};

    if (type) query.type = type;
    if (department) query.department = department;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports'
    });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'firstName lastName employeeId')
      .populate('department', 'name code');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report'
    });
  }
};

exports.submitDailyReport = async (req, res) => {
  try {
    const { tasksCompleted, tasksPending, challenges, plans, notes } = req.body;

    const report = new Report({
      title: `Daily Report - ${new Date().toLocaleDateString()}`,
      type: 'daily',
      generatedBy: req.user.id,
      dateRange: {
        start: new Date(),
        end: new Date()
      },
      data: {
        tasksCompleted,
        tasksPending,
        challenges,
        plans,
        notes,
        submittedAt: new Date()
      },
      summary: `Daily report submitted with ${tasksCompleted.length} tasks completed`
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Daily report submitted successfully',
      data: populatedReport
    });

  } catch (error) {
    console.error('Submit daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit daily report'
    });
  }
};

async function generateDailyReport(dateRange, department) {
  const query = {};
  if (department) query.department = department;

  const employees = await User.find(query);
  const employeeIds = employees.map(e => e._id);

  const attendance = await Attendance.find({
    employee: { $in: employeeIds },
    date: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const tasks = await Task.find({
    assignedTo: { $in: employeeIds },
    createdAt: { $gte: dateRange.start, $lte: dateRange.end }
  });

  return {
    totalEmployees: employees.length,
    presentEmployees: attendance.filter(a => a.status === 'present').length,
    absentEmployees: employees.length - attendance.filter(a => a.status === 'present').length,
    tasksCompleted: tasks.filter(t => t.status === 'completed').length,
    tasksPending: tasks.filter(t => t.status !== 'completed').length,
    attendance: attendance,
    tasks: tasks
  };
}

async function generateWeeklyReport(dateRange, department) {
  const dailyReports = await generateDailyReport(dateRange, department);
  return {
    ...dailyReports,
    weekNumber: getWeekNumber(dateRange.start),
    averageAttendance: dailyReports.presentEmployees / dailyReports.totalEmployees * 100,
    weeklyTrend: [/* weekly trend data */]
  };
}

async function generateMonthlyReport(dateRange, department) {
  const weeklyReports = await generateWeeklyReport(dateRange, department);
  return {
    ...weeklyReports,
    month: dateRange.start.getMonth() + 1,
    year: dateRange.start.getFullYear(),
    monthlyGrowth: 0,
    departmentPerformance: {}
  };
}

async function generateTaskReport(dateRange, department) {
  const query = {};
  if (department) query.department = department;

  const tasks = await Task.find({
    ...query,
    createdAt: { $gte: dateRange.start, $lte: dateRange.end }
  });

  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
    overdueTasks: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    tasksByPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length
    },
    tasks: tasks
  };
}

async function generatePerformanceReport(dateRange, department) {
  const query = {};
  if (department) query.department = department;

  const employees = await User.find(query);
  const employeeIds = employees.map(e => e._id);

  const tasks = await Task.find({
    assignedTo: { $in: employeeIds },
    createdAt: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const attendance = await Attendance.find({
    employee: { $in: employeeIds },
    date: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const employeePerformance = employees.map(emp => {
    const empTasks = tasks.filter(t => t.assignedTo.some(id => id.toString() === emp._id.toString()));
    const empAttendance = attendance.filter(a => a.employee.toString() === emp._id.toString());
    
    return {
      employee: emp,
      tasksCompleted: empTasks.filter(t => t.status === 'completed').length,
      tasksAssigned: empTasks.length,
      attendanceRate: empAttendance.length > 0 ? 
        (empAttendance.filter(a => a.status === 'present').length / empAttendance.length * 100) : 0,
      productivity: calculateProductivity(empTasks, empAttendance)
    };
  });

  return {
    totalEmployees: employees.length,
    employeePerformance,
    overallProductivity: employeePerformance.reduce((sum, p) => sum + p.productivity, 0) / employees.length,
    topPerformers: employeePerformance.sort((a, b) => b.productivity - a.productivity).slice(0, 5)
  };
}

async function generateAttendanceReport(dateRange, department) {
  const query = {};
  if (department) query.department = department;

  const employees = await User.find(query);
  const employeeIds = employees.map(e => e._id);

  const attendances = await Attendance.find({
    employee: { $in: employeeIds },
    date: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const attendanceByStatus = {
    present: attendances.filter(a => a.status === 'present').length,
    absent: attendances.filter(a => a.status === 'absent').length,
    late: attendances.filter(a => a.status === 'late').length,
    halfDay: attendances.filter(a => a.status === 'half-day').length,
    onLeave: attendances.filter(a => a.status === 'on-leave').length
  };

  const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
  const expectedAttendance = employees.length * totalDays;

  return {
    totalEmployees: employees.length,
    totalDays,
    expectedAttendance,
    actualAttendance: attendances.length,
    attendanceByStatus,
    attendanceRate: (attendances.length / expectedAttendance * 100),
    employeeAttendance: employees.map(emp => ({
      employee: emp,
      attendance: attendances.filter(a => a.employee.toString() === emp._id.toString())
    }))
  };
}

async function generateLeaveReport(dateRange, department) {
  const query = {};
  if (department) query.department = department;

  const employees = await User.find(query);
  const employeeIds = employees.map(e => e._id);

  const leaves = await Leave.find({
    employee: { $in: employeeIds },
    startDate: { $gte: dateRange.start, $lte: dateRange.end }
  });

  const leaveByType = {
    casual: leaves.filter(l => l.type === 'casual').length,
    sick: leaves.filter(l => l.type === 'sick').length,
    emergency: leaves.filter(l => l.type === 'emergency').length,
    paid: leaves.filter(l => l.type === 'paid').length,
    halfDay: leaves.filter(l => l.type === 'half-day').length,
    workFromHome: leaves.filter(l => l.type === 'work-from-home').length
  };

  return {
    totalLeaves: leaves.length,
    leaveByType,
    approvedLeaves: leaves.filter(l => l.status === 'approved').length,
    pendingLeaves: leaves.filter(l => l.status === 'pending').length,
    rejectedLeaves: leaves.filter(l => l.status === 'rejected').length,
    employeeLeaves: employees.map(emp => ({
      employee: emp,
      leaves: leaves.filter(l => l.employee.toString() === emp._id.toString())
    }))
  };
}

function generateSummary(data, type) {
  switch(type) {
    case 'daily':
      return `Daily report: ${data.presentEmployees}/${data.totalEmployees} employees present. ${data.tasksCompleted} tasks completed.`;
    case 'weekly':
      return `Weekly report: ${data.averageAttendance}% average attendance. ${data.tasksCompleted} tasks completed.`;
    case 'monthly':
      return `Monthly report: ${data.averageAttendance}% average attendance. ${data.tasksCompleted} tasks completed.`;
    case 'task-completion':
      return `Task report: ${data.completedTasks}/${data.totalTasks} tasks completed. ${data.overdueTasks} overdue tasks.`;
    case 'performance':
      return `Performance report: ${data.overallProductivity}% overall productivity.`;
    case 'attendance':
      return `Attendance report: ${data.attendanceRate}% attendance rate.`;
    case 'leave':
      return `Leave report: ${data.totalLeaves} leave requests. ${data.approvedLeaves} approved.`;
    default:
      return 'Report generated successfully';
  }
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function calculateProductivity(tasks, attendance) {
  const taskScore = tasks.length > 0 ? 
    (tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0;
  
  const attendanceScore = attendance.length > 0 ?
    (attendance.filter(a => a.status === 'present').length / attendance.length * 100) : 0;
  
  return (taskScore * 0.6 + attendanceScore * 0.4);
}