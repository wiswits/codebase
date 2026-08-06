import { 
  format, 
  parseISO, 
  differenceInDays, 
  differenceInHours, 
  differenceInMinutes,
  addDays, 
  subDays, 
  addMonths, 
  subMonths,
  addYears, 
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  isWeekend,
  isWeekday,
  getDate,
  getDay,
  getMonth,
  getYear
} from 'date-fns';

export const dateUtils = {
  format,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  subDays,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  isWeekend,
  isWeekday,
  getDate,
  getDay,
  getMonth,
  getYear
};

export const getDateRange = (period) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'yesterday':
      const yesterday = subDays(now, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case 'week':
      start = startOfWeek(now);
      end = endOfWeek(now);
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1);
      end = new Date(now.getFullYear(), quarterMonth + 3, 0);
      end = endOfDay(end);
      break;
    case 'year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    default:
      return null;
  }

  return { start, end };
};

export const getBusinessDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export const getWorkingHours = (startTime, endTime, lunchBreak) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  let hours = differenceInHours(end, start);
  
  if (lunchBreak) {
    hours -= lunchBreak / 60;
  }
  
  return Math.max(0, hours);
};

export const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export const getQuarter = (date) => {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
};

export const getAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const isBetweenDates = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
};

export const getTimeAgo = (date) => {
  const now = new Date();
  const diff = differenceInMinutes(now, date);
  
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
  return format(date, 'MMM dd, yyyy');
};