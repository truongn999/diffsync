import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import type { SyncConfig, SyncParams } from '../../shared/types'
import { scanProject, filterByScope } from '../services/scanner'
import { compareFiles } from '../services/comparator'
import { generateDiff } from '../services/differ'
import { syncFiles } from '../services/syncer'
import { loadConfig, saveConfig } from '../services/config'
import { loadHistory, addHistoryEntry, removeHistoryEntry } from '../services/history'
import { loadManifest, updateManifestAfterSync } from '../services/manifest'
import { restoreBackup } from '../services/backup'

export function registerIpcHandlers(): void {
  // ─── Select Folder ───────────────────────────
  ipcMain.handle(IPC.SELECT_FOLDER, async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select Project Folder'
    })

    return result.canceled ? null : result.filePaths[0]
  })

  // ─── Scan Project ────────────────────────────
  ipcMain.handle(IPC.SCAN_PROJECT, async (_event, rootPath: string, config: SyncConfig) => {
    const result = await scanProject(rootPath, config)
    // Convert Map to array for IPC serialization
    return Array.from(result.files.values())
  })

  // ─── Compare Projects ────────────────────────
  ipcMain.handle(IPC.COMPARE_PROJECTS, async (_event, p1Root: string, p2Root: string, config: SyncConfig) => {
    const [scan1, scan2] = await Promise.all([
      scanProject(p1Root, config),
      scanProject(p2Root, config)
    ])

    // Filter by scope (selectedPaths)
    const p1Filtered = filterByScope(scan1.files, config.selectedPaths)
    const p2Filtered = filterByScope(scan2.files, config.selectedPaths)

    // Load manifest for conflict detection
    const manifest = await loadManifest(p1Root)

    return compareFiles(p1Filtered, p2Filtered, manifest)
  })

  // ─── Get Diff ────────────────────────────────
  ipcMain.handle(IPC.GET_DIFF, async (_event, p1Root: string, p2Root: string, relativePath: string) => {
    return generateDiff(p1Root, p2Root, relativePath)
  })

  // ─── Sync Files ──────────────────────────────
  ipcMain.handle(IPC.SYNC_FILES, async (event, params: SyncParams, config: SyncConfig) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    const result = await syncFiles(params, config, (current, total, file) => {
      win?.webContents.send(IPC.SYNC_PROGRESS, { current, total, file })
    })

    // Update manifest after successful sync
    if (result.syncedFiles.length > 0) {
      const [scan1, scan2] = await Promise.all([
        scanProject(params.p1Root, config),
        scanProject(params.p2Root, config)
      ])

      const p1Hashes = new Map<string, string>()
      const p2Hashes = new Map<string, string>()
      scan1.files.forEach((f, k) => p1Hashes.set(k, f.hash))
      scan2.files.forEach((f, k) => p2Hashes.set(k, f.hash))

      await updateManifestAfterSync(params.p1Root, result.syncedFiles, p1Hashes, p2Hashes)

      // Add to history
      await addHistoryEntry({
        from: `${params.from === 'p1' ? 'P1' : 'P2'} → ${params.to === 'p1' ? 'P1' : 'P2'}`,
        to: params.to === 'p1' ? params.p1Root : params.p2Root,
        files: result.syncedFiles,
        timestamp: new Date().toISOString(),
        backupPaths: result.backupPaths
      })
    }

    return result
  })

  // ─── Config ──────────────────────────────────
  ipcMain.handle(IPC.LOAD_CONFIG, async (_event, projectRoot: string) => {
    return loadConfig(projectRoot)
  })

  ipcMain.handle(IPC.SAVE_CONFIG, async (_event, projectRoot: string, config: SyncConfig) => {
    await saveConfig(projectRoot, config)
  })

  // ─── History ─────────────────────────────────
  ipcMain.handle(IPC.GET_HISTORY, async () => {
    return loadHistory()
  })

  ipcMain.handle(IPC.UNDO_SYNC, async (_event, entryId: number) => {
    const entry = await removeHistoryEntry(entryId)
    if (!entry) return false

    // Restore backed-up files
    try {
      for (let i = 0; i < entry.backupPaths.length; i++) {
        const backupPath = entry.backupPaths[i]
        const relativePath = entry.files[i]
        if (backupPath && relativePath) {
          await restoreBackup(backupPath, entry.to, relativePath)
        }
      }
      return true
    } catch {
      return false
    }
  })
}
