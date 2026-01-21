
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface SharedLayoutProps {
  user: User;
  activeView: UserRole | 'ROLE_MGMT' | 'PROFILE';
  onViewChange: (view: UserRole | 'ROLE_MGMT' | 'PROFILE') => void;
  children: React.ReactNode;
  onLogout: () => void;
  isAuthorized: (role: UserRole, target: UserRole | 'ROLE_MGMT' | 'PROFILE') => boolean;
}

const SharedLayout: React.FC<SharedLayoutProps> = ({ user, activeView, onViewChange, children, onLogout, isAuthorized }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: UserRole.USER, label: 'Student Portal', icon: '👨‍🎓', roles: [UserRole.USER] },
    { id: UserRole.ADMIN, label: 'Admin Dashboard', icon: '🛡️', roles: [UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPER_ADMIN] },
    { id: UserRole.SUB_ADMIN, label: 'Sub-Admin Panel', icon: '⚡', roles: [UserRole.SUB_ADMIN, UserRole.SUPER_ADMIN] },
    { id: UserRole.SUPER_ADMIN, label: 'Super-Admin Suite', icon: '👑', roles: [UserRole.SUPER_ADMIN] },
    { id: 'ROLE_MGMT', label: 'Identity Control', icon: '🔑', roles: [UserRole.SUB_ADMIN, UserRole.SUPER_ADMIN] },
    { id: 'PROFILE', label: 'My Account', icon: '👤', roles: Object.values(UserRole) as any },
  ];

  // Logic: Show only authorized items + Hide Student Dashboard from Admins
  const visibleLinks = menuItems.filter(item => {
    if (item.id === 'PROFILE') return true;
    if (item.id === UserRole.USER && user.role !== UserRole.USER) return false;
    return isAuthorized(user.role, item.id as any);
  });

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      {/* GLOBAL HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[100] px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleSidebar} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none"><span className="text-orange-500">Nav</span><span className="text-black">gurukul</span></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Campus Management</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col text-right mr-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">{user.name}</span>
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{user.role}</span>
          </div>
          <button onClick={() => onViewChange('PROFILE')} className="relative group">
            <img src={user.avatar} className="w-12 h-12 rounded-2xl border-2 border-slate-100 shadow-sm group-hover:border-indigo-500 transition-all object-cover" alt="Avatar" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* HAMBURGER DRAWER */}
        <aside className={`
          fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-[90] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isOpen ? 'translate-x-0 shadow-2xl shadow-indigo-100/50' : '-translate-x-full'}
          pt-28 p-8
        `}>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 px-4">Navigation</p>
            {visibleLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id as any);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all border
                  ${activeView === item.id 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-100' 
                    : 'text-slate-600 border-transparent hover:bg-slate-50'}
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            
            <div className="pt-10">
               <button 
                onClick={onLogout}
                className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
               >
                 <span>🚪</span>
                 <span>Logout System</span>
               </button>
            </div>
          </div>
        </aside>

        {/* OVERLAY */}
        {isOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80]" />}

        {/* MAIN AREA */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SharedLayout;
