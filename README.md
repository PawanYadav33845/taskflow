# ⚡ TaskFlow — Modern React Task & Workflow Manager

<div align="center">

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Deployed-22C55E?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)

**TaskFlow** is a modern, high-performance, and feature-rich task management application built with **React** and styled with a unique **Vibrant Mesh Gradient & Glassmorphism Aura** design system.

[Live Demo](https://PawanYadav33845.github.io/taskflow/) • [Report Bug](https://github.com/PawanYadav33845/taskflow/issues) • [Request Feature](https://github.com/PawanYadav33845/taskflow/issues)

</div>

---

## ✨ Key Features

- 🎯 **Task Priorities**: Categorize items as **High (🔴)**, **Medium (🟡)**, or **Low (🟢)** priority.
- 🏷️ **10 Smart Categories**: Organize tasks by **Projects**, **Classes**, **Hobby**, **Work**, **Personal**, **Shopping**, **Health**, **Fitness**, **Finance**, or **General** — each with distinct color badges!
- 📅 **Due Dates & Overdue Alerts**: Assign deadlines with real-time overdue detection badges.
- 🔍 **Live Search & Sorting**: Instant keyword search with multi-criteria sorting (Newest, Oldest, Priority, Due Date).
- 💾 **JSON Backup & Restore**: Export task data to formatted JSON files or restore from previous backups.
- 📊 **Progress Dashboard**: Dynamic visual progress overview with active, completed, and total task statistics.
- ⚡ **Batch Productivity Shortcuts**: One-click **"Mark All Completed / Active"** and **"Clear Completed"** tools.
- 🌙 **Dark & Light Mode**: Auto-detects system color preferences with persistent manual toggle and mesh gradient backgrounds.
- ⌨️ **Keyboard Accessibility & Shortcuts**: Press `Enter` to create/save tasks and `Escape` to cancel inline editing.
- 🔒 **Robust Storage & Data Safety**: ID-based task mutations (`crypto.randomUUID()`), lazy LocalStorage initialization, input validation, and crash prevention boundaries.

---

## 🌐 GitHub Pages Hosting Verification

This repository is fully configured for deployment on **GitHub Pages**:

- **Homepage URL**: [`https://PawanYadav33845.github.io/taskflow/`](https://PawanYadav33845.github.io/taskflow/)
- **Deployment Command**: Run `npm run deploy` to compile production assets and automatically publish to the `gh-pages` branch.

---

## 🚀 Quick Start & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/PawanYadav33845/taskflow.git
cd taskflow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🛠️ Available Scripts

In the project directory, you can run:

| Command | Action |
| :--- | :--- |
| `npm start` | Launches dev server on `http://localhost:3000`. |
| `npm test` | Executes Jest unit test suite in watch mode. |
| `$env:CI='true'; npm test` | Runs all tests once non-interactively. |
| `npm run build` | Compiles optimized production bundle into `build/`. |
| `npm run deploy` | Builds and deploys the app live to **GitHub Pages**. |

---

## 📁 Project Structure

```
taskflow/
├── .github/
│   └── workflows/
│       ├── deploy.yml     # Automated GitHub Pages Deployment Workflow
│       └── ci.yml         # CI Build & Test Workflow
├── public/
│   ├── index.html         # Main HTML template (Tailwind CDN & Google Fonts)
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── App.js             # Core App Component (State, Priorities, Categories, Storage)
│   ├── App.test.js        # Automated Integration & Unit Tests
│   ├── index.css          # Global CSS & Mesh Gradient Backgrounds
│   └── index.js           # React DOM Root Entry Point
├── package.json           # Dependencies & gh-pages deployment scripts
└── README.md              # Project Documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
