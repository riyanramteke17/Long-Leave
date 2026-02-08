
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin', // Formerly Warden
  SUB_ADMIN = 'subAdmin', // Formerly Checker
  SUPER_ADMIN = 'superAdmin' // Formerly Admin (Full Access)
}

export enum LeaveStatus {
  PENDING_ADMIN = 'PENDING_ADMIN', // Target: Admin
  PENDING_SUBADMIN = 'PENDING_SUBADMIN', // Target: SubAdmin
  PENDING_SUPERADMIN = 'PENDING_SUPERADMIN', // Target: SuperAdmin
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface LeaveHistory {
  action: string;
  user: string;
  role: UserRole;
  date: string;
  comment?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  reason: string;
  startDate: string;
  endDate: string;
  expectedReturnDate: string;
  totalDays: number;
  appliedDate: string;
  createdAt: string;
  status: LeaveStatus;
  documentUrls?: string[];
  history: LeaveHistory[];

  // FIXED: Standard Rejection Metadata fields for DB
  rejectionReason?: string;
  rejectedByRole?: UserRole;
  rejectedByEmail?: string;
  rejectionDateTime?: string; // This serves as 'rejectedAt'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  totalLeaveDays?: number;
  authProvider: 'LOCAL' | 'GOOGLE';
  createdAt: string;
  loginMethod?: 'email' | 'google';
  lastLoginAt?: string;
  // New Tracking Fields
  isAdmin?: boolean;
  isSubAdmin?: boolean;
  isSuperAdmin?: boolean;
  daysTookLeave?: number;
  pendingLeaves?: number;
}
