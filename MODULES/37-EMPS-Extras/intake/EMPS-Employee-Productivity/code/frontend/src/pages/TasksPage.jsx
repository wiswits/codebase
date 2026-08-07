import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TaskList from '../components/tasks/TaskList';
import TaskDetails from '../components/tasks/TaskDetails';
import CreateTask from '../components/tasks/CreateTask';
import EditTask from '../components/tasks/EditTask';

const TasksPage = () => {
  const { user } = useAuth();
  const role = user?.role;

  // Only admin, hr, manager can manage tasks
  const canManageTasks = ['admin', 'hr', 'manager'].includes(role);
  // Only admin can delete tasks
  const canDeleteTasks = role === 'admin';

  return (
    <Routes>
      {/* All roles can view tasks, but employees only see their own */}
      <Route index element={<TaskList showMyTasks={role === 'employee'} />} />
      
      {/* Managers/Admins can see all tasks */}
      {canManageTasks && (
        <Route path="all" element={<TaskList showMyTasks={false} />} />
      )}
      
      <Route path="my-tasks" element={<TaskList showMyTasks={true} />} />
      
      {/* Only managers/admins can create tasks */}
      {canManageTasks && (
        <Route path="create" element={<CreateTask />} />
      )}
      
      <Route path=":id" element={<TaskDetails canDelete={canDeleteTasks} />} />
      
      {/* Only managers/admins can edit tasks */}
      {canManageTasks && (
        <Route path=":id/edit" element={<EditTask />} />
      )}
    </Routes>
  );
};

export default TasksPage;