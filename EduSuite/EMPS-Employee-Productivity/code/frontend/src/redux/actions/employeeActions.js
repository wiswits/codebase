import { 
  fetchEmployees, 
  fetchEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  suspendEmployee 
} from '../slices/employeeSlice';

export const employeeActions = {
  fetchAll: (params) => fetchEmployees(params),
  fetchById: (id) => fetchEmployeeById(id),
  create: (data) => createEmployee(data),
  update: (id, data) => updateEmployee({ id, data }),
  delete: (id) => deleteEmployee(id),
  suspend: (id) => suspendEmployee(id),
};