// This file centralizes all async action creators for easier imports

export * from '../slices/authSlice';
export * from '../slices/employeeSlice';
export * from '../slices/attendanceSlice';
export * from '../slices/taskSlice';
export * from '../slices/leaveSlice';
export * from '../slices/meetingSlice';
export * from '../slices/chatSlice';
export * from '../slices/notificationSlice';
export * from '../slices/reportSlice';

// Re-export with custom names if needed
import { loginUser as login, logoutUser as logout, validateToken as validate } from '../slices/authSlice';
import { fetchEmployees as fetchAllEmployees, createEmployee as createNewEmployee } from '../slices/employeeSlice';

export const asyncActions = {
  auth: {
    login,
    logout,
    validate,
  },
  employees: {
    fetchAll: fetchAllEmployees,
    create: createNewEmployee,
  },
};