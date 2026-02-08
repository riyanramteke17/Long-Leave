
import React from 'react';
import { LeaveRequest, LeaveStatus, UserRole } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface LeaveTableProps {
  requests: LeaveRequest[];
  role: UserRole;
  onApprove?: (id: string) => void;
  // Fixed signature to include reason parameter as required by the rejection workflow
  onReject?: (id: string, reason: string) => void;
  onViewDetails: (request: LeaveRequest) => void;
}

const LeaveTable: React.FC<LeaveTableProps> = ({ requests, role, onApprove, onReject, onViewDetails }) => {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">No leave records found matching your current view.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Student / ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Reason</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Duration</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="font-semibold text-slate-800">{req.studentName}</div>
                    {req.documentUrls && req.documentUrls.length > 0 && (
                      <div className="text-indigo-500" title={`Has ${req.documentUrls.length} Attachment(s)`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{req.id} • {req.appliedDate}</div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-600 line-clamp-1 max-w-xs">{req.reason}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-700">{req.startDate} to {req.endDate}</div>
                  <div className="text-xs text-slate-500">{req.totalDays} days</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(req)}
                      className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      View Full Details
                    </button>

                    {/* Fixed UserRole.STUDENT to UserRole.USER */}
                    {role !== UserRole.USER && req.status !== LeaveStatus.APPROVED && req.status !== LeaveStatus.REJECTED && (
                      <>
                        <button
                          onClick={() => onApprove?.(req.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Quick Approve"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveTable;
