// ─── File Info ────────────────────────────────
export interface FileInfo {
  relativePath: string
  hash: string
  mtime: number
  size: number
}

// ─── Comparison ──────────────────────────────
export type FileStatus = 'same' | 'modified' | 'only_in_p1' | 'only_in_p2' | 'conflict'

export interface CompareItem {
  relativePath: string
  status: FileStatus
  p1: FileInfo | null
  p2: FileInfo | null
}

export interface CompareResult {
  items: CompareItem[]
  stats: {
    total: number
    modified: number
    only_in_p1: number
    only_in_p2: number
    same: number
    conflict: number
  }
  /** New manifest entries created during first compare (baseline snapshot) */
  newManifestEntries: Record<string, ManifestEntry>
}

// ─── Diff ────────────────────────────────────
export type DiffLineType = 'normal' | 'add' | 'remove' | 'empty'

export interface DiffLine {
  num: number
  content: string
  type: DiffLineType
}

export interface DiffResult {
  relativePath: string
  p1Content: string
  p2Content: string
  p1Lines: DiffLine[]
  p2Lines: DiffLine[]
  stats: {
    additions: number
    deletions: number
  }
}

// ─── Sync ────────────────────────────────────
export interface SyncParams {
  from: 'p1' | 'p2'
  to: 'p1' | 'p2'
  files: string[]
  p1Root: string
  p2Root: string
}

export interface SyncResult {
  success: boolean
  syncedFiles: string[]
  failedFiles: { path: string; error: string }[]
  backupPaths: string[]
}

// ─── Config ──────────────────────────────────
export interface SyncConfig {
  groups: { name: string; paths: string[] }[]
  ignore: string[]
  extensions: string[]
  backup: {
    enabled: boolean
    directory: string
  }
  selectedPaths: string[]
}

// ─── History ─────────────────────────────────
export interface SyncHistoryEntry {
  id: number
  from: string
  to: string
  files: string[]
  timestamp: string
  backupPaths: string[]
}

// ─── Recent Projects ─────────────────────────
export interface RecentProject {
  id: number
  p1Path: string
  p2Path: string
  name: string
  lastUsed: string
}

// ─── Manifest ────────────────────────────────
export interface ManifestEntry {
  lastSyncHashP1: string
  lastSyncHashP2: string
}

export interface Manifest {
  files: Record<string, ManifestEntry>
}

// ─── Scan ────────────────────────────────────
export interface ScanResult {
  files: Map<string, FileInfo>
  totalScanned: number
  duration: number
}

// ─── IPC API (exposed to renderer) ──────────
export interface ElectronAPI {
  selectFolder(): Promise<string | null>
  scanProject(rootPath: string, config: SyncConfig): Promise<FileInfo[]>
  compareProjects(p1Root: string, p2Root: string, config: SyncConfig): Promise<CompareResult>
  getDiff(p1Root: string, p2Root: string, relativePath: string): Promise<DiffResult>
  syncFiles(params: SyncParams, config: SyncConfig): Promise<SyncResult>
  loadConfig(p1Root: string, p2Root: string): Promise<SyncConfig>
  saveConfig(p1Root: string, p2Root: string, config: SyncConfig): Promise<void>
  getHistory(): Promise<SyncHistoryEntry[]>
  undoSync(entryId: number): Promise<boolean>
  getRecentProjects(): Promise<RecentProject[]>
  addRecentProject(p1Path: string, p2Path: string): Promise<RecentProject[]>
  removeRecentProject(id: number): Promise<RecentProject[]>
  getFileContent(rootPath: string, relativePath: string): Promise<string>
  startWatching(p1Path: string, p2Path: string, ignore: string[]): Promise<void>
  stopWatching(): Promise<void>
  onFilesChanged(callback: () => void): () => void
  exportReport(p1Path: string, p2Path: string, compareResult: CompareResult): Promise<string | null>
  loadTheme(): Promise<'light' | 'dark'>
  saveTheme(theme: 'light' | 'dark'): Promise<void>
  setTitleBarTheme(theme: 'light' | 'dark'): void
  platform: string
  resolveConflict(p1Root: string, p2Root: string, relativePath: string, action: ResolveAction): Promise<void>
}

export type ResolveAction = 'keep_p1' | 'keep_p2' | 'mark_resolved'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
