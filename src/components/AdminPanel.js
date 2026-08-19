import React, { useState, useEffect, useCallback } from "react";
import {
  getAllUsersWithStats,
  getSystemAnalytics,
  updateUserRole,
  deleteUserAndData,
  saveUserTasks,
  hashPassword,
} from "../services/db";

export default function AdminPanel({ isOpen, onClose, currentUser, showToast }) {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [processingUserId, setProcessingUserId] = useState(null);

  // Admin Password Protection states
  const [isVerified, setIsVerified] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        getAllUsersWithStats(),
        getSystemAnalytics(),
      ]);
      setUsers(usersData);
      setAnalytics(statsData);
    } catch (err) {
      showToast("Error loading admin dashboard: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Reset password verification when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsVerified(false);
      setAdminPasswordInput("");
      setVerifyError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isVerified) {
      loadAdminData();
    }
  }, [isOpen, isVerified, loadAdminData]);

  if (!isOpen) return null;

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <div className="glass-card border border-rose-500/40 rounded-3xl p-8 max-w-sm text-center space-y-4 bg-white/90 dark:bg-slate-900/90">
          <div className="w-12 h-12 mx-auto bg-rose-500/20 text-rose-600 rounded-2xl flex items-center justify-center text-xl">
            🔒
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You must be logged in as an Administrator to view the Admin Dashboard.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Password Verification Handler
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifyError("");

    if (!adminPasswordInput) {
      setVerifyError("Please enter your Admin password.");
      return;
    }

    try {
      setVerifying(true);
      const hashedInput = await hashPassword(adminPasswordInput);
      if (hashedInput === currentUser.passwordHash) {
        setIsVerified(true);
        setAdminPasswordInput("");
        showToast("Admin Dashboard unlocked!", "success");
      } else {
        setVerifyError("Incorrect Admin Password. Access denied.");
      }
    } catch (err) {
      setVerifyError("Verification failed: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Render Password Security Prompt if not verified
  if (!isVerified) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-lock-title"
      >
        <div className="relative w-full max-w-md glass-card border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl bg-white/95 dark:bg-slate-900/95">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
          >
            ✕
          </button>

          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-amber-500 to-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 text-2xl">
              🔒
            </div>
            <h2 id="admin-lock-title" className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Admin Password Protected
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enter your admin password to unlock the Superuser Dashboard
            </p>
          </div>

          {verifyError && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{verifyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="admin-pass-verify" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Admin Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="admin-pass-verify"
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                placeholder="Enter password (e.g. admin123)..."
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={verifying}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Unlock Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Handle Role Toggle
  const handleToggleRole = async (user) => {
    if (user.id === currentUser.id) {
      showToast("You cannot change your own admin role.", "error");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      setProcessingUserId(user.id);
      await updateUserRole(user.id, newRole);
      showToast(
        `User ${user.loginId} is now ${newRole === "admin" ? "an Admin" : "a standard User"}.`,
        "success"
      );
      loadAdminData();
    } catch (err) {
      showToast("Failed to update role: " + err.message, "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle Clear Tasks for User
  const handleClearUserTasks = async (user) => {
    if (user.taskCount === 0) {
      showToast(`User ${user.loginId} has no tasks to clear.`, "info");
      return;
    }

    if (!window.confirm(`Clear all ${user.taskCount} task(s) for user "${user.loginId}"?`)) {
      return;
    }

    try {
      setProcessingUserId(user.id);
      await saveUserTasks(user.id, []);
      showToast(`Cleared all tasks for user "${user.loginId}".`, "success");
      loadAdminData();
    } catch (err) {
      showToast("Failed to clear tasks: " + err.message, "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (user) => {
    if (user.id === currentUser.id) {
      showToast("You cannot delete your own logged-in admin account.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${user.loginId}" and all their data?`)) {
      return;
    }

    try {
      setProcessingUserId(user.id);
      await deleteUserAndData(user.id);
      showToast(`User "${user.loginId}" and their tasks have been permanently deleted.`, "info");
      loadAdminData();
    } catch (err) {
      showToast("Failed to delete user: " + err.message, "error");
    } finally {
      setProcessingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchUserQuery.toLowerCase();
    return u.loginId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dashboard-title"
    >
      <div className="relative w-full max-w-5xl glass-card border border-purple-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl bg-white/95 dark:bg-slate-900/95 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Admin Dashboard"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-rose-500 text-white rounded-2xl shadow-lg shadow-amber-500/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="admin-dashboard-title" className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Admin Dashboard
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Superuser Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage system users, roles, data cleanup, and global system statistics
            </p>
          </div>
        </div>

        {/* System Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-purple-500/10 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-900/30">
              <div className="text-2xl font-black text-purple-900 dark:text-purple-300">{analytics.totalUsers}</div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">Total System Users</div>
              <div className="text-[10px] text-purple-400 mt-1">({analytics.adminCount} Admins)</div>
            </div>

            <div className="bg-cyan-500/10 dark:bg-cyan-950/30 p-4 rounded-2xl border border-cyan-200/50 dark:border-cyan-900/30">
              <div className="text-2xl font-black text-cyan-900 dark:text-cyan-300">{analytics.totalTasks}</div>
              <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Total System Tasks</div>
              <div className="text-[10px] text-cyan-400 mt-1">Across all users</div>
            </div>

            <div className="bg-emerald-500/10 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30">
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-300">{analytics.completedTasks}</div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed Tasks</div>
              <div className="text-[10px] text-emerald-400 mt-1">{analytics.completionRate}% system rate</div>
            </div>

            <div className="bg-amber-500/10 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-900/30">
              <div className="text-2xl font-black text-amber-900 dark:text-amber-300">{analytics.activeTasks}</div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Tasks</div>
              <div className="text-[10px] text-amber-400 mt-1">Active workflows</div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              User Accounts & Data Control
            </h3>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by Login ID / Email..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User Table */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold">Loading admin dashboard data...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold">No users found matching query.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-purple-500/10 dark:bg-slate-800 text-purple-900 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="px-4 py-3">Login ID</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Role</th>
                    <th className="px-4 py-3 text-center">Joined Date</th>
                    <th className="px-4 py-3 text-center">Tasks</th>
                    <th className="px-4 py-3 text-center">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    const isAdmin = user.role === "admin";

                    return (
                      <tr key={user.id} className="hover:bg-purple-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white align-middle whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span>{user.loginId}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 align-middle whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              isAdmin
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
                            }`}
                          >
                            {isAdmin ? "👑 Admin" : "👤 User"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 align-middle whitespace-nowrap">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-purple-600 dark:text-cyan-400 align-middle whitespace-nowrap">
                          {user.taskCount} ({user.completedTaskCount} done)
                        </td>
                        <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleRole(user)}
                              disabled={isSelf || processingUserId === user.id}
                              title={isAdmin ? "Demote to standard User" : "Promote to Admin"}
                              className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-cyan-300 font-bold hover:bg-purple-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all text-xs"
                            >
                              {isAdmin ? "Demote" : "Make Admin"}
                            </button>

                            <button
                              onClick={() => handleClearUserTasks(user)}
                              disabled={user.taskCount === 0 || processingUserId === user.id}
                              title="Clear all tasks for this user"
                              className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-40 transition-all text-xs"
                            >
                              Clear Tasks
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={isSelf || processingUserId === user.id}
                              title="Delete user account and all data"
                              className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-500/25 border border-rose-500/30 disabled:opacity-40 transition-all text-xs"
                            >
                              {processingUserId === user.id ? "Processing..." : "Delete User"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
