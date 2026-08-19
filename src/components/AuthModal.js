import React, { useState } from "react";
import { registerUser, loginUser } from "../services/db";

export default function AuthModal({ isOpen, onClose, onLoginSuccess, onGuestContinue, showToast }) {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup extra states
  const [signupLoginId, setSignupLoginId] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const resetForms = () => {
    setErrorMsg("");
    setLoginIdOrEmail("");
    setPassword("");
    setSignupLoginId("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
  };

  const handleSwitchTab = (toSignUp) => {
    setIsSignUp(toSignUp);
    resetForms();
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginIdOrEmail.trim() || !password) {
      setErrorMsg("Please enter your Login ID / Email and Password.");
      return;
    }

    try {
      setLoading(true);
      const user = await loginUser({
        loginIdOrEmail: loginIdOrEmail.trim(),
        password,
      });
      showToast(`Welcome back, ${user.loginId}!`, "success");
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanLoginId = signupLoginId.trim();
    const cleanEmail = signupEmail.trim();

    if (!cleanLoginId || !cleanEmail || !signupPassword) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    if (cleanLoginId.length < 3) {
      setErrorMsg("Login ID must be at least 3 characters long.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanLoginId)) {
      setErrorMsg("Login ID can only contain letters, numbers, underscores, and hyphens.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const newUser = await registerUser({
        loginId: cleanLoginId,
        email: cleanEmail,
        password: signupPassword,
      });
      showToast(`Account created successfully! Welcome, ${newUser.loginId}.`, "success");
      onLoginSuccess(newUser);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Demo Admin Login
  const handleDemoAdmin = async () => {
    try {
      setLoading(true);
      const user = await loginUser({
        loginIdOrEmail: "admin",
        password: "admin123",
      });
      showToast("Logged in as Demo Admin!", "success");
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg("Demo Admin login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md glass-card border border-purple-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 bg-white/90 dark:bg-slate-900/90">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
        >
          ✕
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 mx-auto bg-gradient-to-tr from-purple-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isSignUp
              ? "Register a unique Login ID to save your personal tasks"
              : "Sign in to access your saved TaskFlow workspace"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-purple-100/70 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => handleSwitchTab(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isSignUp
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isSignUp
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        {!isSignUp ? (
          /* SIGN IN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-id-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Login ID or Email Address
              </label>
              <input
                id="login-id-input"
                type="text"
                required
                placeholder="Enter login ID or email..."
                value={loginIdOrEmail}
                onChange={(e) => setLoginIdOrEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-purple-600 dark:text-cyan-400 font-semibold hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="login-password-input"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label htmlFor="signup-loginid" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Login ID (Username) <span className="text-rose-500">*</span>
              </label>
              <input
                id="signup-loginid"
                type="text"
                required
                placeholder="e.g. john_doe"
                value={signupLoginId}
                onChange={(e) => setSignupLoginId(e.target.value)}
                className="w-full px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">Unique identifier for logging in.</p>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                required
                placeholder="john@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="signup-confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Quick Demo & Guest Shortcuts */}
        <div className="mt-6 pt-4 border-t border-purple-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDemoAdmin}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all text-center"
            >
              👑 Demo Admin Login
            </button>

            <button
              type="button"
              onClick={() => {
                onGuestContinue();
                onClose();
              }}
              className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all text-center"
            >
              👤 Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
