import * as fs from 'fs'
import * as path from 'path'
import { getProjectDataDir } from './dataDir'

/**
 * Creates a timestamped backup of a file before overwrite.
 * Backup stored at: %APPDATA%/project-sync-tool/projects/<hash>/backup/<timestamp>/<relativePath>
 */
export async function createBackup(
  p1Root: string,
  p2Root: string,
  projectRoot: string,
  relativePath: string,
  backupSubDir = 'backup'
): Promise<string> {
  const dataDir = getProjectDataDir(p1Root, p2Root)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = path.join(dataDir, backupSubDir, timestamp, relativePath)
  const sourcePath = path.join(projectRoot, relativePath)

  await fs.promises.mkdir(path.dirname(backupPath), { recursive: true })
  await fs.promises.copyFile(sourcePath, backupPath)

  return backupPath
}

/**
 * Restores a file from backup to its original location.
 */
export async function restoreBackup(
  backupPath: string,
  projectRoot: string,
  relativePath: string
): Promise<void> {
  const targetPath = path.join(projectRoot, relativePath)
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.promises.copyFile(backupPath, targetPath)
}

/**
 * Lists all backup timestamps for a project pair.
 */
export async function listBackups(
  p1Root: string,
  p2Root: string,
  backupSubDir = 'backup'
): Promise<string[]> {
  const dataDir = getProjectDataDir(p1Root, p2Root)
  const backupRoot = path.join(dataDir, backupSubDir)

  try {
    const entries = await fs.promises.readdir(backupRoot)
    return entries.sort().reverse()
  } catch {
    return []
  }
}
