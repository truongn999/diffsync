import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../../../shared/ipc-channels'
import { loadHistory, removeHistoryEntry } from '../../services/history'
import { restoreBackup } from '../../services/backup'
import { loadRecentProjects, addRecentProject, removeRecentProject } from '../../services/recentProjects'
import { startWatching, stopWatching } from '../../services/watcher'
import { generateReport } from '../../services/reportGenerator'

export function registerAppHandlers(): void {
  // ─── History ─────────────────────────────────
  ipcMain.handle(IPC.GET_HISTORY, async () => {
    return loadHistory()
  })

  ipcMain.handle(IPC.UNDO_SYNC, async (_event, entryId: number) => {
    const entry = await removeHistoryEntry(entryId)
    if (!entry) return false

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

  // ─── File Watcher ─────────────────────────────
  ipcMain.handle(IPC.START_WATCHING, async (event, p1Path: string, p2Path: string, ignore: string[]) => {
    const win = BrowserWindow.fromWebContents(event.sender)
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
}
