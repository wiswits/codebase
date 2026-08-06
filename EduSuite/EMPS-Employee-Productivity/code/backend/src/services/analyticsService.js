const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Department = require('../models/Department');

class AnalyticsService {
  async getSystemAnalytics() {
    const totalEmployees = await User.countDocuments({ isActive: true });
    const totalDepartments = await Department.countDocuments({ isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = await Attendance.find({ date: today });
    const presentEmployees = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: { $ne: 'completed' } });
    
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthLeaves = await Leave.countDocuments({
      startDate: { $gte: startOfMonth },
      status: 'approved'
    });

    return {
      totalEmployees,
      totalDepartments,
      presentEmployees,
      absentEmployees: totalEmployees - presentEmployees,
      attendanceRate: totalEmployees > 0 ? (presentEmployees / totalEmployees * 100) : 0,
      completedTasks,
      pendingTasks,
      leavesTaken: monthLeaves
    };
  }

  async getEmployeeAnalytics(userId) {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

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

    const completedTasks = monthTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = monthTasks.filter(t => t.status !== 'completed').length;

    const attendanceRate = monthAttendance.length > 0 ?
      (monthAttendance.filter(a => a.status === 'present' || a.status === 'late').length / monthAttendance.length * 100) : 0;

    return {
      attendanceRate,
      totalWorkingHours,
      totalOvertime,
      completedTasks,
      pendingTasks,
      productivityScore: (attendanceRate * 0.4 + (completedTasks / (completedTasks + pendingTasks || 1)) * 100 * 0.6)
    };
  }

  async getDepartmentAnalytics(departmentId) {
    const employees = await User.find({ department: departmentId, isActive: true });
    const employeeIds = employees.map(e => e._id);

    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const departmentAttendance = await Attendance.find({
      employee: { $in: employeeIds },
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const departmentTasks = await Task.find({
      assignedTo: { $in: employeeIds },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const completedTasks = departmentTasks.filter(t => t.status === 'completed').length;
    const presentEmployees = departmentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;

    return {
      totalEmployees: employees.length,
      presentEmployees,
      absentEmployees: employees.length - presentEmployees,
      attendanceRate: employees.length > 0 ? (presentEmployees / (employees.length * 22) * 100) : 0,
      completedTasks,
      pendingTasks: departmentTasks.length - completedTasks,
      averageProductivity: this.calculateDepartmentProductivity(employees, departmentAttendance, departmentTasks)
    };
  }

  calculateDepartmentProductivity(employees, attendance, tasks) {
    if (employees.length === 0) return 0;
    
    let totalProductivity = 0;
    for (const emp of employees) {
      const empAttendance = attendance.filter(a => a.employee.toString() === emp._id.toString());
      const empTasks = tasks.filter(t => t.assignedTo.includes(emp._id));
      
      const attendanceScore = empAttendance.length > 0 ?
        (empAttendance.filter(a => a.status === 'present').length / empAttendance.length * 100) : 0;
      
      const taskScore = empTasks.length > 0 ?
        (empTasks.filter(t => t.status === 'completed').length / empTasks.length * 100) : 0;
      
      totalProductivity += (attendanceScore * 0.4 + taskScore * 0.6);
    }
    
    return totalProductivity / employees.length;
  }

  async getTopPerformers(limit = 10) {
    const employees = await User.find({ isActive: true, role: 'employee' });
    const performers = [];

    for (const emp of employees) {
      const analytics = await this.getEmployeeAnalytics(emp._id);
      performers.push({
        employee: emp,
        score: analytics.productivityScore,
        tasksCompleted: analytics.completedTasks,
        attendanceRate: analytics.attendanceRate
      });
    }

    return performers.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async getMonthlyTrends() {
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const tasks = await Task.countDocuments({
        createdAt: { $gte: start, $lte: end },
        status: 'completed'
      });

      const employees = await User.countDocuments({
        isActive: true,
        joiningDate: { $lte: end }
      });

      const attendance = await Attendance.countDocuments({
        date: { $gte: start, $lte: end },
        status: 'present'
      });

      months.push({
        month: month.toLocaleString('default', { month: 'short' }),
        year: month.getFullYear(),
        tasksCompleted: tasks,
        employees: employees,
        attendance: attendance,
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
}

module.exports = new AnalyticsService();