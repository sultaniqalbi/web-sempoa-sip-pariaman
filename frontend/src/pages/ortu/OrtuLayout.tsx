import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import OrtuSidebar from '../../components/OrtuSidebar';
import Header from '../../components/Header';

export const OrtuLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Sidebar Drawer on Mobile */}
      <div className={`fixed inset-y-0 left-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex shrink-0`}>
        <OrtuSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrtuLayout;
