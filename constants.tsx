
import { UserRole, LeaveStatus, LeaveRequest, User } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'User One', email: 'riyan1@gmail.com', role: UserRole.USER, avatar: 'https://picsum.photos/seed/u1/100', authProvider: 'LOCAL', createdAt: '2024-01-01T00:00:00.000Z', totalLeaveDays: 7 },
  { id: '2', name: 'Admin Riyan', email: 'riyan2@gmail.com', role: UserRole.ADMIN, avatar: 'https://picsum.photos/seed/u2/100', authProvider: 'LOCAL', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '3', name: 'SubAdmin Riyan', email: 'riyan3@gmail.com', role: UserRole.SUB_ADMIN, avatar: 'https://picsum.photos/seed/u3/100', authProvider: 'LOCAL', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: '4', name: 'SuperAdmin Riyan', email: 'riyan4@gmail.com', role: UserRole.SUPER_ADMIN, avatar: 'https://picsum.photos/seed/u4/100', authProvider: 'LOCAL', createdAt: '2024-01-01T00:00:00.000Z' },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'LV-001',
    userId: '1',
    studentName: 'User One',
    studentEmail: 'riyan1@gmail.com',
    reason: 'Family Event',
    startDate: '2024-05-15',
    endDate: '2024-05-20',
    expectedReturnDate: '2024-05-21',
    totalDays: 5,
    appliedDate: '2024-05-10',
    status: LeaveStatus.PENDING_ADMIN,
    documentUrl: 'https://picsum.photos/seed/doc1/400/600',
    history: [
      { action: 'Applied', user: 'User One', role: UserRole.USER, date: '2024-05-10' }
    ]
  }
];

export const STATUS_COLORS = {
  [LeaveStatus.PENDING_ADMIN]: 'bg-amber-100 text-amber-700 border-amber-200',
  [LeaveStatus.PENDING_SUBADMIN]: 'bg-blue-100 text-blue-700 border-blue-200',
  [LeaveStatus.PENDING_SUPERADMIN]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [LeaveStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [LeaveStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const STATUS_LABELS = {
  [LeaveStatus.PENDING_ADMIN]: 'Pending Admin Approval',
  [LeaveStatus.PENDING_SUBADMIN]: 'Pending SubAdmin Review',
  [LeaveStatus.PENDING_SUPERADMIN]: 'Awaiting Final Signature',
  [LeaveStatus.APPROVED]: 'Fully Approved',
  [LeaveStatus.REJECTED]: 'Rejected',
};
