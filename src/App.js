import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getSession,
  clearSession,
  getUserTasks,
  addUserTask,
  updateUserTask,
  deleteUserTask,
  saveUserTasks,
  initDatabase,
} from "./services/db";
import AuthModal from "./components/AuthModal";
import AdminPanel from "./components/AdminPanel";

// Generate unique ID with fallback
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Expanded categories
const CATEGORIES = [
  "All",
  "Work",
  "Personal",
  "Projects",
  "Classes",
  "Hobby",
  "Shopping",
  "Health",
  "Fitness",
  "Finance",
  "General",
];

// Distinct color styling for each category badge
const CATEGORY_COLORS = {
  Work: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  Personal: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  Projects: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Classes: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Hobby: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
  Shopping: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  Health: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  Fitness: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  Finance: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  General: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

const PRIORITIES = [
  { level: "low", label: "Low", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { level: "medium", label: "Medium", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { level: "high", label: "High", color: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
];

const GUEST_DEFAULT_TASKS = [];

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // App tasks state
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("guestTasks");
      return saved ? JSON.parse(saved) : GUEST_DEFAULT_TASKS;
    } catch {
      return GUEST_DEFAULT_TASKS;
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode !== null) return savedMode === "true";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  // Task form state
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskCategory, setNewTaskCategory] = useState("Projects");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Filters & Sorting state
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ text: "", priority: "medium", category: "General", dueDate: "" });

  // Toast notifications
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Initialize IndexedDB & restore user session
  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        setDbReady(true);
        const sessionUser = await getSession();
        if (sessionUser) {
          setCurrentUser(sessionUser);
        }
      } catch (err) {
        console.error("IndexedDB initialization error:", err);
      }
    }
    init();
  }, []);

  // Load tasks for active user or Guest
  const loadUserTasks = useCallback(async (user) => {
    if (user && user.id) {
      try {
        const dbTasks = await getUserTasks(user.id);
        setTasks(dbTasks);
      } catch (err) {
        console.error("Error loading user tasks from DB:", err);
      }
    } else {
      // Guest mode fallback
      try {
        const saved = localStorage.getItem("guestTasks");
        if (saved) {
          setTasks(JSON.parse(saved));
        } else {
          setTasks(GUEST_DEFAULT_TASKS);
        }
      } catch {
        setTasks(GUEST_DEFAULT_TASKS);
      }
    }
  }, []);

  useEffect(() => {
    if (dbReady) {
      loadUserTasks(currentUser);
    }
  }, [currentUser, dbReady, loadUserTasks]);

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("darkMode", String(Boolean(darkMode)));
    } catch (e) {
      console.error("Failed to save darkMode:", e);
    }
  }, [darkMode]);

  // Save guest tasks to localStorage
  useEffect(() => {
    if (!currentUser) {
      try {
        localStorage.setItem("guestTasks", JSON.stringify(tasks));
      } catch (e) {
        console.error("Failed to save guest tasks:", e);
      }
    }
  }, [tasks, currentUser]);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await clearSession();
    setCurrentUser(null);
    showToast("Logged out successfully.", "info");
  };

  // Task CRUD Handlers
  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    if (trimmed.length > 200) {
      showToast("Task text cannot exceed 200 characters.", "error");
      return;
    }

    const newTask = {
      id: generateId(),
      text: trimmed,
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: newTaskDueDate,
      createdAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await addUserTask(currentUser.id, newTask);
      } catch (err) {
        console.error("Failed to add task to IndexedDB:", err);
      }
    }

    setTasks([newTask, ...tasks]);
    setNewTaskText("");
    setNewTaskDueDate("");
    showToast("Task added successfully!", "success");
  };

  const toggleComplete = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = !task.completed;

    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, completed: newStatus } : t));
    setTasks(updatedTasks);

    if (currentUser) {
      try {
        await updateUserTask(currentUser.id, id, { completed: newStatus });
      } catch (err) {
        console.error("Failed to update task completion in DB:", err);
      }
    }
    showToast(newStatus ? "Task marked as completed!" : "Task marked as active.", "info");
  };

  const deleteTask = async (id) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);

    if (currentUser) {
      try {
        await deleteUserTask(currentUser.id, id);
      } catch (err) {
        console.error("Failed to delete task from DB:", err);
      }
    }
    showToast("Task deleted.", "info");
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditForm({
      text: task.text,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate || "",
    });
  };

  const saveEdit = async (id) => {
    const trimmed = editForm.text.trim();
    if (!trimmed) {
      showToast("Task text cannot be empty.", "error");
      return;
    }
    if (trimmed.length > 200) {
      showToast("Task text cannot exceed 200 characters.", "error");
      return;
    }

    const updates = {
      text: trimmed,
      priority: editForm.priority,
      category: editForm.category,
      dueDate: editForm.dueDate,
    };

    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(updatedTasks);

    if (currentUser) {
      try {
        await updateUserTask(currentUser.id, id, updates);
      } catch (err) {
        console.error("Failed to update task edit in DB:", err);
      }
    }

    setEditingId(null);
    showToast("Task updated!", "success");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const clearCompleted = async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    const remainingTasks = tasks.filter((t) => !t.completed);
    setTasks(remainingTasks);

    if (currentUser) {
      try {
        await saveUserTasks(currentUser.id, remainingTasks);
      } catch (err) {
        console.error("Failed to clear completed tasks in DB:", err);
      }
    }
    showToast(`Cleared ${completedTasks.length} completed task(s).`, "info");
  };

  const toggleAllCompleted = async () => {
    const allCompleted = tasks.every((t) => t.completed);
    const updatedTasks = tasks.map((t) => ({ ...t, completed: !allCompleted }));
    setTasks(updatedTasks);

    if (currentUser) {
      try {
        await saveUserTasks(currentUser.id, updatedTasks);
      } catch (err) {
        console.error("Failed to toggle all completed tasks in DB:", err);
      }
    }
    showToast(
      allCompleted ? "Marked all tasks as active." : "Marked all tasks as completed!",
      "success"
    );
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `taskflow_${currentUser ? currentUser.loginId : "guest"}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Tasks exported to JSON file!", "success");
  };

  // Import JSON
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) {
          showToast("Invalid file format. Expected a JSON array of tasks.", "error");
          return;
        }
        const validated = imported.map((item) => ({
          id: item.id || generateId(),
          text: item.text || "Untitled Task",
          completed: Boolean(item.completed),
          priority: item.priority || "medium",
          category: item.category || "General",
          dueDate: item.dueDate || "",
          createdAt: item.createdAt || new Date().toISOString(),
        }));

        setTasks(validated);

        if (currentUser) {
          await saveUserTasks(currentUser.id, validated);
        }

        showToast(`Successfully imported ${validated.length} task(s)!`, "success");
      } catch (err) {
        showToast("Error parsing JSON file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Filter & Sort Logic
  const filteredTasks = tasks
    .filter((task) => {
      if (filterStatus === "active" && task.completed) return false;
      if (filterStatus === "completed" && !task.completed) return false;
      if (selectedCategory !== "All" && task.category !== selectedCategory) return false;
      if (selectedPriority !== "all" && task.priority !== selectedPriority) return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          task.text.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === "priority") {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      }
      return 0;
    });

  // Stats calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
        aria-label="Import tasks file input"
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 transition-all animate-fade-in ${
            toast.type === "error"
              ? "bg-rose-600 text-white shadow-rose-500/30"
              : toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/30"
              : "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-purple-500/30"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Auth & Admin Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onGuestContinue={() => {
          setCurrentUser(null);
          showToast("Continuing as Guest. Data is stored locally.", "info");
        }}
        showToast={showToast}
      />

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        currentUser={currentUser}
        showToast={showToast}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="glass-card border border-purple-200/60 dark:border-slate-800/80 shadow-xl shadow-purple-500/5 dark:shadow-purple-950/20 rounded-3xl p-6 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 text-white rounded-2xl shadow-lg shadow-purple-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500">
                    TaskFlow
                  </h1>
                  <p className="text-xs text-purple-900/60 dark:text-slate-400 font-medium mt-0.5">
                    Organize your workflow with priorities, categories & deadlines
                  </p>
                </div>
              </div>
            </div>

            {/* Header Right Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* User Identity / Auth Profile Button */}
              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-2xl bg-purple-500/10 dark:bg-slate-800/80 border border-purple-200/60 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                    <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xs">
                      {currentUser.loginId[0].toUpperCase()}
                    </span>
                    <span>{currentUser.loginId}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                        currentUser.role === "admin"
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                          : "bg-purple-500/20 text-purple-700 dark:text-cyan-300"
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>

                  {currentUser.role === "admin" && (
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      title="Open System Admin Panel"
                      className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-xl shadow-md hover:brightness-110 transition-all"
                    >
                      👑 Admin
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    title="Log out of account"
                    className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In / Register</span>
                </button>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={darkMode}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* JSON Backup Export */}
              <button
                onClick={handleExport}
                title="Backup tasks to JSON"
                aria-label="Export tasks as JSON file"
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>

              {/* JSON Restore Import */}
              <button
                onClick={handleImportClick}
                title="Restore tasks from JSON"
                aria-label="Import tasks from JSON file"
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Bar & Stats */}
          {totalCount > 0 && (
            <div className="mt-6 pt-5 border-t border-purple-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Progress Overview</span>
                <span className="text-purple-600 dark:text-cyan-400 font-bold">{percentCompleted}% Complete</span>
              </div>
              <div className="w-full bg-purple-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${percentCompleted}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-purple-500/10 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-purple-200/50 dark:border-slate-800">
                  <div className="text-xl font-black text-purple-900 dark:text-white">{totalCount}</div>
                  <div className="text-[11px] font-semibold text-purple-600 dark:text-slate-400">Total</div>
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30">
                  <div className="text-xl font-black text-amber-700 dark:text-amber-300">{activeCount}</div>
                  <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Active</div>
                </div>
                <div className="bg-emerald-500/10 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30">
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{completedCount}</div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Completed</div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Task Creation Form Card */}
        <section className="glass-card border border-purple-200/60 dark:border-slate-800/80 shadow-xl shadow-purple-500/5 dark:shadow-purple-950/20 rounded-3xl p-6">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <label htmlFor="new-task-input" className="sr-only">New task title</label>
                <input
                  id="new-task-input"
                  type="text"
                  placeholder="What needs to be done?..."
                  maxLength={200}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Task</span>
              </button>
            </div>

            {/* Form Meta Controls (Priority, Category, Due Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label htmlFor="new-task-priority" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  id="new-task-priority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-task-category" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  id="new-task-category"
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-task-duedate" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  id="new-task-duedate"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>
            </div>
          </form>
        </section>

        {/* Filter, Search & Action Tools */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 glass-card border border-purple-200/60 dark:border-slate-800/80 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Priority & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="priority-filter-select" className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Priority:
                </label>
                <select
                  id="priority-filter-select"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-2.5 py-2 glass-card border border-purple-200/60 dark:border-slate-800/80 rounded-2xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="sort-select" className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-2 glass-card border border-purple-200/60 dark:border-slate-800/80 rounded-2xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Highest Priority</option>
                  <option value="dueDate">Earliest Due Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status & Category Filters */}
          <div className="glass-card p-3.5 rounded-3xl border border-purple-200/60 dark:border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex bg-purple-100/70 dark:bg-slate-800/80 p-1 rounded-2xl">
                {["all", "active", "completed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    aria-pressed={filterStatus === st}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      filterStatus === st
                        ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Category Pills Header */}
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
                Categories
              </span>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {CATEGORIES.map((cat) => {
                const categoryStyle = CATEGORY_COLORS[cat] || "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-transparent shadow-md shadow-purple-500/20 scale-105"
                        : `${categoryStyle} hover:scale-105`
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Task List Section */}
        <main>
          {filteredTasks.length === 0 ? (
            <div className="glass-card border border-purple-200/60 dark:border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto text-purple-400 dark:text-slate-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No tasks found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {searchQuery || selectedCategory !== "All" || filterStatus !== "all" || selectedPriority !== "all"
                  ? "No tasks match your current search or filter parameters."
                  : "Your task list is empty. Add a new task above to get started!"}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTasks.map((task) => {
                const priorityBadge = PRIORITIES.find((p) => p.level === task.priority) || PRIORITIES[0];
                const categoryStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General;
                const isEditing = editingId === task.id;
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString()) && !task.completed;

                return (
                  <li
                    key={task.id}
                    className={`group glass-card border ${
                      task.completed
                        ? "border-slate-200/60 dark:border-slate-800/60 opacity-75"
                        : "border-purple-200/60 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-600 shadow-md shadow-purple-500/5"
                    } rounded-3xl p-4 transition-all duration-200 animate-slide-in`}
                  >
                    {isEditing ? (
                      /* Edit Mode Form */
                      <div className="space-y-3">
                        <input
                          type="text"
                          maxLength={200}
                          value={editForm.text}
                          onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(task.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full px-3 py-2 bg-white/90 dark:bg-slate-800/90 border border-purple-300 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                          autoFocus
                        />
                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
                          <select
                            value={editForm.priority}
                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                            className="px-2.5 py-1.5 text-xs bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>

                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="px-2.5 py-1.5 text-xs bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
                          >
                            {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="px-2.5 py-1.5 text-xs bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
                          />

                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={() => saveEdit(task.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode Card */
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleComplete(task.id)}
                            aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
                            aria-pressed={task.completed}
                            className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                              task.completed
                                ? "bg-gradient-to-tr from-purple-600 to-cyan-500 border-purple-600 text-white shadow-sm shadow-purple-500/40"
                                : "border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:border-purple-500"
                            }`}
                          >
                            {task.completed && (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <p
                              className={`text-sm font-semibold leading-relaxed break-words ${
                                task.completed
                                  ? "line-through text-slate-400 dark:text-slate-500"
                                  : "text-slate-900 dark:text-slate-100"
                              }`}
                            >
                              {task.text}
                            </p>

                            {/* Badges Bar */}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {/* Priority Chip */}
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${priorityBadge.color}`}>
                                {priorityBadge.label}
                              </span>

                              {/* Category Chip with distinct styling */}
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${categoryStyle}`}>
                                {task.category}
                              </span>

                              {/* Due Date Chip */}
                              {task.dueDate && (
                                <span
                                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg flex items-center gap-1 border ${
                                    isOverdue
                                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40"
                                      : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(task)}
                            aria-label={`Edit task "${task.text}"`}
                            className="p-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => deleteTask(task.id)}
                            aria-label={`Delete task "${task.text}"`}
                            className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        {/* Footer Batch Operations */}
        {totalCount > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 glass-card px-5 py-4 rounded-3xl border border-purple-200/60 dark:border-slate-800/80 text-xs">
            <button
              onClick={toggleAllCompleted}
              className="text-purple-600 dark:text-cyan-400 hover:underline font-bold"
            >
              {tasks.every((t) => t.completed) ? "Mark All Active" : "Mark All Completed"}
            </button>

            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold ml-auto"
              >
                Clear Completed ({completedCount})
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
