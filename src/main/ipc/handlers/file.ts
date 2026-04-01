import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../../../shared/ipc-channels'
import type { SyncConfig } from '../../../shared/types'
import { scanProject, filterByScope } from '../../services/scanner'
import { compareFiles } from '../../services/comparator'
import { generateDiff } from '../../services/differ'
import { loadManifest, saveManifest } from '../../services/manifest'
import * as fs from 'fs'
import * as path from 'path'

export function registerFileHandlers(): void {
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
    return Array.from(result.files.values())
  })

  // ─── Compare Projects ────────────────────────
  ipcMain.handle(IPC.COMPARE_PROJECTS, async (_event, p1Root: string, p2Root: string, config: SyncConfig) => {
    const win = BrowserWindow.getFocusedWindow()
    const sendProgress = (phase: string, current: number, total: number) => {
      win?.webContents.send(IPC.COMPARE_PROGRESS, { phase, current, total })
    }

    sendProgress('scanning-p1', 0, 1)
    const scan1 = await scanProject(p1Root, config)
    sendProgress('scanning-p1', 1, 1)

    sendProgress('scanning-p2', 0, 1)
    const scan2 = await scanProject(p2Root, config)
    sendProgress('scanning-p2', 1, 1)

    const p1Filtered = filterByScope(scan1.files, config.selectedPaths)
    const p2Filtered = filterByScope(scan2.files, config.selectedPaths)

    sendProgress('comparing', 0, 1)
    const manifest = await loadManifest(p1Root, p2Root)
    const result = compareFiles(p1Filtered, p2Filtered, manifest)
    sendProgress('comparing', 1, 1)

    if (Object.keys(result.newManifestEntries).length > 0) {
      Object.assign(manifest.files, result.newManifestEntries)
      await saveManifest(p1Root, p2Root, manifest)
    }

    return result
  })

  // ─── Get Diff ────────────────────────────────
  ipcMain.handle(IPC.GET_DIFF, async (_event, p1Root: string, p2Root: string, relativePath: string) => {
    return generateDiff(p1Root, p2Root, relativePath)
  })

  // ─── File Content ─────────────────────────────
  ipcMain.handle(IPC.GET_FILE_CONTENT, async (_event, rootPath: string, relativePath: string) => {
    const fullPath = path.join(rootPath, relativePath)
    try {
      return await fs.promises.readFile(fullPath, 'utf-8')
    } catch {
      return ''
    }
  })

  ipcMain.handle(IPC.GET_FILE_BASE64, async (_event, rootPath: string, relativePath: string) => {
    const fullPath = path.join(rootPath, relativePath)
    try {
      const buffer = await fs.promises.readFile(fullPath)
      const ext = path.extname(relativePath).slice(1).toLowerCase()
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
        ico: 'image/x-icon', bmp: 'image/bmp', avif: 'image/avif'
      }
      const mime = mimeMap[ext] || 'application/octet-stream'
      return `data:${mime};base64,${buffer.toString('base64')}`
    } catch {
      return ''
    }
  })
}
