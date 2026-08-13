import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import GuruSidebar from '../../components/GuruSidebar';
import Header from '../../components/Header';
import '../../styles/style-admin.css';

export const GuruLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="admin-portal-wrapper flex h-screen bg-[#f8fafc] overflow-hidden relative">
      {/* Sidebar Drawer on Mobile / Collapsible on Desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex shrink-0`}
      >
        <GuruSidebar
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Backdrop overlay for mobile screens */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] dashboard-content">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default GuruLayout;
