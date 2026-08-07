const moment = require('moment');

exports.getToday = () => {
  return new Date().setHours(0, 0, 0, 0);
};

exports.getDate = (date = new Date()) => {
  return new Date(date).setHours(0, 0, 0, 0);
};

exports.getStartOfDay = (date = new Date()) => {
  return new Date(date.setHours(0, 0, 0, 0));
};

exports.getEndOfDay = (date = new Date()) => {
  return new Date(date.setHours(23, 59, 59, 999));
};

exports.getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.getEndOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6;
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
};

exports.getStartOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

exports.getEndOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

exports.getStartOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 0, 1);
};

exports.getEndOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};

exports.formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

exports.formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

exports.parseDate = (dateString, format = 'YYYY-MM-DD') => {
  return moment(dateString, format).toDate();
};

exports.addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

exports.subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

exports.addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

exports.subtractMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};

exports.addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

exports.subtractYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
};

exports.daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

exports.weeksBetween = (date1, date2) => {
  const days = exports.daysBetween(date1, date2);
  return Math.ceil(days / 7);
};

exports.monthsBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  let months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
};

exports.isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

exports.isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};

exports.isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(date);
  return d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();
};

exports.isThisWeek = (date) => {
  const now = new Date();
  const startOfWeek = exports.getStartOfWeek(now);
  const endOfWeek = exports.getEndOfWeek(now);
  const d = new Date(date);
  return d >= startOfWeek && d <= endOfWeek;
};

exports.isThisMonth = (date) => {
  const now = new Date();
  const d = new Date(date);
  return d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
};

exports.isThisYear = (date) => {
  const now = new Date();
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear();
};

exports.isWeekend = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
};

exports.isWeekday = (date) => {
  return !exports.isWeekend(date);
};

exports.getAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

exports.getTimeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
};

exports.getWorkingHours = (startTime, endTime, lunchBreak) => {
  return exports.calculateWorkingHours(startTime, endTime, lunchBreak);
};

exports.isWorkingHours = (time) => {
  const d = new Date(time);
  const hours = d.getHours();
  return hours >= 9 && hours < 18;
};

exports.getBusinessDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (!exports.isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};