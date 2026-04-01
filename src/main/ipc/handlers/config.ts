import * as fs from 'fs'
import * as path from 'path'
import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { IPC } from '../../../shared/ipc-channels'
import type { SyncConfig } from '../../../shared/types'
import { loadConfig, saveConfig } from '../../services/config'

export function registerConfigHandlers(): void {
  // ─── Config ──────────────────────────────────
  ipcMain.handle(IPC.LOAD_CONFIG, async (_event, p1Root: string, p2Root: string) => {
    return loadConfig(p1Root, p2Root)
  })

  ipcMain.handle(IPC.SAVE_CONFIG, async (_event, p1Root: string, p2Root: string, config: SyncConfig) => {
    await saveConfig(p1Root, p2Root, config)
  })

  ipcMain.handle(IPC.EXPORT_CONFIG, async (_event, config: SyncConfig) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      title: 'Export Config',
      defaultPath: 'diffsync-config.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return null
    await fs.promises.writeFile(result.filePath, JSON.stringify(config, null, 2), 'utf-8')
    return result.filePath
  })

  ipcMain.handle(IPC.IMPORT_CONFIG, async (_event) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Import Config',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    try {
      const content = await fs.promises.readFile(result.filePaths[0], 'utf-8')
      return JSON.parse(content) as SyncConfig
    } catch {
      return null
    }
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
