
import React, { useState } from 'react';
import { LeaveRequest, LeaveStatus, User, UserRole } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface LeaveDetailViewProps {
  request: LeaveRequest;
  currentUser: User;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const LeaveDetailView: React.FC<LeaveDetailViewProps> = ({
  request,
  currentUser,
  onClose,
  onApprove,
  onReject
}) => {
  const [rejectionMode, setRejectionMode] = useState(false);
  const [rejectionText, setRejectionText] = useState('');

  // Authorized roles for action
  const canAct = (
    (currentUser.role === UserRole.ADMIN && request.status === LeaveStatus.PENDING_ADMIN) ||
    (currentUser.role === UserRole.SUB_ADMIN && request.status === LeaveStatus.PENDING_SUBADMIN) ||
    (currentUser.role === UserRole.SUPER_ADMIN && request.status === LeaveStatus.PENDING_SUPERADMIN)
  );

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionText.trim()) {
      alert("Rejection reason is mandatory.");
      return;
    }
    // Call parent rejection handler
    onReject(request.id, rejectionText);
    setRejectionMode(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-white/20">

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h4 className="text-xl font-bold text-slate-800">Leave Application Details</h4>
            <p className="text-sm text-slate-500">System Reference: <span className="font-mono font-bold text-indigo-600">{request.id}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* HIGH-VISIBILITY REJECTION WARNING BOX (FIXED) */}
          {request.status === LeaveStatus.REJECTED && (
            <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl flex items-start space-x-5 animate-in slide-in-from-top-4 shadow-sm">
              <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-rose-200">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <div className="flex-1">
                <h5 className="text-rose-900 font-extrabold text-xl mb-1">Application Denied</h5>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                  <p className="text-rose-700 text-xs font-bold uppercase tracking-wider">
                    Rejected By: <span className="text-rose-900">{request.rejectedByRole}</span>
                  </p>
                  <p className="text-rose-700 text-xs font-bold uppercase tracking-wider">
                    Officer: <span className="text-rose-900">{request.rejectedByEmail}</span>
                  </p>
                  <p className="text-rose-700 text-xs font-bold uppercase tracking-wider">
                    Date: <span className="text-rose-900">{request.rejectionDateTime ? new Date(request.rejectionDateTime).toLocaleString() : 'N/A'}</span>
                  </p>
                </div>

                <div className="bg-white border-l-4 border-rose-600 p-5 rounded-xl shadow-inner">
                  <p className="text-[10px] font-black text-rose-500 uppercase mb-2 tracking-widest">Official Reason</p>
                  <p className="text-rose-900 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {request.rejectionReason || "No formal reason was recorded in the database."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Profile & Dates */}
            <section className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant Information</h5>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center space-x-4">
                <div className="w-14 h-14 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center">
                  <span className="font-bold text-indigo-600 text-xl">{request.studentName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{request.studentName}</p>
                  <p className="text-xs text-slate-500">{request.studentEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white p-4 border border-slate-200 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Departure</p>
                  <p className="text-sm font-black text-slate-800">{request.startDate}</p>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Return</p>
                  <p className="text-sm font-black text-slate-800">{request.endDate}</p>
                </div>
              </div>
            </section>

            {/* Workflow History */}
            <section className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Logs</h5>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                {request.history.map((item, idx) => (
                  <div key={idx} className="relative flex items-center group">
                    <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-2xl bg-white border-2 shadow-sm z-10 ${item.action.includes('Rejected') ? 'border-rose-300' : 'border-slate-200'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${item.action.includes('Approved') || item.action.includes('Final') ? 'bg-emerald-500' : item.action === 'Applied' ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-bold text-slate-800">{item.action}</p>
                      <p className="text-[10px] text-slate-500">{item.user} • <span className="uppercase text-indigo-500 font-bold">{item.role}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Application Reason</h5>
            <div className="bg-indigo-50/30 border border-indigo-100 p-6 rounded-3xl shadow-inner">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                "{request.reason}"
              </p>
            </div>
          </section>

          {request.documentUrls && request.documentUrls.length > 0 && (
            <section className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attached Evidence ({request.documentUrls.length})</h5>
              <div className="space-y-3">
                {request.documentUrls.map((url, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 115.656 5.656l-1.102 1.101" /></svg>
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[200px] md:max-w-xs">{url}</p>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-[10px] font-black shadow-sm hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center space-x-1.5"
                    >
                      <span>Open Link</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions / Rejection Form */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end items-center space-x-3">
          {canAct && !rejectionMode ? (
            <>
              <button
                onClick={() => setRejectionMode(true)}
                className="px-6 py-3 border border-rose-200 text-rose-600 font-extrabold rounded-2xl hover:bg-rose-50 transition-all text-sm uppercase tracking-wider"
              >
                Deny Application
              </button>
              <button
                onClick={() => onApprove(request.id)}
                className="px-8 py-3 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-sm uppercase tracking-wider"
              >
                {request.status === LeaveStatus.PENDING_SUPERADMIN ? 'Final Grant Approval' : 'Authorize & Forward'}
              </button>
            </>
          ) : rejectionMode ? (
            <form onSubmit={handleRejectSubmit} className="w-full flex flex-col items-stretch space-y-4 animate-in slide-in-from-bottom-4">
              <div className="w-full text-left">
                <label className="block text-xs font-black text-rose-600 uppercase mb-3 tracking-widest">Detailed Rejection Statement (Mandatory)</label>
                <textarea
                  autoFocus
                  required
                  value={rejectionText}
                  onChange={(e) => setRejectionText(e.target.value)}
                  placeholder="Example: Student must complete pending exams before leave can be granted..."
                  className="w-full border-2 border-rose-100 rounded-2xl p-4 focus:border-rose-400 outline-none transition-all resize-none text-sm min-h-[100px] shadow-sm"
                />
                <p className="text-[10px] text-rose-400 mt-2 font-bold italic">* This reason will be visible to the student and all administrative staff.</p>
              </div>
              <div className="flex justify-end space-x-4 border-t border-rose-50 pt-4">
                <button
                  type="button"
                  onClick={() => setRejectionMode(false)}
                  className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 text-sm"
                >
                  Discard Rejection
                </button>
                <button
                  type="submit"
                  disabled={!rejectionText.trim()}
                  className={`px-8 py-3 font-black rounded-2xl transition-all text-sm uppercase tracking-wider ${rejectionText.trim() ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                >
                  Commit Rejection to Database
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={onClose}
              className="px-12 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all text-sm uppercase tracking-widest"
            >
              Close View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailView;
