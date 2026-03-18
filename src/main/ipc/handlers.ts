import * as fs from 'fs'
import * as path from 'path'
import { ipcMain, dialog, BrowserWindow, app } from 'electron'
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
import { loadRecentProjects, addRecentProject, removeRecentProject } from '../services/recentProjects'
import { startWatching, stopWatching } from '../services/watcher'
import { generateReport } from '../services/reportGenerator'

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
    const manifest = await loadManifest(p1Root, p2Root)

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

      await updateManifestAfterSync(params.p1Root, params.p2Root, result.syncedFiles, p1Hashes, p2Hashes)

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
  ipcMain.handle(IPC.LOAD_CONFIG, async (_event, p1Root: string, p2Root: string) => {
    return loadConfig(p1Root, p2Root)
  })

  ipcMain.handle(IPC.SAVE_CONFIG, async (_event, p1Root: string, p2Root: string, config: SyncConfig) => {
    await saveConfig(p1Root, p2Root, config)
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

  // ─── Recent Projects ──────────────────────────
  ipcMain.handle(IPC.GET_RECENT_PROJECTS, async () => {
    return loadRecentProjects()
  })

  ipcMain.handle(IPC.ADD_RECENT_PROJECT, async (_event, p1Path: string, p2Path: string) => {
    return addRecentProject(p1Path, p2Path)
  })

  ipcMain.handle(IPC.REMOVE_RECENT_PROJECT, async (_event, id: number) => {
    return removeRecentProject(id)
  })

  // ─── File Content ─────────────────────────────
  ipcMain.handle(IPC.GET_FILE_CONTENT, async (_event, rootPath: string, relativePath: string) => {
    const fs = await import('fs')
    const path = await import('path')
    const fullPath = path.join(rootPath, relativePath)
    try {
      return await fs.promises.readFile(fullPath, 'utf-8')
    } catch {
      return ''
    }
  })

  // ─── File Watcher ─────────────────────────────
  ipcMain.handle(IPC.START_WATCHING, async (_event, p1Path: string, p2Path: string, ignore: string[]) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) startWatching(p1Path, p2Path, ignore, win)
  })

  ipcMain.handle(IPC.STOP_WATCHING, async () => {
    stopWatching()
  })

  // ─── Export Report ────────────────────────────
  ipcMain.handle(IPC.EXPORT_REPORT, async (_event, p1Path: string, p2Path: string, compareResult: any) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      title: 'Export Diff Report',
      defaultPath: `diff-report-${Date.now()}.html`,
      filters: [{ name: 'HTML', extensions: ['html'] }]
    })

    if (result.canceled || !result.filePath) return null

    await generateReport(p1Path, p2Path, compareResult, result.filePath)
    return result.filePath
  })

  // ─── Theme ──────────────────────────────────
  const themePath = path.join(app.getPath('userData'), 'theme.json')

  ipcMain.handle(IPC.LOAD_THEME, async () => {
    try {
      const content = await fs.promises.readFile(themePath, 'utf-8')
      const { theme } = JSON.parse(content)
      return theme === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  ipcMain.handle(IPC.SAVE_THEME, async (_event, theme: string) => {
    await fs.promises.writeFile(themePath, JSON.stringify({ theme }), 'utf-8')
  })
}
