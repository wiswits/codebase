const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason, attachments } = req.body;

    const leave = new Leave({
      employee: req.user.id,
      type,
      startDate,
      endDate,
      reason,
      attachments,
      status: 'pending'
    });

    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'firstName lastName employeeId manager');

    const manager = await User.findById(populatedLeave.employee.manager);
    if (manager) {
      const notification = new Notification({
        recipient: manager._id,
        sender: req.user.id,
        type: 'leave-approved',
        title: 'Leave Request',
        message: `${req.user.firstName} ${req.user.lastName} has applied for leave`,
        data: { leaveId: leave._id },
        link: `/leave/${leave._id}`,
        channels: ['email', 'push', 'in-app']
      });
      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: populatedLeave
    });

  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for leave'
    });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { employee: req.user.id };

    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaves'
    });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    let leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    if (department) {
      leaves = leaves.filter(l => 
        l.employee && l.employee.department && l.employee.department.toString() === department
      );
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaves'
    });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    const leave = await Leave.findById(id).populate('employee', 'firstName lastName employeeId');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request already processed'
      });
    }

    const userRole = req.user.role;
    let workflowUpdate = {};

    if (userRole === 'manager') {
      workflowUpdate = {
        'approvalWorkflow.managerApproval': {
          status,
          by: req.user.id,
          at: new Date(),
          comments
        }
      };
      
      if (status === 'approved') {
        if (leave.type === 'sick' || leave.type === 'emergency') {
          workflowUpdate.status = 'pending';
        } else {
          workflowUpdate.status = 'pending';
        }
      } else {
        workflowUpdate.status = 'rejected';
      }
    } else if (userRole === 'hr' || userRole === 'admin') {
      workflowUpdate = {
        'approvalWorkflow.hrApproval': {
          status,
          by: req.user.id,
          at: new Date(),
          comments
        }
      };
      
      const managerApproval = leave.approvalWorkflow.managerApproval;
      if (managerApproval.status === 'approved' || 
          leave.type === 'sick' || leave.type === 'emergency' ||
          userRole === 'admin') {
        workflowUpdate.status = status;
        workflowUpdate.approvedBy = req.user.id;
        workflowUpdate.approvedAt = new Date();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Manager approval required first'
        });
      }
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      workflowUpdate,
      { new: true }
    ).populate('employee', 'firstName lastName employeeId');

    const notification = new Notification({
      recipient: leave.employee._id,
      sender: req.user.id,
      type: 'leave-approved',
      title: `Leave Request ${status}`,
      message: `Your leave request has been ${status}${comments ? ': ' + comments : ''}`,
      data: { leaveId: leave._id },
      link: `/leave/${leave._id}`,
      channels: ['email', 'push', 'in-app']
    });
    await notification.save();

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: updatedLeave
    });

  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process leave request'
    });
  }
};

exports.getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const leaves = await Leave.find({
      employee: userId,
      status: 'approved',
      startDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Monthly leave allocation (can be moved to a settings table)
    const monthlyAllocation = {
      casual: 2,
      sick: 1,
      emergency: 1,
      paid: 2,
      'half-day': 2,
      'work-from-home': 2
    };

    const balances = {};
    let totalUsed = 0;

    // Initialize balances
    Object.keys(monthlyAllocation).forEach(type => {
      const total = monthlyAllocation[type];
      const used = leaves.filter(l => l.type === type).reduce((sum, l) => sum + l.totalDays, 0);
      balances[type] = {
        total: total,
        used: used,
        remaining: Math.max(0, total - used)
      };
      totalUsed += used;
    });

    res.status(200).json({
      success: true,
      data: balances,
      period: {
        month: now.toLocaleString('default', { month: 'long' }),
        year: currentYear
      },
      summary: {
        totalLeavesTaken: totalUsed,
        totalLeavesAvailable: Object.values(monthlyAllocation).reduce((a, b) => a + b, 0)
      }
    });

  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave balance'
    });
  }
};