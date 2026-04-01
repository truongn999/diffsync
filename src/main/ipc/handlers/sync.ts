import * as fs from 'fs'
import * as path from 'path'
import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../../../shared/ipc-channels'
import type { SyncConfig, SyncParams } from '../../../shared/types'
import { syncFiles } from '../../services/syncer'
import { scanProject } from '../../services/scanner'
import { updateManifestAfterSync } from '../../services/manifest'
import { addHistoryEntry } from '../../services/history'
import { createBackup } from '../../services/backup'
import { saveMergedFile } from '../../services/merger'

async function getFileHash(filePath: string): Promise<string> {
  const crypto = await import('crypto')
  const content = await fs.promises.readFile(filePath)
  return crypto.createHash('md5').update(content).digest('hex')
}

export function registerSyncHandlers(): void {
  // ─── Sync Files ──────────────────────────────
  ipcMain.handle(IPC.SYNC_FILES, async (event, params: SyncParams, config: SyncConfig) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    const result = await syncFiles(params, config, (current, total, file) => {
      win?.webContents.send(IPC.SYNC_PROGRESS, { current, total, file })
    })

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

  // ─── Resolve Conflict ───────────────────────
  ipcMain.handle(IPC.RESOLVE_CONFLICT, async (_event, p1Root: string, p2Root: string, relativePath: string, action: string) => {
    const p1File = path.join(p1Root, relativePath)
    const p2File = path.join(p2Root, relativePath)

    if (action === 'keep_p1') {
      await createBackup(p1Root, p2Root, p2Root, relativePath, 'backup')
      await fs.promises.copyFile(p1File, p2File)
    } else if (action === 'keep_p2') {
      await createBackup(p1Root, p2Root, p1Root, relativePath, 'backup')
      await fs.promises.copyFile(p2File, p1File)
    }

    const p1Hash = await getFileHash(p1File)
    const p2Hash = await getFileHash(p2File)
    await updateManifestAfterSync(p1Root, p2Root, [relativePath],
      new Map([[relativePath, p1Hash]]),
      new Map([[relativePath, p2Hash]])
    )
  })

  // ─── Save Merged File ──────────────────────────
  ipcMain.handle(IPC.SAVE_MERGED_FILE, async (_event, p1Root: string, p2Root: string, relativePath: string, mergedContent: string) => {
    return saveMergedFile(p1Root, p2Root, relativePath, mergedContent)
  })
}
