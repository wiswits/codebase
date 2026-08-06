const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Department = require('../models/Department');

exports.getAdminAnalytics = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const totalEmployees = await User.countDocuments({ isActive: true });
    const totalDepartments = await Department.countDocuments({ isActive: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.find({
      date: today
    });

    const presentEmployees = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentEmployees = totalEmployees - presentEmployees;

    const monthTasks = await Task.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const tasksCompleted = monthTasks.filter(t => t.status === 'completed').length;
    const tasksPending = monthTasks.filter(t => t.status !== 'completed').length;

    const monthLeaves = await Leave.find({
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'approved'
    });

    const departmentPerformance = await getDepartmentPerformance();

    const analytics = {
      employeeCount: totalEmployees,
      departmentCount: totalDepartments,
      presentEmployees,
      absentEmployees,
      attendanceRate: totalEmployees > 0 ? (presentEmployees / totalEmployees * 100) : 0,
      tasksCompleted,
      tasksPending,
      leavesTaken: monthLeaves.length,
      departmentPerformance,
      monthlyGrowth: await getMonthlyGrowth()
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
};

exports.getEmployeeAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthAttendance = await Attendance.find({
      employee: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthTasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalWorkingHours = monthAttendance.reduce((sum, a) => sum + (a.workingHours.actual || 0), 0);
    const totalOvertime = monthAttendance.reduce((sum, a) => sum + (a.workingHours.overtime || 0), 0);

    const analytics = {
      attendanceRate: monthAttendance.length > 0 ? 
        (monthAttendance.filter(a => a.status === 'present' || a.status === 'late').length / monthAttendance.length * 100) : 0,
      totalWorkingHours,
      totalOvertime,
      tasksCompleted: monthTasks.filter(t => t.status === 'completed').length,
      tasksPending: monthTasks.filter(t => t.status !== 'completed').length,
      productivityScore: await calculateProductivityScore(userId, monthAttendance, monthTasks),
      averageLoginTime: getAverageTime(monthAttendance, 'checkIn'),
      averageLogoutTime: getAverageTime(monthAttendance, 'checkOut'),
      dailyTrend: getDailyTrend(monthAttendance)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get employee analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee analytics'
    });
  }
};

exports.getTeamAnalytics = async (req, res) => {
  try {
    const managerId = req.user.id;

    const teamMembers = await User.find({
      manager: managerId,
      isActive: true
    });

    const teamIds = teamMembers.map(m => m._id);

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const teamAttendance = await Attendance.find({
      employee: { $in: teamIds },
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const teamTasks = await Task.find({
      assignedTo: { $in: teamIds },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const teamLeaves = await Leave.find({
      employee: { $in: teamIds },
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'approved'
    });

    const teamPerformance = teamMembers.map(emp => {
      const empAttendance = teamAttendance.filter(a => a.employee.toString() === emp._id.toString());
      const empTasks = teamTasks.filter(t => t.assignedTo.some(id => id.toString() === emp._id.toString()));
      
      return {
        employee: emp,
        attendance: {
          present: empAttendance.filter(a => a.status === 'present').length,
          late: empAttendance.filter(a => a.status === 'late').length,
          absent: empAttendance.filter(a => a.status === 'absent').length
        },
        tasks: {
          completed: empTasks.filter(t => t.status === 'completed').length,
          pending: empTasks.filter(t => t.status !== 'completed').length
        },
        productivity: calculateEmployeeProductivity(empAttendance, empTasks)
      };
    });

    const analytics = {
      teamSize: teamMembers.length,
      teamAttendance: {
        present: teamAttendance.filter(a => a.status === 'present').length,
        late: teamAttendance.filter(a => a.status === 'late').length,
        absent: teamAttendance.filter(a => a.status === 'absent').length
      },
      teamTasks: {
        completed: teamTasks.filter(t => t.status === 'completed').length,
        pending: teamTasks.filter(t => t.status !== 'completed').length,
        total: teamTasks.length
      },
      teamLeaves: teamLeaves.length,
      teamPerformance,
      departmentRanking: await getDepartmentRanking(teamMembers)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team analytics'
    });
  }
};

async function getDepartmentPerformance() {
  const departments = await Department.find({ isActive: true });
  const performance = [];

  for (const dept of departments) {
    const employees = await User.find({ department: dept._id, isActive: true });
    const employeeIds = employees.map(e => e._id);

    const tasks = await Task.find({
      assignedTo: { $in: employeeIds },
      status: 'completed'
    });

    const attendance = await Attendance.find({
      employee: { $in: employeeIds },
      status: 'present'
    });

    performance.push({
      department: dept,
      employeeCount: employees.length,
      tasksCompleted: tasks.length,
      attendance: attendance.length,
      performanceScore: employees.length > 0 ? 
        ((tasks.length / employees.length) * 0.6 + (attendance.length / employees.length) * 0.4) : 0
    });
  }

  return performance.sort((a, b) => b.performanceScore - a.performanceScore);
}

async function getMonthlyGrowth() {
  const months = [];
  const currentDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const tasks = await Task.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    const employees = await User.countDocuments({
      isActive: true,
      joiningDate: { $lte: end }
    });

    months.push({
      month: month.toLocaleString('default', { month: 'short' }),
      year: month.getFullYear(),
      tasksCompleted: tasks.length,
      employees: employees,
      growth: 0
    });
  }

  for (let i = 1; i < months.length; i++) {
    if (months[i-1].employees > 0) {
      months[i].growth = ((months[i].employees - months[i-1].employees) / months[i-1].employees * 100);
    }
  }

  return months;
}

function getAverageTime(attendances, field) {
  const times = attendances
    .filter(a => a[field] && a[field].time)
    .map(a => new Date(a[field].time).getHours() * 60 + new Date(a[field].time).getMinutes());

  if (times.length === 0) return 'N/A';

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const hours = Math.floor(average / 60);
  const minutes = Math.round(average % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getDailyTrend(attendances) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trend = days.map(day => ({ day, count: 0 }));

  attendances.forEach(a => {
    const day = new Date(a.date).getDay();
    trend[day].count++;
  });

  return trend;
}

async function calculateProductivityScore(userId, attendances, tasks) {
  const attendanceScore = attendances.length > 0 ?
    (attendances.filter(a => a.status === 'present' || a.status === 'late').length / attendances.length * 100) : 0;

  const taskScore = tasks.length > 0 ?
    (tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0;

  return (attendanceScore * 0.4 + taskScore * 0.6);
}

function calculateEmployeeProductivity(attendance, tasks) {
  const attendanceScore = attendance.length > 0 ?
    (attendance.filter(a => a.status === 'present').length / attendance.length * 100) : 0;

  const taskScore = tasks.length > 0 ?
    (tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0;

  return (attendanceScore * 0.4 + taskScore * 0.6);
}

async function getDepartmentRanking(teamMembers) {
  const departments = {};
  
  for (const member of teamMembers) {
    if (member.department) {
      const deptId = member.department.toString();
      if (!departments[deptId]) {
        departments[deptId] = { count: 0 };
      }
      departments[deptId].count++;
    }
  }

  return Object.entries(departments).map(([id, data]) => ({
    departmentId: id,
    memberCount: data.count
  }));
}