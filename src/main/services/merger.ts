import * as fs from 'fs'
import * as path from 'path'
import type { MergeResult } from '../../shared/types'
import { createBackup } from './backup'
import { updateManifestAfterSync } from './manifest'

/**
 * Saves merged content to both P1 and P2 project files.
 * Creates backups before overwriting, then updates the manifest
 * so both sides are treated as in-sync after the merge.
 */
export async function saveMergedFile(
  p1Root: string,
  p2Root: string,
  relativePath: string,
  mergedContent: string,
  backupDir: string = 'backup'
): Promise<MergeResult> {
  const p1File = path.join(p1Root, relativePath)
  const p2File = path.join(p2Root, relativePath)
  const backupPaths: string[] = []

  try {
    // 1. Backup existing files before overwriting
    // Use distinct subdirectories to prevent backup collision when same relativePath
    const sides = [
      { root: p1Root, filePath: p1File, subDir: `${backupDir}-p1` },
      { root: p2Root, filePath: p2File, subDir: `${backupDir}-p2` },
    ]
    for (const { root, filePath, subDir } of sides) {
      try {
        await fs.promises.access(filePath)
        const bp = await createBackup(p1Root, p2Root, root, relativePath, subDir)
        backupPaths.push(bp)
      } catch {
        // File doesn't exist on this side, no backup needed
      }
    }

    // 2. Ensure parent directories exist
    await fs.promises.mkdir(path.dirname(p1File), { recursive: true })
    await fs.promises.mkdir(path.dirname(p2File), { recursive: true })

    // 3. Write merged content to both sides
    await fs.promises.writeFile(p1File, mergedContent, 'utf-8')
    await fs.promises.writeFile(p2File, mergedContent, 'utf-8')

    // 4. Update manifest — both sides now have the same hash
    const crypto = await import('crypto')
    const hash = crypto.createHash('md5').update(mergedContent).digest('hex')
    await updateManifestAfterSync(
      p1Root,
      p2Root,
      [relativePath],
      new Map([[relativePath, hash]]),
      new Map([[relativePath, hash]])
    )

    return { success: true, backupPaths }
  } catch (err) {
    return {
      success: false,
      backupPaths,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
