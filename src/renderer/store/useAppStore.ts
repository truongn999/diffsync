import { create } from 'zustand'
import type { CompareItem, CompareResult, DiffResult, SyncConfig, SyncHistoryEntry, FileInfo, FileStatus } from '../../shared/types'

const DEFAULT_CONFIG: SyncConfig = {
  groups: [],
  ignore: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'out/**',
    'release/**',
    '.next/**',
    '.nuxt/**',
    '.env*',
    '*.log',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ],
  extensions: [],
  backup: { enabled: true, directory: 'backup' },
  selectedPaths: []
}

type ViewMode = 'flat' | 'tree'
type SidebarTab = 'projects' | 'config' | 'history'

interface AppState {
  // Project paths
  p1Path: string | null
  p2Path: string | null

  // Loading states
  isComparing: boolean
  isSyncing: boolean
  isScanning: boolean

  // Comparison
  compareResult: CompareResult | null
  currentFilter: FileStatus | 'all'
  searchQuery: string

  // File selection
  selectedFiles: Set<string>
  activeFile: CompareItem | null

  // Diff
  diffResult: DiffResult | null
  isDiffLoading: boolean

  // View
  viewMode: ViewMode
  sidebarTab: SidebarTab
  sidebarCollapsed: boolean

  // Config
  config: SyncConfig

  // Scope
  projectLoaded: boolean
  allScannedFiles: FileInfo[]
  scopeSelectedPaths: Set<string>

  // History
  syncHistory: SyncHistoryEntry[]

  // Toast
  toasts: { id: number; message: string; type: 'success' | 'error' | 'info' }[]

  // Sync progress
  syncProgress: { current: number; total: number; file: string } | null

  // File Watcher
  isWatching: boolean

  // Theme
  theme: 'light' | 'dark'

  // Actions
  setP1Path: (p: string | null) => void
  setP2Path: (p: string | null) => void
  setIsComparing: (v: boolean) => void
  setIsSyncing: (v: boolean) => void
  setIsScanning: (v: boolean) => void
  setCompareResult: (r: CompareResult | null) => void
  setFilter: (f: FileStatus | 'all') => void
  setSearchQuery: (q: string) => void
  toggleFileSelection: (path: string) => void
  selectAllFiles: () => void
  deselectAllFiles: () => void
  setActiveFile: (f: CompareItem | null) => void
  setDiffResult: (d: DiffResult | null) => void
  setIsDiffLoading: (v: boolean) => void
  setViewMode: (m: ViewMode) => void
  setSidebarTab: (t: SidebarTab) => void
  toggleSidebar: () => void
  setConfig: (c: SyncConfig) => void
  setProjectLoaded: (v: boolean) => void
  setAllScannedFiles: (f: FileInfo[]) => void
  setScopeSelectedPaths: (p: Set<string>) => void
  setSyncHistory: (h: SyncHistoryEntry[]) => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: number) => void
  setSyncProgress: (p: { current: number; total: number; file: string } | null) => void
  setIsWatching: (v: boolean) => void
  setTheme: (t: 'light' | 'dark') => void

  // Computed helpers
  getFilteredFiles: () => CompareItem[]
}

let toastId = 0

export const useAppStore = create<AppState>((set, get) => ({
  p1Path: null,
  p2Path: null,
  isComparing: false,
  isSyncing: false,
  isScanning: false,
  compareResult: null,
  currentFilter: 'all',
  searchQuery: '',
  selectedFiles: new Set<string>(),
  activeFile: null,
  diffResult: null,
  isDiffLoading: false,
  viewMode: 'flat',
  sidebarTab: 'projects',
  sidebarCollapsed: false,
  config: { ...DEFAULT_CONFIG },
  projectLoaded: false,
  allScannedFiles: [],
  scopeSelectedPaths: new Set<string>(),
  syncHistory: [],
  toasts: [],
  syncProgress: null,
  isWatching: false,
  theme: 'dark',

  setP1Path: (p) => set({ p1Path: p }),
  setP2Path: (p) => set({ p2Path: p }),
  setIsComparing: (v) => set({ isComparing: v }),
  setIsSyncing: (v) => set({ isSyncing: v }),
  setIsScanning: (v) => set({ isScanning: v }),
  setCompareResult: (r) => {
    // Auto-select the most relevant filter tab after compare
    let bestFilter: FileStatus | 'all' = 'all'
    if (r) {
      const { stats } = r
      if (stats.conflict > 0) bestFilter = 'conflict'
      else if (stats.modified > 0) bestFilter = 'modified'
      else if (stats.only_in_p1 > 0) bestFilter = 'only_in_p1'
      else if (stats.only_in_p2 > 0) bestFilter = 'only_in_p2'
    }
    set({ compareResult: r, currentFilter: bestFilter })
  },
  setFilter: (f) => set({ currentFilter: f }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleFileSelection: (path) => set((state) => {
    const next = new Set(state.selectedFiles)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return { selectedFiles: next }
  }),
  selectAllFiles: () => set((state) => {
    const files = get().getFilteredFiles()
    return { selectedFiles: new Set(files.map(f => f.relativePath)) }
  }),
  deselectAllFiles: () => set({ selectedFiles: new Set() }),
  setActiveFile: (f) => set({ activeFile: f }),
  setDiffResult: (d) => set({ diffResult: d }),
  setIsDiffLoading: (v) => set({ isDiffLoading: v }),
  setViewMode: (m) => set({ viewMode: m }),
  setSidebarTab: (t) => set({ sidebarTab: t }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setConfig: (c) => set({ config: c }),
  setProjectLoaded: (v) => set({ projectLoaded: v }),
  setAllScannedFiles: (f) => set({ allScannedFiles: f }),
  setScopeSelectedPaths: (p) => set({ scopeSelectedPaths: p }),
  setSyncHistory: (h) => set({ syncHistory: h }),
  addToast: (message, type) => {
    const id = ++toastId
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3500)
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  setSyncProgress: (p) => set({ syncProgress: p }),
  setIsWatching: (v) => set({ isWatching: v }),
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
    window.electronAPI.saveTheme(t)
    window.electronAPI.setTitleBarTheme(t)
  },

  getFilteredFiles: () => {
    const { compareResult, currentFilter, searchQuery } = get()
    if (!compareResult) return []

    let files = compareResult.items
    if (currentFilter !== 'all') {
      files = files.filter(f => f.status === currentFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      files = files.filter(f => f.relativePath.toLowerCase().includes(q))
    }
    return files
  }
}))
