
import React, { useState, useEffect } from 'react';
import { User, UserRole, LeaveRequest, LeaveStatus } from './types';
import SharedLayout from './components/SharedLayout';
import StudentPanel from './components/StudentPanel';
import CheckerPanel from './components/CheckerPanel';
import LeaveDetailView from './components/LeaveDetailView';
import RoleManagement from './components/RoleManagement';
import { auth, db, googleProvider } from './services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  addDoc
} from "firebase/firestore";

const ACCESS_MATRIX: Record<UserRole, (UserRole | 'ROLE_MGMT' | 'PROFILE')[]> = {
  [UserRole.USER]: [UserRole.USER, 'PROFILE'],
  [UserRole.ADMIN]: [UserRole.ADMIN, 'PROFILE'],
  [UserRole.SUB_ADMIN]: [UserRole.SUB_ADMIN, UserRole.ADMIN, 'ROLE_MGMT', 'PROFILE'],
  [UserRole.SUPER_ADMIN]: [UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ADMIN, 'ROLE_MGMT', 'PROFILE'],
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isAuth, setIsAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<UserRole | 'ROLE_MGMT' | 'PROFILE' | null>(null);

  // Email Helper Function - Sends email via Firebase Extension
  const sendEmail = async (to: string[], subject: string, body: string) => {
    try {
      await addDoc(collection(db, 'mail'), {
        to,
        message: {
          subject,
          text: body,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                   <h2 style="color: #4F46E5;">${subject}</h2>
                   <p style="white-space: pre-line;">${body}</p>
                   <hr style="margin: 20px 0;">
                   <p style="color: #64748B; font-size: 12px;">This is an automated message from Navgurukul Leave Management System.</p>
                 </div>`
        }
      });
      console.log('Email queued successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  // 1. Firebase Listeners (Users & Leaves)
  useEffect(() => {
    // Firestore Collections
    const usersCollection = collection(db, 'users');
    const leavesCollection = collection(db, 'leaves');

    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
      const userList: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(userList);
    });

    const unsubscribeLeaves = onSnapshot(leavesCollection, (snapshot) => {
      const leaveList: LeaveRequest[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
      setLeaveRequests(leaveList.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()));
    });

    // 2. Auth State Observer - Robust Implementation with Fallback
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          let userSnap = await getDoc(userRef);

          // AUTO-CREATE IF AUTH EXISTS BUT DB RECORD IS MISSING
          if (!userSnap.exists()) {
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              role: UserRole.USER,
              authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'GOOGLE' : 'LOCAL',
              loginMethod: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
              totalLeaveDays: 0,
              // Initialize new fields
              isAdmin: false,
              isSubAdmin: false,
              isSuperAdmin: false,
              daysTookLeave: 0,
              pendingLeaves: 0
            };
            await setDoc(userRef, newUser);
            userSnap = await getDoc(userRef); // Refresh snapshot
          } else {
            // Update lastLoginAt for returning users
            await updateDoc(userRef, { lastLoginAt: new Date().toISOString() });
          }

          const userData = { id: userSnap.id, ...userSnap.data() } as User;
          // Safety: Ensure role exists
          if (userData && !userData.role) userData.role = UserRole.USER;

          // AUTO-FIX ROLE: Sync role field from boolean flags if they don't match
          // Priority: isSuperAdmin > isSubAdmin > isAdmin > user
          let correctRole = userData.role;
          if (userData.isSuperAdmin) {
            correctRole = UserRole.SUPER_ADMIN;
          } else if (userData.isSubAdmin) {
            correctRole = UserRole.SUB_ADMIN;
          } else if (userData.isAdmin) {
            correctRole = UserRole.ADMIN;
          } else {
            correctRole = UserRole.USER;
          }

          // If role field doesn't match the boolean flags, update it in Firestore
          if (correctRole !== userData.role) {
            await updateDoc(userRef, { role: correctRole });
            userData.role = correctRole; // Update local object too
          }

          if (userData) {
            setCurrentUser(userData);
            setIsAuth(true);
            setActiveView(userData.role as any);
          } else {
            // Fallback if snap val is null despite exists check
            throw new Error("User record invalid");
          }
        } else {
          setCurrentUser(null);
          setIsAuth(false);
          setActiveView(null);
        }
      } catch (err) {
        console.error("Critical Auth/DB Error - Using Fallback:", err);
        // FALLBACK: If DB fails (Permission Denied, network, etc.), allow login as USER
        if (firebaseUser) {
          const fallbackUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Fallback User',
            email: firebaseUser.email || '',
            role: UserRole.USER,
            authProvider: 'LOCAL',
            createdAt: new Date().toISOString(),
            avatar: firebaseUser.photoURL || '',
            totalLeaveDays: 0,
            // Initialize new fields
            isAdmin: false,
            isSubAdmin: false,
            isSuperAdmin: false,
            daysTookLeave: 0,
            pendingLeaves: 0
          };
          setCurrentUser(fallbackUser);
          setIsAuth(true);
          setActiveView(UserRole.USER);
        } else {
          setCurrentUser(null);
          setIsAuth(false);
          setActiveView(null);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLeaves();
      unsubscribeAuth();
    };
  }, []);

  // 2.5 LIVE SYNC: Keep 'currentUser' in sync with 'users' list data
  // This ensures if Admin changes role in DB, it verifies here immediately
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const liveData = users.find(u => u.id === currentUser.id);
      if (liveData) {
        // Deep compare/Check if meaningful change occurred to avoid render loops
        const hasChange = JSON.stringify(liveData) !== JSON.stringify(currentUser);
        if (hasChange) {
          setCurrentUser(liveData);
          // AUTOMATIC REDIRECT: If role specifically changed, switch their view immediately
          // This forces the user to be redirected to their new role's panel automatically
          if (liveData.role !== currentUser.role) {
            setActiveView(liveData.role as any);
          }
        }
      }
    }
  }, [users, currentUser?.id]);

  // 3. AUTO-SYNC USER STATS (Days Took Leave & Pending Leaves)
  useEffect(() => {
    if (!currentUser || !leaveRequests.length) return;

    // Filter leaves for this user
    const myLeaves = leaveRequests.filter(r => r.userId === currentUser.id);

    // Calculate Stats
    const approvedLeaves = myLeaves.filter(r => r.status === LeaveStatus.APPROVED);
    const calculatedDaysTookLeave = approvedLeaves.reduce((acc, curr) => acc + (curr.totalDays || 0), 0);

    // Count pending leaves (Any pending status)
    const pendingCount = myLeaves.filter(r => r.status.includes('PENDING')).length;

    // Check if DB update is needed to avoid infinite loops
    // We only update if the DB value is different from calculation
    if (
      currentUser.daysTookLeave !== calculatedDaysTookLeave ||
      currentUser.pendingLeaves !== pendingCount ||
      // Also sync role flags if they don't match the role string
      // (Just a safe-guard to ensure they stay consistent)
      currentUser.isAdmin !== (currentUser.role === UserRole.ADMIN) ||
      currentUser.isSubAdmin !== (currentUser.role === UserRole.SUB_ADMIN) ||
      currentUser.isSuperAdmin !== (currentUser.role === UserRole.SUPER_ADMIN)
    ) {
      const userRef = doc(db, 'users', currentUser.id);
      updateDoc(userRef, {
        daysTookLeave: calculatedDaysTookLeave,
        pendingLeaves: pendingCount,
        // Sync boolean flags based on current Role
        isAdmin: currentUser.role === UserRole.ADMIN,
        isSubAdmin: currentUser.role === UserRole.SUB_ADMIN,
        isSuperAdmin: currentUser.role === UserRole.SUPER_ADMIN
      }).catch(err => console.error("Failed to sync user stats:", err));
    }

  }, [currentUser, leaveRequests]);

  const isAuthorized = (role: UserRole, target: UserRole | 'ROLE_MGMT' | 'PROFILE'): boolean => {
    if (target === 'PROFILE') return true;
    if (target === 'ROLE_MGMT') return [UserRole.SUB_ADMIN, UserRole.SUPER_ADMIN].includes(role);
    const allowedTargets = ACCESS_MATRIX[role] || [];
    return allowedTargets.includes(target as UserRole);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = (formData.get('email') as string).toLowerCase().trim();
    const pass = formData.get('pass') as string;
    const name = formData.get('name') as string;

    try {
      if (authMode === 'LOGIN') {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        // NEW: Check & Create User Record Logic
        const userRef = doc(db, 'users', res.user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const newUser: User = {
            id: res.user.uid,
            name: res.user.displayName || name || 'New User',
            email: res.user.email || email,
            role: UserRole.USER,
            authProvider: 'LOCAL',
            loginMethod: 'email',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            totalLeaveDays: 0,
            isAdmin: false,
            isSubAdmin: false,
            isSuperAdmin: false,
            daysTookLeave: 0,
            pendingLeaves: 0
          };
          await setDoc(userRef, newUser);
        } else {
          await updateDoc(userRef, { lastLoginAt: new Date().toISOString() });
        }
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: User = {
          id: res.user.uid,
          name: name || 'New User',
          email,
          role: UserRole.USER,
          authProvider: 'LOCAL',
          loginMethod: 'email',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          totalLeaveDays: 0,
          isAdmin: false,
          isSubAdmin: false,
          isSuperAdmin: false,
          daysTookLeave: 0,
          pendingLeaves: 0
        };
        await setDoc(doc(db, 'users', res.user.uid), newUser);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);

      // Check and Create First-Time Record
      if (!snap.exists()) {
        const newUser: User = {
          id: result.user.uid,
          name: result.user.displayName || 'Google User',
          email: result.user.email || '',
          role: UserRole.USER,
          avatar: result.user.photoURL || '',
          authProvider: 'GOOGLE',
          loginMethod: 'google',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          totalLeaveDays: 0,
          isAdmin: false,
          isSubAdmin: false,
          isSuperAdmin: false,
          daysTookLeave: 0,
          pendingLeaves: 0
        };
        await setDoc(userRef, newUser);
      } else {
        await updateDoc(userRef, { lastLoginAt: new Date().toISOString() });
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!isAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl">
        <h1 className="text-3xl font-black text-center mb-12 tracking-tight"><span className="text-orange-500">Nav</span><span className="text-black">gurukul</span></h1>
        <p className="text-center text-slate-600 font-semibold mb-8 tracking-wide">Leave Management System</p>
        <button onClick={handleGoogleLogin} className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-slate-50 hover:border-indigo-400 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!currentUser || !activeView) return null;
    if (!isAuthorized(currentUser.role, activeView)) return <div className="p-10 text-center font-black text-rose-500">UNAUTHORIZED ACCESS</div>;

    if (activeView === 'PROFILE') {
      return (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center">
          <img src={currentUser.avatar} className="w-32 h-32 rounded-[2.5rem] border-4 border-indigo-50 shadow-xl mb-6 object-cover" alt="" />
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{currentUser.name}</h3>
          <p className="text-indigo-600 font-black uppercase tracking-widest text-[10px] bg-indigo-50 px-4 py-1.5 rounded-full mt-2">{currentUser.role}</p>
          <div className="w-full max-w-sm mt-10 space-y-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Email</p>
              <p className="font-bold text-slate-700">{currentUser.email}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global System ID</p>
              <p className="font-mono text-xs text-slate-400 select-all">{currentUser.id}</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'ROLE_MGMT') {
      return <RoleManagement users={users} currentUser={currentUser} onUpdateRole={async (userId, role) => {
        // Update both the role field AND the corresponding boolean flags
        const updates: any = {
          role: role,
          isAdmin: role === UserRole.ADMIN,
          isSubAdmin: role === UserRole.SUB_ADMIN,
          isSuperAdmin: role === UserRole.SUPER_ADMIN
        };
        await updateDoc(doc(db, 'users', userId), updates);
      }} />;
    }

    switch (activeView) {
      case UserRole.USER:
        return <StudentPanel user={currentUser} requests={leaveRequests.filter(r => r.userId === currentUser.id)} onApply={async (data) => {
          if (!currentUser) throw new Error("You must be logged in to submit a leave request.");

          try {
            const reqId = `LV-${Date.now().toString().slice(-6)}`;
            // Explicitly map fields to ensure nothing is missing
            const req: LeaveRequest = {
              ...data as any,
              id: reqId,
              userId: currentUser.id,
              studentName: currentUser.name,
              studentEmail: currentUser.email, // Explicitly save email
              status: LeaveStatus.PENDING_ADMIN,
              // history is already constructed in StudentPanel, but we can double check or just pass it through
              appliedDate: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(), // Adding top-level createdAt as requested
            } as any;

            await setDoc(doc(db, 'leaves', reqId), req);

            // EMAIL: Notify all admins about new leave application
            const adminEmails = users
              .filter(u => u.role === UserRole.ADMIN)
              .map(u => u.email);

            if (adminEmails.length > 0) {
              await sendEmail(
                adminEmails,
                `New Leave Request - ${currentUser.name}`,
                `${currentUser.name} has applied for leave.\n\nDuration: ${req.startDate} to ${req.endDate}\nReason: ${req.reason}\nTotal Days: ${req.totalDays} days\n\nPlease review and approve/reject in the Admin Dashboard.`
              );
            }
          } catch (error) {
            console.error("Firebase Write Error:", error);
            throw error; // Propagate to StudentPanel
          }
        }} onViewDetails={setSelectedRequest} />;

      case UserRole.ADMIN:
      case UserRole.SUB_ADMIN:
      case UserRole.SUPER_ADMIN:
        return <CheckerPanel user={currentUser} viewRole={activeView} requests={leaveRequests} users={users} onApprove={async (id) => {
          const req = leaveRequests.find(r => r.id === id);
          if (!req) return;
          let nextStatus = req.status;
          if (req.status === LeaveStatus.PENDING_ADMIN) nextStatus = LeaveStatus.PENDING_SUBADMIN;
          else if (req.status === LeaveStatus.PENDING_SUBADMIN) nextStatus = LeaveStatus.PENDING_SUPERADMIN;
          else if (req.status === LeaveStatus.PENDING_SUPERADMIN) nextStatus = LeaveStatus.APPROVED;

          await updateDoc(doc(db, 'leaves', id), {
            status: nextStatus,
            history: [...req.history, { action: 'Approved', user: currentUser.name, role: currentUser.role, date: new Date().toISOString() }]
          });

          // EMAIL: Notify next approver or all on final approval
          if (nextStatus === LeaveStatus.APPROVED) {
            // Final approval - notify everyone
            const allEmails = [req.studentEmail, ...users.filter(u => [UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPER_ADMIN].includes(u.role)).map(u => u.email)];
            await sendEmail(
              allEmails,
              `Leave Request Approved ✓ - ${req.studentName}`,
              `The leave request has been fully approved!\n\nStudent: ${req.studentName}\nDuration: ${req.startDate} to ${req.endDate}\nTotal Days: ${req.totalDays} days\n\nThe leave has been granted.`
            );
          } else {
            // Partial approval - notify next level
            let nextApproverEmails: string[] = [];
            if (nextStatus === LeaveStatus.PENDING_SUBADMIN) {
              nextApproverEmails = users.filter(u => u.role === UserRole.SUB_ADMIN).map(u => u.email);
            } else if (nextStatus === LeaveStatus.PENDING_SUPERADMIN) {
              nextApproverEmails = users.filter(u => u.role === UserRole.SUPER_ADMIN).map(u => u.email);
            }
            if (nextApproverEmails.length > 0) {
              await sendEmail(
                nextApproverEmails,
                `Leave Request Pending Your Approval - ${req.studentName}`,
                `A leave request has been approved by ${currentUser.role} and is now pending your review.\n\nStudent: ${req.studentName}\nDuration: ${req.startDate} to ${req.endDate}\nReason: ${req.reason}\nTotal Days: ${req.totalDays} days\n\nPlease review in your dashboard.`
              );
            }
          }
        }} onReject={async (id, reason) => {
          const req = leaveRequests.find(r => r.id === id);
          if (!req) return;
          await updateDoc(doc(db, 'leaves', id), {
            status: LeaveStatus.REJECTED,
            rejectionReason: reason,
            rejectedByRole: currentUser.role,
            rejectedByEmail: currentUser.email,
            rejectionDateTime: new Date().toISOString(),
            history: [...req.history, { action: 'Rejected', user: currentUser.name, role: currentUser.role, date: new Date().toISOString() }]
          });

          // EMAIL: Notify student and all admins about rejection
          const allEmails = [req.studentEmail, ...users.filter(u => [UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPER_ADMIN].includes(u.role)).map(u => u.email)];
          await sendEmail(
            allEmails,
            `Leave Request Rejected ✗ - ${req.studentName}`,
            `The leave request has been rejected by ${currentUser.role}.\n\nStudent: ${req.studentName}\nDuration: ${req.startDate} to ${req.endDate}\nRejection Reason: ${reason}\n\nThe student has been notified.`
          );
        }} onViewDetails={setSelectedRequest} />;
      default: return null;
    }
  };

  return (
    <SharedLayout
      user={currentUser!}
      activeView={activeView as any}
      onViewChange={setActiveView as any}
      onLogout={handleLogout}
      isAuthorized={isAuthorized as any}
    >
      {renderContent()}
      {selectedRequest && <LeaveDetailView request={selectedRequest} currentUser={currentUser!} onClose={() => setSelectedRequest(null)} onApprove={async (id) => {
        const req = leaveRequests.find(r => r.id === id);
        if (!req) return;
        let nextStatus = req.status;
        if (req.status === LeaveStatus.PENDING_ADMIN) nextStatus = LeaveStatus.PENDING_SUBADMIN;
        else if (req.status === LeaveStatus.PENDING_SUBADMIN) nextStatus = LeaveStatus.PENDING_SUPERADMIN;
        else if (req.status === LeaveStatus.PENDING_SUPERADMIN) nextStatus = LeaveStatus.APPROVED;
        await updateDoc(doc(db, 'leaves', id), { status: nextStatus, history: [...req.history, { action: 'Approved', user: currentUser!.name, role: currentUser!.role, date: new Date().toISOString() }] });
        setSelectedRequest(null);
      }} onReject={async (id, res) => {
        const req = leaveRequests.find(r => r.id === id);
        if (!req) return;
        await updateDoc(doc(db, 'leaves', id), { status: LeaveStatus.REJECTED, rejectionReason: res, rejectedByRole: currentUser!.role, rejectedByEmail: currentUser!.email, rejectionDateTime: new Date().toISOString(), history: [...req.history, { action: 'Rejected', user: currentUser!.name, role: currentUser!.role, date: new Date().toISOString() }] });
        setSelectedRequest(null);
      }} />}
    </SharedLayout>
  );
};

export default App;
