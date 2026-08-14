import React from 'react';
import { Outlet } from 'react-router-dom';
import GuruBottomNav from './components/GuruBottomNav';
import '../../styles/style-admin.css';

export const GuruLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <main className="mx-auto w-full max-w-7xl">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <GuruBottomNav />
    </div>
  );
};

export default GuruLayout;
