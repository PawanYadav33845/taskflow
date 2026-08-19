# ⚡ TaskFlow — Modern React Task & Workflow Manager

<div align="center">

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![IndexedDB](https://img.shields.io/badge/Database-IndexedDB_v1-8B5CF6?style=for-the-badge&logo=indexeddb)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Deployed-22C55E?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)

**TaskFlow** is a modern, high-performance, and feature-rich task management application built with **React**, **IndexedDB**, and styled with a unique **Vibrant Mesh Gradient & Glassmorphism Aura** design system.

[Live Demo]([https://pawanyadav33845.github.io/taskflow/]) • [Report Bug](https://github.com/PawanYadav33845/taskflow/issues) • [Request Feature](https://github.com/PawanYadav33845/taskflow/issues)

</div>

---

## ✨ Key Features

- 👤 **User Authentication & Login ID**: Register with a unique **Login ID (Username)**, Email, and Password. Sign in using either your Login ID or Email Address.
- 👑 **Admin Dashboard (Superuser Console)**: Comprehensive admin dashboard for monitoring real-time system analytics (total users, task count, completion rates) and executing centered admin controls (**Make Admin / Demote**, **Clear Tasks**, and **Delete User**).
- 🗄️ **Local IndexedDB Database**: Persistent, client-side database engine storing user-scoped tasks, auth sessions, and credentials with salted SHA-256 Web Crypto hashing (`crypto.subtle`).
- 🧹 **Clean Initial State**: Zero presaved or preloaded default tasks — users and guests start with a completely fresh, empty workspace.
- 🎯 **Task Priorities**: Categorize items as **High (🔴)**, **Medium (🟡)**, or **Low (🟢)** priority.
- 🏷️ **10 Smart Categories**: Organize tasks by **Projects**, **Classes**, **Hobby**, **Work**, **Personal**, **Shopping**, **Health**, **Fitness**, **Finance**, or **General** — each with distinct color badges!
- 📅 **Due Dates & Overdue Alerts**: Assign deadlines with real-time overdue detection badges.
- 🔍 **Live Search & Sorting**: Instant keyword search with multi-criteria sorting (Newest, Oldest, Priority, Due Date).
- 💾 **JSON Backup & Restore**: Export task data to formatted JSON files or restore from previous backups.
- 📊 **Progress Dashboard**: Dynamic visual progress overview with active, completed, and total task statistics.
- ⚡ **Batch Productivity Shortcuts**: One-click **"Mark All Completed / Active"** and **"Clear Completed"** tools.
- 🌙 **Dark & Light Mode**: Auto-detects system color preferences with persistent manual toggle and mesh gradient backgrounds.
- ⌨️ **Keyboard Accessibility & Shortcuts**: Press `Enter` to create/save tasks and `Escape` to cancel inline editing.

---

## 🔑 Demo Credentials

To test the application immediately without creating a new account, use the pre-seeded admin account or Guest mode:

| Role | Login ID | Email | Password | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@taskflow.com` | `admin123` | Full access + Admin Dashboard |
| **Guest** | *N/A* | *N/A* | *N/A* | Instant trial mode (stored in LocalStorage) |

---

## 🌐 GitHub Actions Automated Deployment

This repository is configured with **GitHub Actions** workflows for continuous integration and automatic deployment to **GitHub Pages**:

- **Deployment Workflow**: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **CI Build & Test Pipeline**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- **Trigger**: Automatically runs on every `push` to the `main` branch or manual trigger via `workflow_dispatch`.
- **Live Site**: [`(https://pawanyadav33845.github.io/taskflow/)`]([https://pawanyadav33845.github.io/taskflow/])

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
| `$env:CI='true'; npm test` | Runs all unit tests once non-interactively. |
| `npm run build` | Compiles optimized production bundle into `build/`. |
| `npm run deploy` | Builds and deploys the app live to **GitHub Pages**. |

---

## 📁 Project Structure

```
taskflow/
├── .github/
│   └── workflows/
│       ├── deploy.yml         # GitHub Actions Automated Pages Deployment
│       └── ci.yml             # GitHub Actions CI Build & Test Pipeline
├── public/
│   ├── index.html             # Main HTML template (Tailwind CDN & Google Fonts)
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── AdminPanel.js      # Admin Dashboard & Superuser Management Console
│   │   └── AuthModal.js       # Login / Sign Up Modal with Login ID
│   ├── services/
│   │   └── db.js              # IndexedDB Engine & Web Crypto Auth Service
│   ├── App.js                 # Core App Component (State, Filters, Categories)
│   ├── App.test.js            # Integration & Unit Test Suite
│   ├── index.css              # Global CSS & Mesh Gradient Backgrounds
│   └── index.js               # React DOM Root Entry Point
├── package.json               # Dependencies & deployment scripts
└── README.md                  # Project Documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
