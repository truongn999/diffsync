# 📄 PRODUCT REQUIREMENT DOCUMENT (PRD)

## Project: Project Sync Tool

---

# 1. 📌 Product Overview

## 1.1 Product Name

**Project Sync Tool**

## 1.2 Objective

Build a cross-platform desktop application (Windows + macOS) that:

* Compares differences between two source code projects (`p1` and `p2`)
* Displays detailed file-level and line-level differences (diff)
* Allows controlled synchronization (sync) of files between the two projects

---

## 1.3 Problem Statement

Currently:

* `p2` reuses code from `p1` (components, hooks, utilities, etc.)
* When `p1` changes → `p2` does not automatically update
* Developers manually copy code → error-prone, time-consuming, inconsistent

👉 A tool is needed to:

* Detect changes
* Visualize differences
* Sync code safely and efficiently

---

## 1.4 Success Metrics

* Reduce ≥80% time spent syncing code between projects
* Reduce manual copy errors to near 0
* Compare time < 2 seconds for ~5k files
* Sync success rate ≥ 99.9% (no file corruption)

---

# 2. 👥 Users & Use Cases

## 2.1 Target Users

* Frontend Developers
* Tech Leads
* Developers working with multi-project setups (white-label, multi-tenant, shared codebases)

---

## 2.2 Key Use Cases

### UC1: Sync from p1 → p2

* Developer updates a component in `p1`
* Opens tool → compares → syncs changes to `p2`

### UC2: Pre-deployment validation

* Compare two projects to ensure no unintended differences

### UC3: Conflict detection

* Both `p1` and `p2` modify the same file
* Tool detects and flags conflict

---

# 3. 🧩 Scope

## 3.1 In Scope (MVP)

* Select two project folders
* Scan files based on config
* Compare files (hash-based)
* Display diff (text-based)
* Sync files between projects
* Backup before sync
* Ignore rules support

---

## 3.2 Out of Scope (MVP)

* Git integration
* 3-way merge
* Real-time file watching
* Cloud sync

---

# 4. 🏗️ Functional Requirements

## 4.1 Project Selection

### Requirement

User selects:

* Project 1 (`p1`)
* Project 2 (`p2`)

### Acceptance Criteria

* Folder selection via native system dialog
* Recently used paths are remembered

---

## 4.2 File Scanning

### Requirement

Scan files based on `sync.config.json`

### Acceptance Criteria

* Only files matching configured patterns are scanned
* Ignore rules are applied
* Output includes:

  * relative path
  * file hash
  * last modified time

---

## 4.3 File Comparison

### Requirement

Compare files between two projects

### Acceptance Criteria

| Condition         | Result     |
| ----------------- | ---------- |
| Exists only in p1 | only_in_p1 |
| Exists only in p2 | only_in_p2 |
| Same hash         | same       |
| Different hash    | modified   |

---

## 4.4 Diff Viewer

### Requirement

Display file differences

### Acceptance Criteria

* Side-by-side diff view
* Highlight:

  * added lines
  * removed lines
  * modified lines
* Synchronized scrolling

---

## 4.5 File Sync

### Requirement

Allow syncing files between projects

### Acceptance Criteria

* Sync single file / multiple files / all files
* Support:

  * p1 → p2
  * p2 → p1
* Create file if not exists
* Overwrite if exists

---

## 4.6 Backup

### Requirement

Backup files before overwrite

### Acceptance Criteria

* Backup stored at:
  `.sync-backup/{timestamp}/...`
* Option to enable/disable backup

---

## 4.7 Conflict Detection

### Requirement

Detect conflicts when both projects modify the same file

### Acceptance Criteria

* Based on manifest comparison
* Status shown as `conflict`
* Sync is blocked for conflicted files

---

## 4.8 Config Support

### Requirement

Load and apply configuration file

### Acceptance Criteria

* Load `sync.config.json`
* Support:

  * groups
  * ignore rules
  * file extensions

---

# 5. 🖥️ UI/UX Requirements

## 5.1 Layout

### Left Panel

* Select p1
* Select p2
* Compare button

### Center Panel

* File list table:

  * path
  * status
  * checkbox

### Right Panel

* Diff viewer

### Toolbar

* Sync p1 → p2
* Sync p2 → p1
* Refresh

---

## 5.2 Status Colors

| Status     | Color  |
| ---------- | ------ |
| same       | gray   |
| modified   | yellow |
| only_in_p1 | green  |
| only_in_p2 | purple |
| conflict   | red    |

---

## 5.3 UX Rules

* Clicking a file shows its diff
* Multi-select enables batch sync
* Disable sync button if no files selected

---

# 6. ⚙️ Non-functional Requirements

## 6.1 Performance

* Compare < 2 seconds for ~5k files
* Memory usage < 500MB

---

## 6.2 Cross-platform

* Must run on:

  * Windows (.exe)
  * macOS (.dmg)

---

## 6.3 Reliability

* No data loss during sync
* Backup before overwrite

---

## 6.4 Security

* Do not execute project code
* Validate all file paths

---

# 7. 🧠 Data Model

## 7.1 FileInfo

```ts
type FileInfo = {
  relativePath: string;
  hash: string;
  mtime: number;
};
```

---

## 7.2 CompareItem

```ts
type CompareItem = {
  relativePath: string;
  status: string;
  p1Path?: string;
  p2Path?: string;
};
```

---

## 7.3 Manifest

```json
{
  "files": {
    "src/hooks/useAuth.ts": {
      "lastSyncHashP1": "abc",
      "lastSyncHashP2": "abc"
    }
  }
}
```

---

# 8. 🔌 Internal API (IPC)

## Compare

```ts
compareProjects({
  p1Root,
  p2Root
})
```

---

## Diff

```ts
getDiff({
  relativePath
})
```

---

## Sync

```ts
syncFiles({
  from: "p1",
  to: "p2",
  files: []
})
```

---

# 9. 📦 Tech Stack

## Core

* Node.js
* TypeScript

## Desktop

* Electron

## UI

* React
* Monaco Editor

---

# 10. 🚀 Milestones

## Phase 1 (MVP - 1–2 weeks)

* Scan
* Compare
* Diff
* Sync

## Phase 2

* Manifest
* Conflict detection
* Backup system

## Phase 3

* UI polish
* Performance optimization

---

# 11. ⚠️ Risks

| Risk                 | Mitigation       |
| -------------------- | ---------------- |
| Accidental overwrite | Backup system    |
| Conflict handling    | Detect and block |
| Performance issues   | Caching          |

---

# 12. 🔮 Future Enhancements

* Watch mode (auto detect changes)
* Git integration
* Smart merge
* Monorepo migration support

---

# ✅ Final Summary

Project Sync Tool is:

* A desktop application
* Designed to compare and sync code between two independent projects
* A replacement for manual copy workflows
* A solution to improve consistency, speed, and reliability in multi-project environments

---
