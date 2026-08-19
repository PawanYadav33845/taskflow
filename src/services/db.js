// TaskFlow IndexedDB Local Database Engine & Web Crypto Auth Service

const DB_NAME = "TaskFlowDB";
const DB_VERSION = 1;

// Helper: Hashing passwords with Web Crypto API SHA-256
export async function hashPassword(password) {
  if (!password) return "";
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback simple hash string for legacy environments
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return "legacy_" + Math.abs(hash).toString(16);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_taskflow_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper: Open IndexedDB Database
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Users store
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "id" });
        userStore.createIndex("loginId", "loginId", { unique: true });
        userStore.createIndex("email", "email", { unique: true });
      }

      // Tasks store
      if (!db.objectStoreNames.contains("tasks")) {
        const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
        taskStore.createIndex("userId", "userId", { unique: false });
      }

      // Session store
      if (!db.objectStoreNames.contains("session")) {
        db.createObjectStore("session", { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Initialize Database & Seed Default Admin Account
export async function initDatabase() {
  const db = await openDB();
  if (!db) return false;
  
  // Seed admin user if no users exist
  const tx = db.transaction(["users"], "readwrite");
  const userStore = tx.objectStore("users");
  const countReq = userStore.count();

  return new Promise((resolve) => {
    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        const adminHash = await hashPassword("admin123");
        const adminUser = {
          id: "admin_user_001",
          loginId: "admin",
          email: "admin@taskflow.com",
          passwordHash: adminHash,
          role: "admin",
          createdAt: new Date().toISOString(),
        };
        const seedTx = db.transaction(["users"], "readwrite");
        seedTx.objectStore("users").add(adminUser);
      }
      resolve(true);
    };
  });
}

// --- AUTH SERVICES ---

export async function registerUser({ loginId, email, password }) {
  await initDatabase();
  const db = await openDB();

  const cleanLoginId = loginId.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // Check existing users
  const tx = db.transaction(["users"], "readonly");
  const store = tx.objectStore("users");

  const existingUsers = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  if (existingUsers.some((u) => u.loginId.toLowerCase() === cleanLoginId)) {
    throw new Error(`Login ID "${loginId}" is already taken.`);
  }

  if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error(`Email "${email}" is already registered.`);
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: "user_" + Date.now().toString(36) + Math.random().toString(36).substring(2),
    loginId: cleanLoginId,
    email: cleanEmail,
    passwordHash,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  const writeTx = db.transaction(["users"], "readwrite");
  writeTx.objectStore("users").add(newUser);

  await setSession(newUser);
  return newUser;
}

export async function loginUser({ loginIdOrEmail, password }) {
  await initDatabase();
  const db = await openDB();

  const cleanInput = loginIdOrEmail.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const tx = db.transaction(["users"], "readonly");
  const store = tx.objectStore("users");

  const users = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  const matchedUser = users.find(
    (u) =>
      (u.loginId.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) &&
      u.passwordHash === passwordHash
  );

  if (!matchedUser) {
    throw new Error("Invalid Login ID / Email or Password.");
  }

  await setSession(matchedUser);
  return matchedUser;
}

// Session store management
export async function getSession() {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(["session"], "readonly");
      const req = tx.objectStore("session").get("current_user");

      const sessionData = await new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result ? req.result.user : null);
        req.onerror = () => resolve(null);
      });

      if (sessionData) return sessionData;
    }
  } catch (e) {
    // Ignore db transaction errors in test environments
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem("taskflow_session_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export async function setSession(user) {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(["session"], "readwrite");
      tx.objectStore("session").put({ key: "current_user", user });
    }
  } catch (e) {
    // Ignore db errors in test environments
  }

  try {
    localStorage.setItem("taskflow_session_user", JSON.stringify(user));
  } catch (e) {
    console.error("Failed to write session to localStorage:", e);
  }
}

export async function clearSession() {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(["session"], "readwrite");
      tx.objectStore("session").delete("current_user");
    }
  } catch (e) {
    // Ignore db errors in test environments
  }

  try {
    localStorage.removeItem("taskflow_session_user");
  } catch (e) {
    console.error("Failed to clear localStorage session:", e);
  }
}

// --- TASK SERVICES ---

export async function getUserTasks(userId) {
  if (!userId) return [];
  const db = await openDB();
  if (!db) return [];
  const tx = db.transaction(["tasks"], "readonly");
  const index = tx.objectStore("tasks").index("userId");
  const req = index.getAll(userId);

  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function saveUserTasks(userId, tasks) {
  if (!userId) return;
  const db = await openDB();
  
  // First delete existing tasks for user
  const tx = db.transaction(["tasks"], "readwrite");
  const store = tx.objectStore("tasks");
  const index = store.index("userId");
  const reqKeys = index.getAllKeys(userId);

  reqKeys.onsuccess = () => {
    const keys = reqKeys.result || [];
    keys.forEach((key) => store.delete(key));
    tasks.forEach((t) => store.add({ ...t, userId }));
  };
}

export async function addUserTask(userId, task) {
  const db = await openDB();
  const tx = db.transaction(["tasks"], "readwrite");
  const store = tx.objectStore("tasks");
  const taskRecord = { ...task, userId };
  store.add(taskRecord);
  return taskRecord;
}

export async function updateUserTask(userId, taskId, updates) {
  const db = await openDB();
  const tx = db.transaction(["tasks"], "readwrite");
  const store = tx.objectStore("tasks");
  const req = store.get(taskId);

  return new Promise((resolve) => {
    req.onsuccess = () => {
      const existing = req.result;
      if (existing) {
        const updated = { ...existing, ...updates, userId };
        store.put(updated);
        resolve(updated);
      } else {
        resolve(null);
      }
    };
  });
}

export async function deleteUserTask(userId, taskId) {
  const db = await openDB();
  const tx = db.transaction(["tasks"], "readwrite");
  tx.objectStore("tasks").delete(taskId);
}

// --- ADMIN SERVICES ---

export async function getAllUsersWithStats() {
  const db = await openDB();
  const txUsers = db.transaction(["users"], "readonly");
  const users = await new Promise((resolve) => {
    const req = txUsers.objectStore("users").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  const txTasks = db.transaction(["tasks"], "readonly");
  const allTasks = await new Promise((resolve) => {
    const req = txTasks.objectStore("tasks").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  return users.map((u) => {
    const userTasks = allTasks.filter((t) => t.userId === u.id);
    return {
      id: u.id,
      loginId: u.loginId,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      taskCount: userTasks.length,
      completedTaskCount: userTasks.filter((t) => t.completed).length,
    };
  });
}

export async function updateUserRole(userId, newRole) {
  const db = await openDB();
  const tx = db.transaction(["users"], "readwrite");
  const store = tx.objectStore("users");
  const req = store.get(userId);

  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const user = req.result;
      if (!user) {
        reject(new Error("User not found"));
        return;
      }
      user.role = newRole;
      store.put(user);
      resolve(user);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteUserAndData(userId) {
  const db = await openDB();
  const tx = db.transaction(["users", "tasks"], "readwrite");
  const userStore = tx.objectStore("users");
  const taskStore = tx.objectStore("tasks");

  // Delete user record
  userStore.delete(userId);

  // Delete user's tasks
  const taskIndex = taskStore.index("userId");
  const reqKeys = taskIndex.getAllKeys(userId);

  return new Promise((resolve) => {
    reqKeys.onsuccess = () => {
      const keys = reqKeys.result || [];
      keys.forEach((key) => taskStore.delete(key));
      resolve(true);
    };
  });
}

export async function getSystemAnalytics() {
  const db = await openDB();
  
  const txUsers = db.transaction(["users"], "readonly");
  const users = await new Promise((resolve) => {
    const req = txUsers.objectStore("users").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  const txTasks = db.transaction(["tasks"], "readonly");
  const tasks = await new Promise((resolve) => {
    const req = txTasks.objectStore("tasks").getAll();
    req.onsuccess = () => resolve(req.result || []);
  });

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const standardUsersCount = totalUsers - adminCount;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalUsers,
    adminCount,
    standardUsersCount,
    totalTasks,
    completedTasks,
    activeTasks,
    completionRate,
  };
}
