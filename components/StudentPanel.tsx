import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, LeaveStatus, UserRole } from '../types';
import LeaveTable from './LeaveTable';

interface StudentPanelProps {
  user: User;
  requests: LeaveRequest[];
  onApply: (data: Partial<LeaveRequest>) => Promise<void>;
  onViewDetails: (request: LeaveRequest) => void;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ user, requests, onApply, onViewDetails }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
    totalDays: 0,
    expectedReturnDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate days
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const returnDate = new Date(end);
      returnDate.setDate(returnDate.getDate() + 1);

      setFormData(prev => ({
        ...prev,
        totalDays: diffDays > 0 ? diffDays : 0,
        expectedReturnDate: returnDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onApply({
        ...formData,
        studentName: user.name,
        studentEmail: user.email,
        userId: user.id,
        appliedDate: new Date().toISOString().split('T')[0],
        status: LeaveStatus.PENDING_ADMIN, // Default initial status
        history: [{ action: 'Applied', user: user.name, role: UserRole.USER, date: new Date().toISOString() }],
        documentUrl: 'https://picsum.photos/seed/leave-doc/800/1200'
      });

      // Reset and close
      setShowForm(false);
      setFormData({ reason: '', startDate: '', endDate: '', totalDays: 0, expectedReturnDate: '' });

    } catch (error: any) {
      console.error("Leave application failed:", error);
      const errMsg = (error.message || '').toLowerCase();
      // Error handling for permissions is done in App.tsx or here
      if (errMsg.includes('permission') || errMsg.includes('denied')) {
        alert("⚠️ CRITICAL ERROR: Database Permission Denied.\n\nThe app cannot write to Firebase because the Security Rules block it.\n\nACTION REQUIRED: Please go to Firebase Console > Realtime Database > Rules and paste the content of 'database.rules.json' from your project folder.");
      } else {
        alert("Failed to apply for leave: " + (error.message || 'Unknown error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter requests to display ONLY current user's leaves
  // (Redundant if parent filters, but adds safety)
  const myLeaves = requests.filter(req => req.userId === user.id);

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Leaves</p>
          <p className="text-3xl font-bold text-slate-800">{myLeaves.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Approved</p>
          <p className="text-3xl font-bold text-slate-800">{myLeaves.filter(r => r.status === LeaveStatus.APPROVED).length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-amber-400 uppercase mb-1">Pending</p>
          {/* Displaying all pending types */}
          <p className="text-3xl font-bold text-slate-800">{myLeaves.filter(r => r.status.includes('PENDING')).length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase mb-1">Rejected</p>
          <p className="text-3xl font-bold text-slate-800">{myLeaves.filter(r => r.status === LeaveStatus.REJECTED).length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">My Leave Applications</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-indigo-100 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Pass processed 'myLeaves' to ensure table only sees user's data */}
      <LeaveTable requests={myLeaves} role={UserRole.USER} onViewDetails={onViewDetails} />

      {/* Modal for Application Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h4 className="text-lg font-bold text-slate-800">New Leave Request</h4>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Student Name</label>
                  <input type="text" value={user.name} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input type="email" value={user.email} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Leave Reason</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="Describe your reason for leave clearly..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                  <input
                    required
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Total Days</label>
                  <input
                    type="text"
                    value={formData.totalDays}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Return Date Information</p>
                  <p className="text-sm text-slate-700">You must return by: <span className="font-bold">{formData.expectedReturnDate || 'N/A'}</span></p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-slate-500 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-10 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSubmitting ? 'Applying...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPanel;
