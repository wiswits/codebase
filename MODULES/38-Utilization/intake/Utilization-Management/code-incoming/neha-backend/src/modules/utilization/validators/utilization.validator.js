const Joi = require('joi');

const validateEmployee = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    department: Joi.string().min(2).max(50).required(),
    designation: Joi.string().min(2).max(50).required(),
    employmentStatus: Joi.string().valid('active', 'bench', 'inactive').default('active'),
    weeklyCapacity: Joi.number().min(0).max(168).default(40)
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  next();
};

const validateProject = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    client: Joi.string().min(2).max(50).required(),
    department: Joi.string().min(2).max(50).required(),
    projectManager: Joi.string().min(2).max(50).required(),
    status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').default('active'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  next();
};

const validateAllocation = (req, res, next) => {
  const schema = Joi.object({
    employeeId: Joi.number().integer().positive().required(),
    projectId: Joi.number().integer().positive().required(),
    allocationPercent: Joi.number().min(0).max(100).required(),
    workingHours: Joi.number().min(0).max(168).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    status: Joi.string().valid('active', 'completed', 'cancelled').default('active')
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  next();
};

module.exports = { validateEmployee, validateProject, validateAllocation };