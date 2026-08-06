const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, info };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #6B7280; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">Employee Management & Productivity System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html
    });
  }

  async sendWelcomeEmail(email, name, employeeId) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Welcome to EMPS!</h2>
        <p>Dear ${name},</p>
        <p>Welcome to the Employee Management & Productivity System. Your account has been created.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Employee ID:</strong> ${employeeId}</p>
          <p><strong>Temporary Password:</strong> Temp123456</p>
        </div>
        <p>Please login and change your password immediately.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Login Here
        </a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">Employee Management & Productivity System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to EMPS',
      html
    });
  }

  async sendLeaveApprovalEmail(email, name, leaveType, status, comments) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Leave Request ${status}</h2>
        <p>Dear ${name},</p>
        <p>Your leave request has been <strong>${status}</strong>.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Type:</strong> ${leaveType}</p>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        </div>
        <p>Login to view details.</p>
        <a href="${process.env.FRONTEND_URL}/leave" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          View Leave Status
        </a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">Employee Management & Productivity System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Leave Request ${status}`,
      html
    });
  }

  async sendTaskAssignmentEmail(email, name, taskTitle, assignedBy, dueDate) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">New Task Assigned</h2>
        <p>Dear ${name},</p>
        <p>You have been assigned a new task.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Task:</strong> ${taskTitle}</p>
          <p><strong>Assigned By:</strong> ${assignedBy}</p>
          <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/tasks" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          View Task
        </a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">Employee Management & Productivity System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'New Task Assigned',
      html
    });
  }

  async sendMeetingInviteEmail(email, name, meetingTitle, organizer, startTime, endTime, meetingLink) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Meeting Invitation</h2>
        <p>Dear ${name},</p>
        <p>You have been invited to a meeting.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Title:</strong> ${meetingTitle}</p>
          <p><strong>Organizer:</strong> ${organizer}</p>
          <p><strong>Start:</strong> ${new Date(startTime).toLocaleString()}</p>
          <p><strong>End:</strong> ${new Date(endTime).toLocaleString()}</p>
          ${meetingLink ? `<p><strong>Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
        </div>
        ${meetingLink ? `<a href="${meetingLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Join Meeting</a>` : ''}
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #9CA3AF; font-size: 12px;">Employee Management & Productivity System</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Meeting Invitation: ${meetingTitle}`,
      html
    });
  }
}

module.exports = new EmailService();