import React, { useState, useEffect } from "react";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState("all");

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
    const savedMode = localStorage.getItem("darkMode") === "true";
    setTasks(savedTasks);
    setDarkMode(savedMode);
  }, []);

  // Save tasks & theme to localStorage
  useEffect(() => {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const addTask = () => {
    if (newTask.trim() === "") return;
    setTasks([...tasks, { text: newTask, completed: false }]);
    setNewTask("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask();
  };

  const toggleComplete = (index) => {
    const updated = [...tasks];
    updated[index].completed = !updated[index].completed;
    setTasks(updated);
  };

  const deleteTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditedText(tasks[index].text);
  };

  const saveEdit = (index) => {
    const updated = [...tasks];
    updated[index].text = editedText;
    setTasks(updated);
    setEditingIndex(null);
    setEditedText("");
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} min-h-screen flex items-center justify-center p-4`}>
      <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg p-6 rounded w-full max-w-md`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">To-Do List</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm px-2 py-1 border rounded"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2 text-black"
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={addTask}
          >
            Add
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex justify-center gap-4 mb-4 text-sm">
          {["all", "active", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-black dark:bg-gray-600 dark:text-white"
              }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {filteredTasks.map((task, index) => (
            <li
              key={index}
              className={`flex flex-col sm:flex-row sm:items-center justify-between ${darkMode ? "bg-gray-700" : "bg-gray-50"} p-2 rounded gap-2`}
            >
              {editingIndex === index ? (
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-black"
                  />
                  <button
                    onClick={() => saveEdit(index)}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className={`flex-1 ${
                      task.completed ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {task.text}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => toggleComplete(index)}
                    >
                      ✅
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => startEditing(index)}
                    >
                      ✏️
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteTask(index)}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
