'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';    
import { Sidebar } from '@/components/layout/Sidebar'; 
import { Footer } from '@/components/layout/Footer';    
import { cn } from '@/utils/cn';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
          
          <div className="flex-1 flex flex-col lg:ml-64">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="flex-1 bg-gray-50 px-8 py-6">
              {children}
            </main>
            
            <Footer />
          </div>
        </div>
      </div>
  );
}