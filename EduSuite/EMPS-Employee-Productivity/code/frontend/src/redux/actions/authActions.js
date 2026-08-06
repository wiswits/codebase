import { loginUser, logoutUser, validateToken, forgotPassword, resetPassword } from '../slices/authSlice';

export const authActions = {
  login: (employeeId, password, rememberMe) => 
    loginUser({ employeeId, password, rememberMe }),
  logout: () => logoutUser(),
  validate: () => validateToken(),
  forgotPassword: (data) => forgotPassword(data),
  resetPassword: (data) => resetPassword(data),
};