const Joi = require('joi');

exports.createTaskValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  assignedTo: Joi.array().items(Joi.string()).required(),
  department: Joi.string(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  dueDate: Joi.date().required(),
  estimatedHours: Joi.number(),
  tags: Joi.array().items(Joi.string()),
  subtasks: Joi.array().items(Joi.object({
    title: Joi.string().required(),
    completed: Joi.boolean()
  })),
  attachments: Joi.array().items(Joi.object({
    name: Joi.string(),
    url: Joi.string(),
    type: Joi.string()
  }))
});

exports.updateTaskValidation = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  assignedTo: Joi.array().items(Joi.string()),
  department: Joi.string(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  dueDate: Joi.date(),
  status: Joi.string().valid('pending', 'in-progress', 'review', 'completed', 'cancelled'),
  progress: Joi.number().min(0).max(100),
  estimatedHours: Joi.number(),
  tags: Joi.array().items(Joi.string())
});

exports.addCommentValidation = Joi.object({
  text: Joi.string().required(),
  attachments: Joi.array().items(Joi.string())
});

exports.uploadWorkValidation = Joi.object({
  workDescription: Joi.string().required(),
  attachments: Joi.array().items(Joi.object({
    name: Joi.string(),
    url: Joi.string(),
    type: Joi.string()
  }))
});