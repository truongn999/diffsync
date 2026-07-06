import { create } from 'zustand'
import type { CompareItem, CompareResult, DiffResult, SyncConfig, SyncHistoryEntry, FileInfo, FileStatus } from '../../shared/types'
import { DEFAULT_CONFIG } from './constants'
import type { ViewMode, SidebarTab } from './constants'

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

  // Compare progress
  compareProgress: { phase: string; current: number; total: number } | null

  // File Watcher
  isWatching: boolean

  // Theme
  theme: 'light' | 'dark'

  // Diff stats cache (per file path → { additions, deletions })
  diffStatsCache: Map<string, { additions: number; deletions: number }>

  // Preload cache for adjacent file contents
  preloadCache: Map<string, { p1Content: string; p2Content: string }>

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
  setCompareProgress: (p: { phase: string; current: number; total: number } | null) => void
  setIsWatching: (v: boolean) => void
  setTheme: (t: 'light' | 'dark') => void
  navigateFile: (direction: -1 | 1) => void
  setDiffStatsCache: (cache: Map<string, { additions: number; deletions: number }>) => void
  updateDiffStat: (path: string, stat: { additions: number; deletions: number }) => void
  setPreloadCache: (cache: Map<string, { p1Content: string; p2Content: string }>) => void
  updatePreloadEntry: (path: string, entry: { p1Content: string; p2Content: string }) => void

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
  compareProgress: null,
  isWatching: false,
  theme: 'dark',
  diffStatsCache: new Map(),
  preloadCache: new Map(),

  setP1Path: (p) => set({ p1Path: p }),
  setP2Path: (p) => set({ p2Path: p }),
  setIsComparing: (v) => set({ isComparing: v }),
  setIsSyncing: (v) => set({ isSyncing: v }),
  setIsScanning: (v) => set({ isScanning: v }),
  setCompareResult: (r) => {
    const current = get().selectedFiles
    if (r) {
      const validPaths = new Set(r.items.filter(f => f.status !== 'same').map(f => f.relativePath))
      // Keep only selections that still exist and are non-same
      const kept = new Set([...current].filter(p => validPaths.has(p)))
      set({ compareResult: r, currentFilter: 'all', selectedFiles: kept, diffStatsCache: new Map(), preloadCache: new Map() })
    } else {
      set({ compareResult: r, currentFilter: 'all', selectedFiles: new Set(), diffStatsCache: new Map(), preloadCache: new Map() })
    }
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
  setCompareProgress: (p) => set({ compareProgress: p }),
  setIsWatching: (v) => set({ isWatching: v }),
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
    window.electronAPI.saveTheme(t)
    window.electronAPI.setTitleBarTheme(t)
  },

  navigateFile: (direction) => {
    const files = get().getFilteredFiles()
    if (files.length === 0) return
    const currentIndex = files.findIndex(f => f.relativePath === get().activeFile?.relativePath)
    const nextIndex = currentIndex === -1
      ? 0
      : Math.max(0, Math.min(files.length - 1, currentIndex + direction))
    const nextFile = files[nextIndex]
    if (nextFile.relativePath !== get().activeFile?.relativePath) {
      set({ activeFile: nextFile })
    }
  },

  setDiffStatsCache: (cache) => set({ diffStatsCache: cache }),
  updateDiffStat: (path, stat) => set((state) => {
    const next = new Map(state.diffStatsCache)
    next.set(path, stat)
    return { diffStatsCache: next }
  }),
  setPreloadCache: (cache) => set({ preloadCache: cache }),
  updatePreloadEntry: (path, entry) => set((state) => {
    const next = new Map(state.preloadCache)
    next.set(path, entry)
    // Keep cache small — max 5 entries
    if (next.size > 5) {
      const firstKey = next.keys().next().value
      if (firstKey) next.delete(firstKey)
    }
    return { preloadCache: next }
  }),

  getFilteredFiles: () => {
    const { compareResult, currentFilter, searchQuery } = get()
    if (!compareResult) return []

    let files = compareResult.items
    if (currentFilter === 'all') {
      files = files.filter(f => f.status !== 'same')
    } else {
      files = files.filter(f => f.status === currentFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      files = files.filter(f => f.relativePath.toLowerCase().includes(q))
    }
    return files
  }
}))
