import * as fs from 'fs'
import * as path from 'path'
import type { SyncParams, SyncResult, SyncConfig } from '../../shared/types'
import { createBackup } from './backup'

/**
 * Synchronizes files between two projects.
 * Creates backups before overwriting existing files.
 */
export async function syncFiles(
  params: SyncParams,
  config: SyncConfig,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<SyncResult> {
  const { from, to, files, p1Root, p2Root } = params
  const sourceRoot = from === 'p1' ? p1Root : p2Root
  const targetRoot = to === 'p1' ? p1Root : p2Root

  const syncedFiles: string[] = []
  const failedFiles: { path: string; error: string }[] = []
  const backupPaths: string[] = []

  for (let i = 0; i < files.length; i++) {
    const relativePath = files[i]
    const sourcePath = path.join(sourceRoot, relativePath)
    const targetPath = path.join(targetRoot, relativePath)

    try {
      // Report progress
      onProgress?.(i + 1, files.length, relativePath)

      // Create backup if target file exists and backup is enabled
      if (config.backup.enabled) {
        try {
          await fs.promises.access(targetPath)
          const backupPath = await createBackup(targetRoot, relativePath, config.backup.directory)
          backupPaths.push(backupPath)
        } catch {
          // Target file doesn't exist yet, no backup needed
        }
      }

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath)
      await fs.promises.mkdir(targetDir, { recursive: true })

      // Copy source → target
      await fs.promises.copyFile(sourcePath, targetPath)
      syncedFiles.push(relativePath)
    } catch (err) {
      failedFiles.push({
        path: relativePath,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  return {
    success: failedFiles.length === 0,
    syncedFiles,
    failedFiles,
    backupPaths
  }
}
