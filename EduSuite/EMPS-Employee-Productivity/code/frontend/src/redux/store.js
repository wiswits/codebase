import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import employeeSlice from './slices/employeeSlice';
import attendanceSlice from './slices/attendanceSlice';
import taskSlice from './slices/taskSlice';
import leaveSlice from './slices/leaveSlice';
import meetingSlice from './slices/meetingSlice';
import chatSlice from './slices/chatSlice';
import notificationSlice from './slices/notificationSlice';
import reportSlice from './slices/reportSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    employees: employeeSlice,
    attendance: attendanceSlice,
    tasks: taskSlice,
    leaves: leaveSlice,
    meetings: meetingSlice,
    chat: chatSlice,
    notifications: notificationSlice,
    reports: reportSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled', 'auth/logout'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;