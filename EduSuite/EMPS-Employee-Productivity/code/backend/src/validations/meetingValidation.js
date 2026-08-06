const Joi = require('joi');

exports.createMeetingValidation = Joi.object({
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

exports.updateMeetingValidation = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  attendees: Joi.array().items(Joi.string()),
  department: Joi.string(),
  startTime: Joi.date(),
  endTime: Joi.date(),
  location: Joi.string(),
  meetingLink: Joi.string().uri(),
  meetingType: Joi.string().valid('physical', 'virtual', 'hybrid'),
  platform: Joi.string().valid('google-meet', 'zoom', 'teams', 'other'),
  notes: Joi.string(),
  status: Joi.string().valid('scheduled', 'ongoing', 'completed', 'cancelled')
});

exports.addMeetingNotesValidation = Joi.object({
  text: Joi.string().required()
});