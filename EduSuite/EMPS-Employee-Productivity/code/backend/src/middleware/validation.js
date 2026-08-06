const Joi = require('joi');

exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    employeeId: Joi.string().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateEmployee = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'hr', 'manager', 'employee'),
    department: Joi.string(),
    position: Joi.string(),
    phone: Joi.string(),
    address: Joi.string(),
    dateOfBirth: Joi.date(),
    joiningDate: Joi.date(),
    manager: Joi.string(),
    skills: Joi.array().items(Joi.string())
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateAttendance = (req, res, next) => {
  const schema = Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    address: Joi.string(),
    notes: Joi.string()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateTask = (req, res, next) => {
  const schema = Joi.object({
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
    }))
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateLeave = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().valid('casual', 'sick', 'emergency', 'paid', 'half-day', 'work-from-home').required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    reason: Joi.string().required(),
    attachments: Joi.array().items(Joi.object({
      name: Joi.string(),
      url: Joi.string(),
      type: Joi.string()
    }))
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateMeeting = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    attendees: Joi.array().items(Joi.string()).required(),
    department: Joi.string(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    location: Joi.string(),
    meetingLink: Joi.string().uri(),
    meetingType: Joi.string().valid('physical', 'virtual', 'hybrid'),
    platform: Joi.string().valid('google-meet', 'zoom', 'teams', 'other'),
    notes: Joi.string(),
    reminder: Joi.boolean(),
    reminderTime: Joi.number()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateAnnouncement = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    type: Joi.string().valid('company', 'hr', 'holiday', 'birthday', 'achievement', 'emergency', 'policy').required(),
    department: Joi.string(),
    targetRoles: Joi.array().items(Joi.string().valid('admin', 'hr', 'manager', 'employee')),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    expiresAt: Joi.date(),
    isPinned: Joi.boolean()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateDocument = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    type: Joi.string().valid('company-policy', 'hr-policy', 'leave-policy', 'code-of-conduct', 'nda', 'offer-letter', 'salary-slip', 'appointment-letter', 'other').required(),
    category: Joi.string().valid('policy', 'hr', 'legal', 'employee', 'financial').required(),
    department: Joi.string(),
    employee: Joi.string(),
    isPublic: Joi.boolean(),
    accessRoles: Joi.array().items(Joi.string().valid('admin', 'hr', 'manager', 'employee')),
    tags: Joi.array().items(Joi.string()),
    expiresAt: Joi.date()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateReport = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().valid('daily', 'weekly', 'monthly', 'task-completion', 'performance', 'attendance', 'leave').required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    department: Joi.string(),
    format: Joi.string().valid('json', 'pdf', 'excel', 'csv')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};

exports.validateProfileUpdate = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string(),
    address: Joi.string(),
    dateOfBirth: Joi.date(),
    position: Joi.string(),
    skills: Joi.array().items(Joi.string()),
    education: Joi.array().items(Joi.object({
      degree: Joi.string(),
      institution: Joi.string(),
      year: Joi.number(),
      grade: Joi.string()
    })),
    experience: Joi.array().items(Joi.object({
      company: Joi.string(),
      position: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      current: Joi.boolean(),
      description: Joi.string()
    })),
    emergencyContact: Joi.object({
      name: Joi.string(),
      relationship: Joi.string(),
      phone: Joi.string(),
      email: Joi.string().email()
    }),
    bankDetails: Joi.object({
      accountNumber: Joi.string(),
      bankName: Joi.string(),
      ifscCode: Joi.string(),
      accountHolder: Joi.string()
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  next();
};