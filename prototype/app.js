/* ═══════════════════════════════════════════════ */
/* Project Sync Tool — Interactive Prototype       */
/* ═══════════════════════════════════════════════ */

// ─── Mock Data ───────────────────────────────────
const MOCK_FILES = [
  { relativePath: 'src/components/Button/Button.tsx', status: 'modified' },
  { relativePath: 'src/components/Button/Button.module.scss', status: 'modified' },
  { relativePath: 'src/components/Modal/Modal.tsx', status: 'same' },
  { relativePath: 'src/components/Modal/Modal.module.scss', status: 'same' },
  { relativePath: 'src/hooks/useAuth.ts', status: 'modified' },
  { relativePath: 'src/hooks/useDebounce.ts', status: 'same' },
  { relativePath: 'src/hooks/useMediaQuery.ts', status: 'only_in_p1' },
  { relativePath: 'src/hooks/useTheme.ts', status: 'only_in_p2' },
  { relativePath: 'src/utils/format.ts', status: 'modified' },
  { relativePath: 'src/utils/cn.ts', status: 'same' },
  { relativePath: 'src/utils/api-client.ts', status: 'conflict' },
  { relativePath: 'src/types/user.ts', status: 'modified' },
  { relativePath: 'src/types/common.ts', status: 'same' },
  { relativePath: 'src/services/auth.service.ts', status: 'modified' },
  { relativePath: 'src/services/user.service.ts', status: 'same' },
  { relativePath: 'src/services/notification.service.ts', status: 'only_in_p1' },
  { relativePath: 'src/layouts/MainLayout.tsx', status: 'modified' },
  { relativePath: 'src/layouts/AuthLayout.tsx', status: 'same' },
  { relativePath: 'src/pages/Dashboard.tsx', status: 'modified' },
  { relativePath: 'src/pages/Settings.tsx', status: 'only_in_p2' },
  { relativePath: 'src/pages/Login.tsx', status: 'same' },
  { relativePath: 'src/constants/routes.ts', status: 'modified' },
  { relativePath: 'src/constants/config.ts', status: 'conflict' },
  { relativePath: 'src/store/auth.store.ts', status: 'modified' },
  { relativePath: 'src/store/ui.store.ts', status: 'only_in_p1' },
];

const MOCK_DIFF = {
  'src/hooks/useAuth.ts': {
    p1: [
      { num: 1, content: "import { useState, useEffect, useCallback } from 'react';", type: 'normal' },
      { num: 2, content: "import { AuthService } from '../services/auth.service';", type: 'normal' },
      { num: 3, content: "import { User } from '../types/user';", type: 'normal' },
      { num: 4, content: "", type: 'normal' },
      { num: 5, content: "export function useAuth() {", type: 'normal' },
      { num: 6, content: "  const [user, setUser] = useState<User | null>(null);", type: 'normal' },
      { num: 7, content: "  const [loading, setLoading] = useState(true);", type: 'normal' },
      { num: 8, content: "  const [error, setError] = useState<string | null>(null);", type: 'add' },
      { num: 9, content: "", type: 'normal' },
      { num: 10, content: "  const login = useCallback(async (email: string, password: string) => {", type: 'normal' },
      { num: 11, content: "    try {", type: 'normal' },
      { num: 12, content: "      setLoading(true);", type: 'normal' },
      { num: 13, content: "      setError(null);", type: 'add' },
      { num: 14, content: "      const result = await AuthService.login(email, password);", type: 'normal' },
      { num: 15, content: "      setUser(result.user);", type: 'normal' },
      { num: 16, content: "      return result;", type: 'add' },
      { num: 17, content: "    } catch (err) {", type: 'normal' },
      { num: 18, content: "      setError(err instanceof Error ? err.message : 'Login failed');", type: 'add' },
      { num: 19, content: "      throw err;", type: 'normal' },
      { num: 20, content: "    } finally {", type: 'normal' },
      { num: 21, content: "      setLoading(false);", type: 'normal' },
      { num: 22, content: "    }", type: 'normal' },
      { num: 23, content: "  }, []);", type: 'normal' },
      { num: 24, content: "", type: 'normal' },
      { num: 25, content: "  const logout = useCallback(async () => {", type: 'add' },
      { num: 26, content: "    await AuthService.logout();", type: 'add' },
      { num: 27, content: "    setUser(null);", type: 'add' },
      { num: 28, content: "  }, []);", type: 'add' },
      { num: 29, content: "", type: 'normal' },
      { num: 30, content: "  return { user, loading, error, login, logout };", type: 'normal' },
      { num: 31, content: "}", type: 'normal' },
    ],
    p2: [
      { num: 1, content: "import { useState, useEffect } from 'react';", type: 'normal' },
      { num: 2, content: "import { AuthService } from '../services/auth.service';", type: 'normal' },
      { num: 3, content: "import { User } from '../types/user';", type: 'normal' },
      { num: 4, content: "", type: 'normal' },
      { num: 5, content: "export function useAuth() {", type: 'normal' },
      { num: 6, content: "  const [user, setUser] = useState<User | null>(null);", type: 'normal' },
      { num: 7, content: "  const [loading, setLoading] = useState(true);", type: 'normal' },
      { num: 8, content: "", type: 'empty' },
      { num: 9, content: "", type: 'normal' },
      { num: 10, content: "  const login = async (email: string, password: string) => {", type: 'normal' },
      { num: 11, content: "    try {", type: 'normal' },
      { num: 12, content: "      setLoading(true);", type: 'normal' },
      { num: 13, content: "", type: 'empty' },
      { num: 14, content: "      const result = await AuthService.login(email, password);", type: 'normal' },
      { num: 15, content: "      setUser(result.user);", type: 'normal' },
      { num: 16, content: "", type: 'empty' },
      { num: 17, content: "    } catch (err) {", type: 'normal' },
      { num: 18, content: "      console.error('Login failed:', err);", type: 'remove' },
      { num: 19, content: "      throw err;", type: 'normal' },
      { num: 20, content: "    } finally {", type: 'normal' },
      { num: 21, content: "      setLoading(false);", type: 'normal' },
      { num: 22, content: "    }", type: 'normal' },
      { num: 23, content: "  };", type: 'normal' },
      { num: 24, content: "", type: 'normal' },
      { num: 25, content: "", type: 'empty' },
      { num: 26, content: "", type: 'empty' },
      { num: 27, content: "", type: 'empty' },
      { num: 28, content: "", type: 'empty' },
      { num: 29, content: "", type: 'normal' },
      { num: 30, content: "  return { user, loading, login };", type: 'normal' },
      { num: 31, content: "}", type: 'normal' },
    ],
  },
  'src/components/Button/Button.tsx': {
    p1: [
      { num: 1, content: "import React from 'react';", type: 'normal' },
      { num: 2, content: "import styles from './Button.module.scss';", type: 'normal' },
      { num: 3, content: "import { cn } from '../../utils/cn';", type: 'add' },
      { num: 4, content: "", type: 'normal' },
      { num: 5, content: "interface ButtonProps {", type: 'normal' },
      { num: 6, content: "  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';", type: 'add' },
      { num: 7, content: "  size?: 'sm' | 'md' | 'lg';", type: 'normal' },
      { num: 8, content: "  loading?: boolean;", type: 'add' },
      { num: 9, content: "  children: React.ReactNode;", type: 'normal' },
      { num: 10, content: "  onClick?: () => void;", type: 'normal' },
      { num: 11, content: "}", type: 'normal' },
    ],
    p2: [
      { num: 1, content: "import React from 'react';", type: 'normal' },
      { num: 2, content: "import styles from './Button.module.scss';", type: 'normal' },
      { num: 3, content: "", type: 'empty' },
      { num: 4, content: "", type: 'normal' },
      { num: 5, content: "interface ButtonProps {", type: 'normal' },
      { num: 6, content: "  variant?: 'primary' | 'secondary';", type: 'remove' },
      { num: 7, content: "  size?: 'sm' | 'md' | 'lg';", type: 'normal' },
      { num: 8, content: "", type: 'empty' },
      { num: 9, content: "  children: React.ReactNode;", type: 'normal' },
      { num: 10, content: "  onClick?: () => void;", type: 'normal' },
      { num: 11, content: "}", type: 'normal' },
    ],
  },
};

const DEFAULT_CONFIG = {
  groups: [
    { name: "Shared Components", paths: ["src/components/**"] },
    { name: "Hooks", paths: ["src/hooks/**"] },
    { name: "Utils", paths: ["src/utils/**"] },
    { name: "Services", paths: ["src/services/**"] },
    { name: "Types", paths: ["src/types/**"] }
  ],
  ignore: [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    ".env*",
    "*.log",
    "package-lock.json"
  ],
  extensions: [".ts", ".tsx", ".js", ".jsx", ".scss", ".css", ".json"],
  backup: {
    enabled: true,
    directory: ".sync-backup"
  },
  selectedPaths: []  // empty = all files
};

// ─── State ───────────────────────────────────────
let state = {
  p1Path: null,
  p2Path: null,
  files: [],
  filteredFiles: [],
  selectedFiles: new Set(),
  activeFile: null,
  activeFileIndex: -1,
  currentFilter: 'all',
  searchQuery: '',
  compared: false,
  viewMode: 'flat',
  sidebarCollapsed: false,
  syncHistory: [],
  config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  // Scope Selector
  projectLoaded: false,
  scopeSelectedPaths: new Set(),
  allScannedFiles: [],
};

// ─── Init ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  initResizeHandles();
  initKeyboardShortcuts();
  initFilePreview();
  initConfigEditor();
});

// ─── Folder Selection ────────────────────────────
function selectFolder(project) {
  const mockPaths = {
    p1: 'D:\\projects\\hifunnel-dashboard',
    p2: 'D:\\projects\\atlas-frontend',
  };
  const el = document.getElementById(`${project}Path`);
  const textEl = document.getElementById(`${project}PathText`);

  state[`${project}Path`] = mockPaths[project];
  textEl.textContent = mockPaths[project];
  el.classList.add('path-input--active');

  showToast(`Project ${project.toUpperCase()} selected`, 'info');
}

// ─── Compare ─────────────────────────────────────
function handleCompare() {
  if (!state.p1Path || !state.p2Path) {
    selectFolder('p1');
    setTimeout(() => {
      selectFolder('p2');
      setTimeout(() => runCompare(), 400);
    }, 300);
    return;
  }
  runCompare();
}

function runCompare() {
  const btn = document.getElementById('btnCompare');
  const globalStatus = document.getElementById('globalStatus');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Comparing...';
  globalStatus.textContent = 'Comparing files...';

  setTimeout(() => {
    // Filter MOCK_FILES by scope if available
    let filesToCompare = [...MOCK_FILES];
    if (state.scopeSelectedPaths.size > 0) {
      filesToCompare = filesToCompare.filter(f => state.scopeSelectedPaths.has(f.relativePath));
    }

    state.files = filesToCompare;
    state.compared = true;
    state.currentFilter = 'all';

    renderView();
    updateStats();
    updateFilterCounts();

    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18"/></svg> Compare`;
    globalStatus.textContent = `Compared — ${state.files.length} files`;

    document.getElementById('sidebarStats').style.display = 'block';
    document.getElementById('statusBarInfo').textContent = `${state.files.length} files compared`;

    showToast(`Comparison complete: ${state.files.length} files scanned`, 'success');
  }, 1200);
}

// ═══════════════════════════════════════════════
// VIEW MODE (Flat List / Tree View)
// ═══════════════════════════════════════════════
function setViewMode(mode) {
  state.viewMode = mode;

  document.getElementById('btnFlatView').classList.toggle('view-toggle__btn--active', mode === 'flat');
  document.getElementById('btnTreeView').classList.toggle('view-toggle__btn--active', mode === 'tree');

  renderView();
}

function renderView() {
  if (state.viewMode === 'flat') {
    renderFileTable();
    document.getElementById('treeView').style.display = 'none';
  } else {
    renderTreeView();
    document.getElementById('fileTable').style.display = 'none';
  }
}

// ─── File Table (Flat View) ──────────────────────
function renderFileTable() {
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('fileTable');
  const treeView = document.getElementById('treeView');
  const tbody = document.getElementById('fileTableBody');

  emptyState.style.display = 'none';
  table.style.display = 'table';
  treeView.style.display = 'none';

  let files = getFilteredFiles();
  state.filteredFiles = files;

  const searchCount = document.getElementById('searchCount');
  searchCount.textContent = state.searchQuery ? `${files.length} results` : '';

  tbody.innerHTML = files.map((file, i) => {
    const parts = file.relativePath.split('/');
    const fileName = parts.pop();
    const dirPath = parts.join('/') + '/';
    const isSelected = state.selectedFiles.has(file.relativePath);
    const isActive = state.activeFile === file.relativePath;

    return `
      <tr class="file-row ${isSelected ? 'file-row--selected' : ''} ${isActive ? 'file-row--active' : ''}"
          onclick="selectFile('${file.relativePath}')"
          data-path="${file.relativePath}"
          data-index="${i}">
        <td class="file-table__check" onclick="event.stopPropagation()">
          <input type="checkbox" ${isSelected ? 'checked' : ''}
                 onchange="toggleFileSelect('${file.relativePath}', this.checked)" />
        </td>
        <td>
          <span class="file-path">
            <span class="file-path__dir">${dirPath}</span>
            <span class="file-path__name">${fileName}</span>
          </span>
        </td>
        <td>
          <span class="status-badge status-badge--${file.status}">
            <span class="status-dot status-dot--${file.status}"></span>
            ${formatStatus(file.status)}
          </span>
        </td>
        <td class="file-table__actions" onclick="event.stopPropagation()">
          ${file.status !== 'same' ? `
            <button class="quick-sync-btn" title="Quick sync to P2" onclick="quickSync('${file.relativePath}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  updateSelectionBar();
}

// ─── Tree View ───────────────────────────────────
function renderTreeView() {
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('fileTable');
  const treeView = document.getElementById('treeView');

  emptyState.style.display = 'none';
  table.style.display = 'none';
  treeView.style.display = 'block';

  const files = getFilteredFiles();
  state.filteredFiles = files;

  // Build tree structure
  const tree = {};
  files.forEach(file => {
    const parts = file.relativePath.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        // File leaf node
        if (!current.__files__) current.__files__ = [];
        current.__files__.push({ name: part, ...file });
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });

  treeView.innerHTML = renderTreeNode(tree, 0);
}

function renderTreeNode(node, depth) {
  let html = '';

  // Render folders first
  const folders = Object.keys(node).filter(k => k !== '__files__').sort();
  folders.forEach(folder => {
    const id = `folder_${depth}_${folder}`;
    html += `
      <div class="tree-node">
        <div class="tree-folder" onclick="toggleTreeFolder('${id}')" style="padding-left:${12 + depth * 16}px">
          <svg class="tree-folder__chevron tree-folder__chevron--open" id="chevron_${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          <svg class="tree-folder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          ${folder}
        </div>
        <div class="tree-children" id="${id}">
          ${renderTreeNode(node[folder], depth + 1)}
        </div>
      </div>
    `;
  });

  // Then render files
  if (node.__files__) {
    node.__files__.forEach(file => {
      const isActive = state.activeFile === file.relativePath;
      html += `
        <div class="tree-file ${isActive ? 'tree-file--active' : ''}" 
             onclick="selectFile('${file.relativePath}')"
             data-path="${file.relativePath}"
             style="padding-left:${12 + (depth) * 16 + 16}px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          ${file.name}
          <span class="tree-file__status">
            <span class="status-badge status-badge--${file.status}">
              <span class="status-dot status-dot--${file.status}"></span>
              ${formatStatus(file.status)}
            </span>
          </span>
        </div>
      `;
    });
  }

  return html;
}

function toggleTreeFolder(id) {
  const children = document.getElementById(id);
  const chevron = document.getElementById('chevron_' + id);
  children.classList.toggle('tree-children--collapsed');
  chevron.classList.toggle('tree-folder__chevron--open');
}

// ─── Common helpers ──────────────────────────────
function getFilteredFiles() {
  let files = state.files;
  if (state.currentFilter !== 'all') {
    files = files.filter(f => f.status === state.currentFilter);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    files = files.filter(f => f.relativePath.toLowerCase().includes(q));
  }
  return files;
}

function formatStatus(status) {
  const map = { same: 'Same', modified: 'Modified', only_in_p1: 'Only P1', only_in_p2: 'Only P2', conflict: 'Conflict' };
  return map[status] || status;
}

// ─── File Selection ──────────────────────────────
function selectFile(path) {
  state.activeFile = path;
  state.activeFileIndex = state.filteredFiles.findIndex(f => f.relativePath === path);

  // Update active row styles (both trees and table rows)
  document.querySelectorAll('.file-row, .tree-file').forEach(row => {
    const rowPath = row.dataset.path;
    row.classList.toggle('file-row--active', rowPath === path);
    row.classList.toggle('tree-file--active', rowPath === path);
  });

  showDiff(path);
}

function toggleFileSelect(path, checked) {
  if (checked) {
    state.selectedFiles.add(path);
  } else {
    state.selectedFiles.delete(path);
  }

  const row = document.querySelector(`tr[data-path="${path}"]`);
  if (row) row.classList.toggle('file-row--selected', checked);

  updateSelectionBar();
  updateSyncButtons();

  const selectAll = document.getElementById('selectAll');
  selectAll.checked = state.selectedFiles.size === state.filteredFiles.length && state.filteredFiles.length > 0;
  selectAll.indeterminate = state.selectedFiles.size > 0 && state.selectedFiles.size < state.filteredFiles.length;
}

function toggleSelectAll(checked) {
  state.filteredFiles.forEach(f => {
    if (checked) state.selectedFiles.add(f.relativePath);
    else state.selectedFiles.delete(f.relativePath);
  });
  renderFileTable();
  updateSyncButtons();
}

function updateSelectionBar() {
  const bar = document.getElementById('selectionBar');
  const count = document.getElementById('selectedCount');
  if (state.selectedFiles.size > 0) {
    bar.style.display = 'flex';
    count.textContent = `${state.selectedFiles.size} file${state.selectedFiles.size > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

function updateSyncButtons() {
  const has = state.selectedFiles.size > 0;
  document.getElementById('btnSyncP1P2').disabled = !has;
  document.getElementById('btnSyncP2P1').disabled = !has;
}

// ─── Diff Viewer ─────────────────────────────────
function showDiff(path) {
  const empty = document.getElementById('diffEmpty');
  const viewer = document.getElementById('diffViewer');
  const fileName = document.getElementById('diffFileName');
  const badge = document.getElementById('diffBadge');
  const p1File = document.getElementById('diffP1File');
  const p2File = document.getElementById('diffP2File');
  const codeP1 = document.getElementById('diffCodeP1');
  const codeP2 = document.getElementById('diffCodeP2');

  const file = state.files.find(f => f.relativePath === path);
  if (!file) return;

  empty.style.display = 'none';
  viewer.style.display = 'flex';

  fileName.textContent = path;
  badge.textContent = formatStatus(file.status);
  badge.setAttribute('data-status', file.status);
  p1File.textContent = state.p1Path + '/' + path;
  p2File.textContent = state.p2Path + '/' + path;

  const diff = MOCK_DIFF[path];
  if (diff) {
    codeP1.innerHTML = renderDiffLines(diff.p1);
    codeP2.innerHTML = renderDiffLines(diff.p2);
  } else {
    codeP1.innerHTML = generateGenericDiff(path, 'p1', file.status);
    codeP2.innerHTML = generateGenericDiff(path, 'p2', file.status);
  }
  syncScroll(codeP1, codeP2);
}

function renderDiffLines(lines) {
  return lines.map(line => {
    let cls = 'diff-line';
    if (line.type === 'add') cls += ' diff-line--add';
    else if (line.type === 'remove') cls += ' diff-line--remove';
    else if (line.type === 'empty') cls += ' diff-line--empty';
    return `<div class="${cls}"><span class="diff-line__number">${line.type === 'empty' ? '' : line.num}</span><span class="diff-line__content">${escapeHtml(line.content)}</span></div>`;
  }).join('');
}

function generateGenericDiff(path, side, status) {
  return renderDiffLines(getTemplateForFile(path, side, status));
}

function getTemplateForFile(path, side, status) {
  if (status === 'same') return [{ num: 1, content: '// File is identical in both projects', type: 'normal' }, { num: 2, content: '// No differences found', type: 'normal' }];
  if (status === 'only_in_p1' && side === 'p2') return [{ num: 1, content: '// File does not exist', type: 'empty' }];
  if (status === 'only_in_p2' && side === 'p1') return [{ num: 1, content: '// File does not exist', type: 'empty' }];
  if (status === 'conflict') {
    const base = [
      { num: 1, content: "// ⚠️ CONFLICT: Both projects modified this file", type: 'normal' },
      { num: 2, content: "// Sync is blocked — resolve manually", type: 'normal' },
      { num: 3, content: "", type: 'normal' },
    ];
    if (side === 'p1') { base.push({ num: 4, content: "const API_BASE = 'https://api-v2.example.com';", type: 'add' }, { num: 5, content: "const TIMEOUT = 10000;", type: 'add' }); }
    else { base.push({ num: 4, content: "const API_BASE = 'https://staging-api.example.com';", type: 'remove' }, { num: 5, content: "const TIMEOUT = 5000;", type: 'remove' }); }
    return base;
  }
  return [
    { num: 1, content: `// ${path}`, type: 'normal' },
    { num: 2, content: '// Content differs between projects', type: 'normal' },
    { num: 3, content: '', type: 'normal' },
    ...(side === 'p1' ? [{ num: 4, content: '// Updated version', type: 'add' }] : [{ num: 4, content: '// Original version', type: 'remove' }]),
  ];
}

function syncScroll(el1, el2) {
  let syncing = false;
  el1.onscroll = () => { if (syncing) { syncing = false; return; } syncing = true; el2.scrollTop = el1.scrollTop; el2.scrollLeft = el1.scrollLeft; };
  el2.onscroll = () => { if (syncing) { syncing = false; return; } syncing = true; el1.scrollTop = el2.scrollTop; el1.scrollLeft = el2.scrollLeft; };
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ─── Filters ─────────────────────────────────────
function setFilter(filter, chipEl) {
  state.currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
  chipEl.classList.add('filter-chip--active');
  renderView();
}

function handleSearch(value) { state.searchQuery = value; renderView(); }

function updateFilterCounts() {
  const c = { all: 0, modified: 0, only_in_p1: 0, only_in_p2: 0, conflict: 0, same: 0 };
  state.files.forEach(f => { c.all++; c[f.status]++; });
  document.getElementById('countAll').textContent = c.all;
  document.getElementById('countModified').textContent = c.modified;
  document.getElementById('countOnlyP1').textContent = c.only_in_p1;
  document.getElementById('countOnlyP2').textContent = c.only_in_p2;
  document.getElementById('countConflict').textContent = c.conflict;
  document.getElementById('countSame').textContent = c.same;
}

function updateStats() {
  const c = { total: 0, modified: 0, only_in_p1: 0, only_in_p2: 0 };
  state.files.forEach(f => { c.total++; if (f.status === 'modified') c.modified++; if (f.status === 'only_in_p1') c.only_in_p1++; if (f.status === 'only_in_p2') c.only_in_p2++; });
  document.getElementById('statTotal').textContent = c.total;
  document.getElementById('statModified').textContent = c.modified;
  document.getElementById('statAdded').textContent = c.only_in_p1;
  document.getElementById('statRemoved').textContent = c.only_in_p2;
}

// ═══════════════════════════════════════════════
// SYNC + SYNC HISTORY
// ═══════════════════════════════════════════════
function handleSync(from, to) {
  const files = [...state.selectedFiles];
  if (files.length === 0) return;

  const modal = document.getElementById('syncModal');
  const progress = document.getElementById('syncProgress');
  const status = document.getElementById('syncStatus');
  const log = document.getElementById('syncLog');

  modal.style.display = 'flex';
  log.innerHTML = '';
  progress.style.width = '0%';

  let i = 0;
  const interval = setInterval(() => {
    if (i >= files.length) {
      clearInterval(interval);
      progress.style.width = '100%';
      status.textContent = `✅ Sync complete! ${files.length} files synced.`;
      showToast(`Synced ${files.length} files from ${from.toUpperCase()} → ${to.toUpperCase()}`, 'success');

      // Add to sync history
      addToHistory(from, to, files);
      return;
    }

    const pct = Math.round(((i + 1) / files.length) * 100);
    progress.style.width = pct + '%';
    status.textContent = `Syncing ${i + 1} of ${files.length}...`;
    log.innerHTML += `<div>✓ ${files[i]}</div>`;
    log.scrollTop = log.scrollHeight;
    i++;
  }, 300);
}

function addToHistory(from, to, files) {
  const entry = {
    id: Date.now(),
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    files: [...files],
    time: new Date(),
    undone: false,
  };
  state.syncHistory.unshift(entry);
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (state.syncHistory.length === 0) {
    list.innerHTML = `<div class="history-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><p>No sync history yet</p></div>`;
    return;
  }

  list.innerHTML = state.syncHistory.map(entry => {
    const timeStr = entry.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = entry.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fileCount = entry.files.length;
    const fileList = entry.files.slice(0, 3).map(f => f.split('/').pop()).join(', ');
    const more = entry.files.length > 3 ? ` +${entry.files.length - 3} more` : '';

    return `
      <div class="history-item ${entry.undone ? 'history-item--undone' : ''}">
        <div class="history-item__top">
          <span class="history-item__direction">${entry.from} → ${entry.to}</span>
          <span class="history-item__time">${dateStr} ${timeStr}</span>
        </div>
        <div class="history-item__files">${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileList}${more}</div>
        <div class="history-item__actions">
          ${!entry.undone ? `<button class="history-item__btn history-item__btn--undo" onclick="undoSync(${entry.id})">↩ Undo</button>` : '<span style="font-size:10px;color:var(--text-muted)">↩ Undone</span>'}
          <button class="history-item__btn" onclick="viewSyncDetails(${entry.id})">Details</button>
        </div>
      </div>
    `;
  }).join('');
}

function undoSync(id) {
  const entry = state.syncHistory.find(e => e.id === id);
  if (!entry) return;
  entry.undone = true;
  renderHistory();
  showToast(`Undo: restored ${entry.files.length} files from backup`, 'info');
}

function viewSyncDetails(id) {
  const entry = state.syncHistory.find(e => e.id === id);
  if (!entry) return;
  showToast(`Sync ${entry.from} → ${entry.to}: ${entry.files.join(', ')}`, 'info');
}

function quickSync(path) {
  addToHistory('P1', 'P2', [path]);
  showToast(`Synced: ${path} → P2`, 'success');
}

function closeSyncModal() { document.getElementById('syncModal').style.display = 'none'; }

// ═══════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    const isModalOpen = document.getElementById('shortcutsModal').style.display === 'flex' ||
                        document.getElementById('syncModal').style.display === 'flex';

    // Escape — close modals / clear search
    if (e.key === 'Escape') {
      if (document.getElementById('shortcutsModal').style.display === 'flex') {
        toggleShortcutsModal(); return;
      }
      if (document.getElementById('syncModal').style.display === 'flex') {
        closeSyncModal(); return;
      }
      if (isInput && e.target.id === 'searchInput') {
        e.target.value = '';
        handleSearch('');
        e.target.blur();
        return;
      }
    }

    // Don't interfere with input fields (except special combos)
    if (isInput && !e.ctrlKey && !e.metaKey) return;
    if (isModalOpen && e.key !== 'Escape') return;

    // Ctrl+Enter — Compare
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault(); handleCompare(); return;
    }

    // Ctrl+R — Refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault(); handleRefresh(); return;
    }

    // Ctrl+F — Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
      return;
    }

    // Ctrl+A — Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isInput) {
      e.preventDefault();
      const all = state.selectedFiles.size === state.filteredFiles.length;
      toggleSelectAll(!all);
      return;
    }

    // Ctrl+1 — List view
    if ((e.ctrlKey || e.metaKey) && e.key === '1') { e.preventDefault(); setViewMode('flat'); return; }

    // Ctrl+2 — Tree view
    if ((e.ctrlKey || e.metaKey) && e.key === '2') { e.preventDefault(); setViewMode('tree'); return; }

    // Ctrl+B — Toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); return; }

    // ? — Show shortcuts (only when not typing)
    if (e.key === '?' && !isInput) { toggleShortcutsModal(); return; }

    // Arrow keys — Navigate files
    if (!isInput && state.compared && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      navigateFiles(e.key === 'ArrowUp' ? -1 : 1);
      return;
    }

    // Enter — Open diff for focused file
    if (e.key === 'Enter' && !isInput && !e.ctrlKey && state.activeFile) {
      showDiff(state.activeFile);
      return;
    }

    // Space — Toggle selection for focused file
    if (e.key === ' ' && !isInput && state.activeFile) {
      e.preventDefault();
      const isSelected = state.selectedFiles.has(state.activeFile);
      toggleFileSelect(state.activeFile, !isSelected);
      return;
    }
  });
}

function navigateFiles(direction) {
  if (state.filteredFiles.length === 0) return;

  let newIndex = state.activeFileIndex + direction;
  if (newIndex < 0) newIndex = state.filteredFiles.length - 1;
  if (newIndex >= state.filteredFiles.length) newIndex = 0;

  const file = state.filteredFiles[newIndex];
  selectFile(file.relativePath);

  // Scroll into view
  const row = document.querySelector(`[data-path="${file.relativePath}"]`);
  if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function toggleShortcutsModal() {
  const modal = document.getElementById('shortcutsModal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  state.sidebarCollapsed = !state.sidebarCollapsed;
  sidebar.classList.toggle('sidebar--collapsed', state.sidebarCollapsed);
}

// ═══════════════════════════════════════════════
// CONFIG EDITOR
// ═══════════════════════════════════════════════
function initConfigEditor() {
  const textarea = document.getElementById('configTextarea');
  textarea.value = JSON.stringify(state.config, null, 2);
}

function saveConfig() {
  const textarea = document.getElementById('configTextarea');
  try {
    state.config = JSON.parse(textarea.value);
    showToast('Config saved successfully!', 'success');
  } catch (e) {
    showToast('Invalid JSON! Please fix syntax errors.', 'error');
  }
}

function resetConfig() {
  state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  document.getElementById('configTextarea').value = JSON.stringify(state.config, null, 2);
  showToast('Config reset to defaults', 'info');
}

// ═══════════════════════════════════════════════
// SIDEBAR TABS
// ═══════════════════════════════════════════════
function switchSidebarTab(tab, btn) {
  // Update tab buttons
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('sidebar-tab--active'));
  btn.classList.add('sidebar-tab--active');

  // Update tab content
  document.querySelectorAll('.sidebar-tab-content').forEach(c => c.classList.remove('sidebar-tab-content--active'));
  const contentMap = { projects: 'tabProjects', config: 'tabConfig', history: 'tabHistory' };
  document.getElementById(contentMap[tab]).classList.add('sidebar-tab-content--active');
}

// ═══════════════════════════════════════════════
// FILE PREVIEW ON HOVER
// ═══════════════════════════════════════════════
function initFilePreview() {
  let hoverTimer = null;
  const preview = document.getElementById('filePreview');

  document.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.file-row, .tree-file');
    if (!row || !row.dataset.path) return;

    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const path = row.dataset.path;
      const file = state.files.find(f => f.relativePath === path);
      if (!file || file.status === 'same') return;

      showFilePreview(path, file, row);
    }, 600); // 600ms delay
  });

  document.addEventListener('mouseout', (e) => {
    const row = e.target.closest('.file-row, .tree-file');
    if (row) {
      clearTimeout(hoverTimer);
      hideFilePreview();
    }
  });
}

function showFilePreview(path, file, anchorEl) {
  const preview = document.getElementById('filePreview');
  const nameEl = document.getElementById('previewFileName');
  const badgeEl = document.getElementById('previewBadge');
  const codeEl = document.getElementById('previewCode');

  nameEl.textContent = path.split('/').pop();

  // Set badge
  badgeEl.textContent = formatStatus(file.status);
  badgeEl.style.background = `var(--color-${file.status.replace('only_in_', 'only-')}-bg, var(--color-same-bg))`;
  badgeEl.style.color = `var(--color-${file.status.replace('only_in_', 'only-')}, var(--color-same))`;

  // Use status-specific colors correctly
  const statusColors = {
    modified: { bg: 'var(--color-modified-bg)', color: 'var(--color-modified)' },
    only_in_p1: { bg: 'var(--color-only-p1-bg)', color: 'var(--color-only-p1)' },
    only_in_p2: { bg: 'var(--color-only-p2-bg)', color: 'var(--color-only-p2)' },
    conflict: { bg: 'var(--color-conflict-bg)', color: 'var(--color-conflict)' },
  };
  const sc = statusColors[file.status] || {};
  badgeEl.style.background = sc.bg || 'var(--bg-elevated)';
  badgeEl.style.color = sc.color || 'var(--text-muted)';

  // Generate preview code lines
  const diff = MOCK_DIFF[path];
  if (diff) {
    const lines = diff.p1.slice(0, 12);
    codeEl.innerHTML = lines.map(l => {
      let cls = 'file-preview__line';
      if (l.type === 'add') cls += ' file-preview__line--add';
      else if (l.type === 'remove') cls += ' file-preview__line--remove';
      return `<div class="${cls}">${escapeHtml(l.content)}</div>`;
    }).join('');
  } else {
    const template = getTemplateForFile(path, 'p1', file.status);
    codeEl.innerHTML = template.map(l => {
      let cls = 'file-preview__line';
      if (l.type === 'add') cls += ' file-preview__line--add';
      else if (l.type === 'remove') cls += ' file-preview__line--remove';
      return `<div class="${cls}">${escapeHtml(l.content)}</div>`;
    }).join('');
  }

  // Position the preview next to the row
  const rect = anchorEl.getBoundingClientRect();
  let top = rect.top;
  let left = rect.right + 8;

  // Ensure within viewport
  if (left + 380 > window.innerWidth) left = rect.left - 388;
  if (top + 280 > window.innerHeight) top = window.innerHeight - 290;
  if (top < 0) top = 8;

  preview.style.top = top + 'px';
  preview.style.left = left + 'px';
  preview.style.display = 'block';
}

function hideFilePreview() {
  document.getElementById('filePreview').style.display = 'none';
}

// ─── Refresh ─────────────────────────────────────
function handleRefresh() {
  if (state.compared) { showToast('Refreshing comparison...', 'info'); runCompare(); }
}

// ─── Toasts ──────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Resize Handles ──────────────────────────────
function initResizeHandles() {
  initResize('sidebarResize', 'sidebar', 'width', 220, 400);
  initResize('diffResize', 'diffPanel', 'width', 320, 900, true);
}

function initResize(handleId, panelId, prop, min, max, reverse = false) {
  const handle = document.getElementById(handleId);
  const panel = document.getElementById(panelId);
  let startX, startSize;
  handle.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startSize = panel.getBoundingClientRect().width;
    handle.classList.add('resize-handle--active');
    const onMouseMove = (e) => {
      const diff = e.clientX - startX;
      const newSize = reverse ? startSize - diff : startSize + diff;
      if (newSize >= min && newSize <= max) panel.style.width = newSize + 'px';
    };
    const onMouseUp = () => {
      handle.classList.remove('resize-handle--active');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

// ─── Misc ────────────────────────────────────────
function toggleDiffMode() { showToast('Toggle: Unified / Split view', 'info'); }

function loadRecent(index) {
  const projects = [
    { p1: 'D:\\projects\\hifunnel-dashboard', p2: 'D:\\projects\\atlas-frontend' },
    { p1: 'D:\\projects\\atlas-frontend', p2: 'D:\\projects\\atlas-mobile' },
  ];
  const p = projects[index];
  state.p1Path = p.p1;
  state.p2Path = p.p2;
  document.getElementById('p1PathText').textContent = p.p1;
  document.getElementById('p2PathText').textContent = p.p2;
  document.getElementById('p1Path').classList.add('path-input--active');
  document.getElementById('p2Path').classList.add('path-input--active');
  showToast('Project pair loaded from recent', 'info');
}

function updateClock() {
  const now = new Date();
  document.getElementById('statusBarTime').textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

// ═════════════════════════════════════════════
// SCOPE SELECTOR (Load Project → Scan → Select → Save)
// ═════════════════════════════════════════════

// Mock: all possible files from scanning both projects
const ALL_PROJECT_FILES = [
  'src/components/Button/Button.tsx',
  'src/components/Button/Button.module.scss',
  'src/components/Button/Button.test.tsx',
  'src/components/Modal/Modal.tsx',
  'src/components/Modal/Modal.module.scss',
  'src/components/Card/Card.tsx',
  'src/components/Card/Card.module.scss',
  'src/hooks/useAuth.ts',
  'src/hooks/useDebounce.ts',
  'src/hooks/useMediaQuery.ts',
  'src/hooks/useTheme.ts',
  'src/hooks/useLocalStorage.ts',
  'src/utils/format.ts',
  'src/utils/cn.ts',
  'src/utils/api-client.ts',
  'src/utils/validators.ts',
  'src/types/user.ts',
  'src/types/common.ts',
  'src/types/api.ts',
  'src/services/auth.service.ts',
  'src/services/user.service.ts',
  'src/services/notification.service.ts',
  'src/services/api.service.ts',
  'src/layouts/MainLayout.tsx',
  'src/layouts/AuthLayout.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Login.tsx',
  'src/pages/Profile.tsx',
  'src/constants/routes.ts',
  'src/constants/config.ts',
  'src/constants/theme.ts',
  'src/store/auth.store.ts',
  'src/store/ui.store.ts',
  'src/store/user.store.ts',
  'src/assets/logo.svg',
  'src/assets/icons/arrow.svg',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  '.eslintrc.js',
];

function handleLoadProject() {
  // Auto-select folders if not selected yet
  if (!state.p1Path || !state.p2Path) {
    selectFolder('p1');
    setTimeout(() => {
      selectFolder('p2');
      setTimeout(() => performScan(), 400);
    }, 300);
    return;
  }
  performScan();
}

function performScan() {
  const btn = document.getElementById('btnLoadProject');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Scanning...';

  setTimeout(() => {
    // "Scan complete" — store all files
    state.allScannedFiles = [...ALL_PROJECT_FILES];
    state.projectLoaded = true;

    // Default: all selected
    state.scopeSelectedPaths = new Set(ALL_PROJECT_FILES);

    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Load Project`;

    showToast(`Scanned ${ALL_PROJECT_FILES.length} files from both projects`, 'success');

    // Open scope selector modal
    openScopeSelector();
  }, 1000);
}

function openScopeSelector() {
  if (!state.projectLoaded) {
    showToast('Please load projects first', 'error');
    return;
  }
  document.getElementById('scopeModal').style.display = 'flex';
  document.getElementById('scopeSearchInput').value = '';
  renderScopeTree(state.allScannedFiles);
  updateScopeCounter();
}

function closeScopeSelector() {
  document.getElementById('scopeModal').style.display = 'none';
}

function renderScopeTree(files, filter = '') {
  const tree = {};
  const filteredFiles = filter
    ? files.filter(f => f.toLowerCase().includes(filter.toLowerCase()))
    : files;

  // Build tree structure
  filteredFiles.forEach(path => {
    const parts = path.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        if (!current.__files__) current.__files__ = [];
        current.__files__.push(path);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });

  document.getElementById('scopeTree').innerHTML = renderScopeNode(tree, 0);
}

function renderScopeNode(node, depth) {
  let html = '';

  // Folders first
  const folders = Object.keys(node).filter(k => k !== '__files__').sort();
  folders.forEach(folder => {
    const folderFiles = getAllFilesInNode(node[folder]);
    const allChecked = folderFiles.every(f => state.scopeSelectedPaths.has(f));
    const someChecked = folderFiles.some(f => state.scopeSelectedPaths.has(f));
    const id = `scope_${depth}_${folder}`;

    html += `
      <div class="scope-node">
        <div class="scope-folder-row" style="padding-left:${8 + depth * 20}px">
          <svg class="scope-folder-chevron scope-folder-chevron--open" id="schev_${id}"
               onclick="toggleScopeFolder('${id}')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <input type="checkbox" ${allChecked ? 'checked' : ''} ${!allChecked && someChecked ? 'class="indeterminate"' : ''}
                 onchange="toggleScopeFolder_check('${id}', this.checked)"
                 data-scope-folder="${id}" />
          <label class="scope-folder-label" onclick="toggleScopeFolder('${id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            ${folder}
          </label>
          <span class="scope-folder-count">${folderFiles.filter(f => state.scopeSelectedPaths.has(f)).length}/${folderFiles.length}</span>
        </div>
        <div class="scope-children" id="${id}" data-files='${JSON.stringify(folderFiles)}'>
          ${renderScopeNode(node[folder], depth + 1)}
        </div>
      </div>
    `;
  });

  // Files
  if (node.__files__) {
    node.__files__.forEach(path => {
      const fileName = path.split('/').pop();
      const checked = state.scopeSelectedPaths.has(path);
      html += `
        <div class="scope-file-row" style="padding-left:${8 + (depth) * 20 + 20}px">
          <input type="checkbox" ${checked ? 'checked' : ''}
                 onchange="toggleScopeFile('${path}', this.checked)" data-scope-path="${path}" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          ${fileName}
        </div>
      `;
    });
  }

  return html;
}

function getAllFilesInNode(node) {
  let files = [];
  if (node.__files__) files.push(...node.__files__);
  Object.keys(node).filter(k => k !== '__files__').forEach(k => {
    files.push(...getAllFilesInNode(node[k]));
  });
  return files;
}

function toggleScopeFolder(id) {
  const el = document.getElementById(id);
  const chevron = document.getElementById('schev_' + id);
  el.classList.toggle('scope-children--collapsed');
  chevron.classList.toggle('scope-folder-chevron--open');
}

function toggleScopeFolder_check(id, checked) {
  const el = document.getElementById(id);
  const files = JSON.parse(el.getAttribute('data-files') || '[]');
  files.forEach(f => {
    if (checked) state.scopeSelectedPaths.add(f);
    else state.scopeSelectedPaths.delete(f);
  });
  // Re-render to update nested checkboxes
  renderScopeTree(state.allScannedFiles, document.getElementById('scopeSearchInput').value);
  updateScopeCounter();
}

function toggleScopeFile(path, checked) {
  if (checked) state.scopeSelectedPaths.add(path);
  else state.scopeSelectedPaths.delete(path);
  // Update parent folder checkboxes
  renderScopeTree(state.allScannedFiles, document.getElementById('scopeSearchInput').value);
  updateScopeCounter();
}

function scopeSelectAll() {
  state.allScannedFiles.forEach(f => state.scopeSelectedPaths.add(f));
  renderScopeTree(state.allScannedFiles, document.getElementById('scopeSearchInput').value);
  updateScopeCounter();
}

function scopeDeselectAll() {
  state.scopeSelectedPaths.clear();
  renderScopeTree(state.allScannedFiles, document.getElementById('scopeSearchInput').value);
  updateScopeCounter();
}

function handleScopeSearch(value) {
  renderScopeTree(state.allScannedFiles, value);
}

function updateScopeCounter() {
  const total = state.allScannedFiles.length;
  const selected = state.scopeSelectedPaths.size;
  document.getElementById('scopeCounter').textContent = `${selected} / ${total} selected`;
}

function saveScopeSelection() {
  // Persist to config
  state.config.selectedPaths = [...state.scopeSelectedPaths];

  // Update config editor textarea
  const textarea = document.getElementById('configTextarea');
  textarea.value = JSON.stringify(state.config, null, 2);

  // Show scope info badge
  const scopeInfo = document.getElementById('scopeInfo');
  const scopeText = document.getElementById('scopeInfoText');
  scopeInfo.style.display = 'flex';

  const total = state.allScannedFiles.length;
  const selected = state.scopeSelectedPaths.size;
  if (selected === total) {
    scopeText.textContent = `All ${total} files selected`;
  } else {
    scopeText.textContent = `${selected} of ${total} files selected`;
  }

  closeScopeSelector();
  showToast(`Scope saved: ${selected} files selected for comparison`, 'success');
}
