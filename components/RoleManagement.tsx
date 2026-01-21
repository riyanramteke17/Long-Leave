
import React from 'react';
import { User, UserRole } from '../types';

interface RoleManagementProps {
  users: User[];
  currentUser: User;
  onUpdateRole: (userId: string, newRole: UserRole) => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ users, currentUser, onUpdateRole }) => {
  
  // Logic to determine which roles the current user can assign
  const getAllowedRolesToAssign = () => {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return Object.values(UserRole); // SuperAdmin can assign everything
    }
    if (currentUser.role === UserRole.SUB_ADMIN) {
      return [UserRole.USER, UserRole.ADMIN]; // SubAdmin can only assign User/Admin
    }
    return [];
  };

  const allowedRoles = getAllowedRolesToAssign();

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h3 className="text-2xl font-black text-slate-800">Security & Permissions</h3>
        <p className="text-slate-500 text-sm mt-1">Manage global user credentials and access hierarchies.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 font-black uppercase text-[10px] text-slate-400 tracking-[0.2em]">User Profile</th>
              <th className="pb-4 font-black uppercase text-[10px] text-slate-400 tracking-[0.2em]">Active Security Level</th>
              <th className="pb-4 font-black uppercase text-[10px] text-slate-400 tracking-[0.2em] text-right">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => {
              const isSelf = u.id === currentUser.id;
              // SubAdmin cannot manage other SubAdmins or SuperAdmins
              const isManageable = currentUser.role === UserRole.SUPER_ADMIN || 
                                 (currentUser.role === UserRole.SUB_ADMIN && [UserRole.USER, UserRole.ADMIN].includes(u.role));

              return (
                <tr key={u.id} className="group">
                  <td className="py-6">
                    <div className="flex items-center space-x-4">
                      <img src={u.avatar} className="w-10 h-10 rounded-xl bg-slate-100 p-0.5 border" alt="" />
                      <div>
                        <p className="font-bold text-slate-800">{u.name} {isSelf && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md ml-2">YOU</span>}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      u.role === UserRole.SUPER_ADMIN ? 'bg-indigo-600 text-white' : 
                      u.role === UserRole.SUB_ADMIN ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    {isManageable && !isSelf ? (
                      <select 
                        value={u.role}
                        onChange={(e) => onUpdateRole(u.id, e.target.value as UserRole)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 outline-none transition-all cursor-pointer"
                      >
                        {allowedRoles.map(role => (
                          <option key={role} value={role}>{role.toUpperCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase italic">Locked Security</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;
