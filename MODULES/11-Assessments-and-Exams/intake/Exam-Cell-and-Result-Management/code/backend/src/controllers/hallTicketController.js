import asyncHandler from 'express-async-handler';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import HallTicket from '../models/HallTicket.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import { notifyMany } from '../utils/notify.js';

const generateTicketNo = (examId, rollNo) => `HT${new Date().getFullYear()}${String(rollNo).padStart(4, '0')}${String(examId).slice(-4).toUpperCase()}`;

// @desc    Bulk generate hall tickets for every student in an exam's class
// @route   POST /api/hall-tickets/generate
// @access  Private (Admin, Exam Controller)
export const generateHallTickets = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  const exam = await Exam.findById(examId).populate('class subject');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const students = await User.find({ role: 'student', classAssigned: exam.class._id, status: 'active' }).sort({ rollNo: 1 });
  if (students.length === 0) {
    res.status(400);
    throw new Error('No active students found in this class');
  }

  const tickets = [];
  for (const student of students) {
    const ticketNo = generateTicketNo(exam._id, student.rollNo || '0');
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${ticketNo}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 180 });

    let ticket = await HallTicket.findOne({ student: student._id, exam: exam._id });
    if (!ticket) {
      ticket = await HallTicket.create({
        ticketNo,
        student: student._id,
        exam: exam._id,
        class: exam.class._id,
        room: exam.room,
        qrCodeData,
      });
    }
    tickets.push(ticket);
  }

  const populated = await HallTicket.populate(tickets, [
    { path: 'student', select: 'name rollNo avatar' },
    { path: 'exam', populate: 'subject class' },
    { path: 'class', select: 'name section' },
  ]);

  await notifyMany(students.map((s) => s._id), {
    title: 'Hall Ticket Available',
    message: `Your hall ticket for ${exam.name} is ready to download.`,
    type: 'success',
    link: '/hall-tickets',
  });

  res.status(201).json({ success: true, count: populated.length, data: populated });
});

// @desc    Get hall tickets (filter by exam)
// @route   GET /api/hall-tickets
// @access  Private
export const getHallTickets = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.exam) query.exam = req.query.exam;
  if (req.query.student) query.student = req.query.student;

  const tickets = await HallTicket.find(query)
    .populate('student', 'name rollNo')
    .populate({ path: 'exam', populate: 'subject class' })
    .populate('class', 'name section')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: tickets });
});

// @desc    Get single hall ticket
// @route   GET /api/hall-tickets/:id
// @access  Private
export const getHallTicketById = asyncHandler(async (req, res) => {
  const ticket = await HallTicket.findById(req.params.id)
    .populate('student', 'name rollNo')
    .populate({ path: 'exam', populate: 'subject class' })
    .populate('class', 'name section');
  if (!ticket) {
    res.status(404);
    throw new Error('Hall ticket not found');
  }
  res.json({ success: true, data: ticket });
});

// @desc    Download hall ticket as PDF
// @route   GET /api/hall-tickets/:id/pdf
// @access  Private
export const downloadHallTicketPdf = asyncHandler(async (req, res) => {
  const ticket = await HallTicket.findById(req.params.id)
    .populate('student', 'name rollNo')
    .populate({ path: 'exam', populate: 'subject class' });

  if (!ticket) {
    res.status(404);
    throw new Error('Hall ticket not found');
  }

  const qrBuffer = Buffer.from(ticket.qrCodeData.split(',')[1], 'base64');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=hall-ticket-${ticket.ticketNo}.pdf`);

  const doc = new PDFDocument({ size: 'A5', margin: 30 });
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 70).fill('#3FA46A');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('ECRMS', 30, 24);
  doc.fontSize(11).font('Helvetica').text('Hall Ticket', 30, 46);

  doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text(ticket.exam.name, 30, 90);
  doc.moveDown(0.5);

  const rows = [
    ['Ticket No', ticket.ticketNo],
    ['Student Name', ticket.student.name],
    ['Roll No', ticket.student.rollNo || '-'],
    ['Class', `${ticket.exam.class?.name || ''} ${ticket.exam.class?.section || ''}`],
    ['Subject', ticket.exam.subject?.name || '-'],
    ['Exam Date', new Date(ticket.exam.date).toLocaleDateString('en-IN')],
    ['Time', `${ticket.exam.startTime} - ${ticket.exam.endTime}`],
    ['Room', ticket.room || 'TBD'],
  ];

  let y = doc.y + 10;
  doc.fontSize(10).font('Helvetica');
  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}:`, 30, y, { continued: false, width: 130 });
    doc.font('Helvetica').text(String(value), 165, y);
    y += 20;
  });

  doc.image(qrBuffer, doc.page.width - 130, 90, { width: 90 });

  doc.fontSize(8).fillColor('#94a3b8').text('This is a computer generated hall ticket and does not require a signature.', 30, doc.page.height - 60, {
    width: doc.page.width - 60,
    align: 'center',
  });

  doc.end();
});

// @desc    Publicly verify a hall ticket by its ticket number (what the QR code links to)
// @route   GET /api/verify/hallticket/:ticketNo
// @access  Public — no login required
export const verifyHallTicketPublic = asyncHandler(async (req, res) => {
  const ticket = await HallTicket.findOne({ ticketNo: req.params.ticketNo })
    .populate('student', 'name rollNo')
    .populate({ path: 'exam', populate: ['subject', 'class'] });

  if (!ticket) {
    return res.json({ success: true, valid: false, message: 'No hall ticket found with this number.' });
  }

  res.json({
    success: true,
    valid: true,
    data: {
      ticketNo: ticket.ticketNo,
      studentName: ticket.student?.name,
      rollNo: ticket.student?.rollNo,
      className: ticket.exam?.class ? `${ticket.exam.class.name} ${ticket.exam.class.section}` : null,
      examName: ticket.exam?.name,
      subject: ticket.exam?.subject?.name,
      date: ticket.exam?.date,
      room: ticket.room,
    },
  });
});
