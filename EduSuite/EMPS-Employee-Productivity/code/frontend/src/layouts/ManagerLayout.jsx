import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

const ManagerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } pt-16`}>
          <div className="p-6 min-h-[calc(100vh-8rem)]">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your team</p>
            </div>
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;