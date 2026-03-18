# 🔄 DiffSync

A cross-platform desktop application for **comparing and syncing code** between two project folders. Built with Electron, React, TypeScript, and Monaco Editor.

![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## ✨ Features

### Core
- **📂 Project Comparison** — Scan and compare two project folders recursively
- **🔀 File Sync** — Sync files from P1 → P2 or P2 → P1 with one click
- **📝 Monaco Diff Editor** — VS Code-grade diff viewer with syntax highlighting, minimap, and inline/side-by-side toggle
- **💾 Auto Backup** — Creates timestamped backups before overwriting files
- **⏪ Undo Sync** — Restore backed-up files with one click from History

### Advanced
- **👁️ File Watcher** — Auto-detects changes via `chokidar` and re-compares
- **📦 Drag & Drop** — Drop folders directly onto path inputs
- **🎯 Scope Selector** — Choose specific files/folders to include in comparison
- **📊 Export Report** — Generate standalone HTML diff reports with stats
- **🌗 Light/Dark Theme** — Toggle between themes, preference persisted
- **🕐 Recent Projects** — Quick access to previously compared project pairs
- **⚙️ Config Editor** — Edit ignore patterns, extensions, and backup settings in-app

### UI/UX
- **🔍 Search & Filter** — Filter files by status (Modified, Only P1, Only P2, Same) and search by name
- **📁 Tree/Flat View** — Toggle between tree structure and flat file list
- **↔️ Resizable Panels** — Drag to resize file list and diff panel
- **⌨️ Keyboard Shortcuts** — Ctrl+F (search), Ctrl+R (refresh), Ctrl+B (toggle sidebar)
- **🔔 Toast Notifications** — Success/error feedback for all operations

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### Install

```bash
git clone <repo-url>
cd diffsync
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
# Windows (.exe installer)
npm run package:win

# macOS (.dmg)
npm run package:mac
```

Output: `release/DiffSync Setup 1.0.0.exe`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Electron 33 + electron-vite |
| **Frontend** | React 18, TypeScript 5.7 |
| **State** | Zustand |
| **Diff Engine** | Monaco Editor (`@monaco-editor/react`) |
| **File Watching** | chokidar v5 |
| **Scanning** | fast-glob |
| **Diff Algorithm** | diff (npm) |
| **Build** | Vite 5, electron-builder |

---

## 📁 Project Structure

```
src/
├── main/                   # Electron main process
│   ├── main.ts             # App entry, window creation
│   ├── ipc/
│   │   └── handlers.ts     # All IPC handlers
│   └── services/
│       ├── scanner.ts      # File scanning with fast-glob
│       ├── comparator.ts   # File comparison logic
│       ├── differ.ts       # Line-by-line diff generation
│       ├── syncer.ts       # File sync with backup
│       ├── backup.ts       # Timestamped backup service
│       ├── manifest.ts     # Sync manifest tracking
│       ├── config.ts       # Config load/save
│       ├── history.ts      # Sync history management
│       ├── recentProjects.ts
│       ├── watcher.ts      # chokidar file watcher
│       ├── reportGenerator.ts  # HTML report generator
│       └── dataDir.ts      # AppData path utility
├── preload/
│   └── preload.ts          # IPC bridge (contextBridge)
├── renderer/               # React frontend
│   ├── App.tsx             # Root layout + keyboard shortcuts
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── Toolbar.tsx     # Compare, Sync, Watch, Export, Theme
│   │   ├── Sidebar.tsx     # Projects, Config, History tabs
│   │   ├── FilePanel.tsx   # File list (flat/tree view)
│   │   ├── DiffPanel.tsx   # Monaco diff viewer
│   │   ├── StatusBar.tsx
│   │   ├── ScopeSelector.tsx
│   │   └── ...
│   ├── store/
│   │   └── useAppStore.ts  # Zustand global state
│   └── styles/
│       └── globals.css     # Design tokens + all styles
└── shared/
    ├── types.ts            # TypeScript types & ElectronAPI
    └── ipc-channels.ts     # IPC channel constants
```

---

## 💾 Data Storage

All app data is stored in **AppData** (not in project folders):

```
%APPDATA%/diffsync/
├── projects/
│   └── <hash>/           # Per project-pair (MD5 of P1+P2 paths)
│       ├── config.json   # Sync configuration
│       ├── manifest.json # File hash tracking
│       └── backup/       # Timestamped backups
├── recent-projects.json
├── sync-history.json
└── theme.json
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + F` | Focus search |
| `Ctrl + R` | Refresh comparison |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + 1` | Show all files |
| `Ctrl + 2` | Show modified only |
| `Ctrl + 3` | Show only in P1 |
| `Ctrl + 4` | Show only in P2 |

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run package:win` | Build + package Windows installer |
| `npm run package:mac` | Build + package macOS DMG |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

---

## 📄 License

MIT
