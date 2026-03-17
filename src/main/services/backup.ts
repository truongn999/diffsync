import * as fs from 'fs'
import * as path from 'path'

/**
 * Creates a timestamped backup of a file before overwrite.
 * Backup stored at: <projectRoot>/<backupDir>/<timestamp>/<relativePath>
 */
export async function createBackup(
  projectRoot: string,
  relativePath: string,
  backupDir = '.sync-backup'
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = path.join(projectRoot, backupDir, timestamp, relativePath)
  const sourcePath = path.join(projectRoot, relativePath)

  // Ensure backup directory exists
  await fs.promises.mkdir(path.dirname(backupPath), { recursive: true })

  // Copy file to backup location
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

  // Ensure target directory exists
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })

  // Restore from backup
  await fs.promises.copyFile(backupPath, targetPath)
}

/**
 * Lists all backup timestamps for a project.
 */
export async function listBackups(
  projectRoot: string,
  backupDir = '.sync-backup'
): Promise<string[]> {
  const backupRoot = path.join(projectRoot, backupDir)

  try {
    const entries = await fs.promises.readdir(backupRoot)
    return entries.sort().reverse() // newest first
  } catch {
    return []
  }
}
