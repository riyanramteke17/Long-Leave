
import React from 'react';
import { User, LeaveRequest, LeaveStatus, UserRole } from '../types';
import LeaveTable from './LeaveTable';

interface CheckerPanelProps {
  user: User;
  viewRole: UserRole; // The specific portal role being rendered
  requests: LeaveRequest[];
  users?: User[];
  onApprove: (id: string) => void;
  // Fixed signature to include reason parameter
  onReject: (id: string, reason: string) => void;
  onViewDetails: (request: LeaveRequest) => void;
}

const CheckerPanel: React.FC<CheckerPanelProps> = ({ user, viewRole, requests, users = [], onApprove, onReject, onViewDetails }) => {
  
  // Filter based on the PORTAL ROLE being viewed, not just the user's role
  const getFilteredRequests = () => {
    switch (viewRole) {
      case UserRole.ADMIN:
        return requests.filter(r => r.status === LeaveStatus.PENDING_ADMIN);
      case UserRole.SUB_ADMIN:
        return requests.filter(r => r.status === LeaveStatus.PENDING_SUBADMIN);
      case UserRole.SUPER_ADMIN:
        return requests.filter(r => r.status === LeaveStatus.PENDING_SUPERADMIN);
      default:
        return [];
    }
  };

  const currentPending = getFilteredRequests();
  
  // Access specific checks
  const isElevatedRole = user.role === UserRole.SUB_ADMIN || user.role === UserRole.SUPER_ADMIN;
  const isCurrentlyViewingSubAdminOrHigher = viewRole === UserRole.SUB_ADMIN || viewRole === UserRole.SUPER_ADMIN;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Visual Indicator of Portal Level */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center border-l-8 border-l-indigo-500">
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Authorized Access Zone</p>
          <h2 className="text-3xl font-black text-slate-800 capitalize">{viewRole.replace('subAdmin', 'SubAdmin').replace('superAdmin', 'SuperAdmin')} Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">
            {viewRole === UserRole.ADMIN && "Direct Hostel Warden level approvals and security screenings."}
            {viewRole === UserRole.SUB_ADMIN && "Intermediate administrative review and student verification."}
            {viewRole === UserRole.SUPER_ADMIN && "Master authority level with final signature capabilities."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">In Queue</p>
          <p className="text-3xl font-black text-slate-800">{currentPending.length}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Cleared</p>
          <p className="text-3xl font-black text-emerald-800">{requests.filter(r => r.status === LeaveStatus.APPROVED).length}</p>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
          <p className="text-[10px] font-black text-rose-600 uppercase mb-1 tracking-widest">Revoked</p>
          <p className="text-3xl font-black text-rose-800">{requests.filter(r => r.status === LeaveStatus.REJECTED).length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl text-white">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Active Auth</p>
          <p className="text-lg font-bold truncate">{user.email.split('@')[0]}</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-3 animate-pulse"></span>
            Critical Pending Verification
          </h3>
        </div>
        <LeaveTable 
          requests={currentPending} 
          role={user.role} 
          onApprove={onApprove} 
          onReject={onReject}
          onViewDetails={onViewDetails}
        />
      </section>

      {/* Analytics (Strictly Hidden from Level 1 Admin) */}
      {isElevatedRole && isCurrentlyViewingSubAdminOrHigher && (
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-black text-slate-800">Student Utilization Metrics</h4>
              <p className="text-sm text-slate-500">Cross-referenced database of campus leave patterns.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {users.filter(u => u.role === UserRole.USER).map(u => (
               <div key={u.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col">
                 <div className="flex items-center space-x-4 mb-4">
                    <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-white p-1 border shadow-sm" alt="" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                    </div>
                 </div>
                 <div className="mt-auto pt-4 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Total Usage</span>
                    <span className="text-lg font-black text-slate-800">{u.totalLeaveDays || 0} <span className="text-xs font-normal text-slate-400 uppercase">Days</span></span>
                 </div>
               </div>
             ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CheckerPanel;
