const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, department } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (department) query.department = department;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks'
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('comments.user', 'firstName lastName employeeId')
      .populate('history.changedBy', 'firstName lastName employeeId');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task'
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const {
      title, description, assignedTo, department, priority,
      dueDate, estimatedHours, tags, attachments, subtasks
    } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      department,
      priority,
      dueDate,
      estimatedHours,
      tags,
      attachments,
      subtasks
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('department', 'name code');

    for (const assignee of assignedTo) {
      const notification = new Notification({
        recipient: assignee,
        sender: req.user.id,
        type: 'task-assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        data: { taskId: task._id },
        link: `/tasks/${task._id}`,
        channels: ['email', 'push', 'in-app']
      });
      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const history = [];
    for (const [key, value] of Object.entries(updates)) {
      if (task[key] !== value && key !== 'history' && key !== 'comments') {
        history.push({
          field: key,
          oldValue: task[key],
          newValue: value,
          changedBy: req.user.id,
          changedAt: new Date()
        });
      }
    }

    Object.assign(task, updates);

    if (history.length > 0) {
      task.history.push(...history);
    }

    if (updates.status === 'completed' && task.status !== 'completed') {
      task.completedDate = new Date();
    }

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { assignedTo: userId };
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks'
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, attachments } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user.id,
      text,
      attachments,
      createdAt: new Date()
    });

    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('comments.user', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

exports.uploadWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { workDescription, attachments } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.assignedTo.some(id => id.toString() === req.user.id) && task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload work for this task'
      });
    }

    task.comments.push({
      user: req.user.id,
      text: `Work uploaded: ${workDescription}`,
      attachments,
      createdAt: new Date()
    });

    task.progress = Math.min(task.progress + 10, 100);

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Work uploaded successfully',
      data: task
    });

  } catch (error) {
    console.error('Upload work error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload work'
    });
  }
};