# Employee Management & Productivity System (EMPS)

## Overview
EMPS is a comprehensive employee management system that provides centralized platform for Admin, HR, Managers, and Employees to manage daily work, attendance, productivity, communication, meetings, leave, reports, and company documents from a single dashboard.

## Features
- **Authentication**: Login with Employee ID and Password, Forgot Password, Remember Me
- **Role-Based Access**: Admin, HR, Manager, Employee with different permissions
- **Attendance Management**: Check In/Out, Lunch Break, Work Timer, Attendance History
- **Task Management**: Create, Assign, Track tasks with priorities and deadlines
- **Leave Management**: Apply, Approve, Track leave requests
- **Meeting Management**: Schedule, Join, Calendar, Meeting Notes
- **Communication**: Chat, Announcements, File Sharing
- **Documents**: Upload, Manage company policies, HR documents
- **Reports**: Daily, Weekly, Monthly reports with analytics
- **Notifications**: Real-time notifications for all activities

## Technology Stack
- **Backend**: Node.js, Express.js, MongoDB, Socket.io
- **Authentication**: JWT, bcrypt
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Storage**: Cloudinary
- **Reporting**: PDFKit, XLSX

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Redis (optional)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/emps.git
cd emps/backend