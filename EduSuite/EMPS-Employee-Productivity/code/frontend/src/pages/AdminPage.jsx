import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import AddEmployee from '../components/admin/AddEmployee';
import EditEmployee from '../components/admin/EditEmployee';
import DepartmentManagement from '../components/admin/DepartmentManagement';
import CreateDepartment from '../components/admin/CreateDepartment';
import RoleManagement from '../components/admin/RoleManagement';
import SystemSettings from '../components/admin/SystemSettings';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import EmployeeList from '../components/admin/EmployeeList';
import OfficeLocationSettings from '../components/admin/OfficeLocationSettings'; // ← ADD THIS

const AdminPage = () => {
  return (
    <Routes>
      <Route index element={<AnalyticsDashboard />} />
      <Route path="employees" element={<EmployeeManagement />} />
      <Route path="employees/add" element={<AddEmployee />} />
      <Route path="employees/edit/:id" element={<EditEmployee />} />
      <Route path="employees/list" element={<EmployeeList />} />
      <Route path="departments" element={<DepartmentManagement />} />
      <Route path="departments/create" element={<CreateDepartment />} />
      <Route path="roles" element={<RoleManagement />} />
      <Route path="settings" element={<SystemSettings />} />
      <Route path="analytics" element={<AnalyticsDashboard />} />
      <Route path="office-location" element={<OfficeLocationSettings />} /> {/* ← ADD THIS */}
    </Routes>
  );
};

export default AdminPage;