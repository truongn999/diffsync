import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import fg from 'fast-glob'
import type { FileInfo, SyncConfig } from '../../shared/types'

/**
 * Scans a project directory recursively, respecting config patterns.
 * Returns a Map of relativePath → FileInfo.
 */
export async function scanProject(
  rootPath: string,
  config: SyncConfig
): Promise<{ files: Map<string, FileInfo>; totalScanned: number; duration: number }> {
  const start = Date.now()
  const files = new Map<string, FileInfo>()

  // Build glob patterns from config extensions
  const patterns = config.extensions.length > 0
    ? config.extensions.map(ext => `**/*${ext}`)
    : ['**/*']

  // Scan with fast-glob
  const entries = await fg(patterns, {
    cwd: rootPath,
    ignore: config.ignore,
    dot: false,
    onlyFiles: true,
    absolute: false
  })

  console.log('[Scanner] entries found:', entries.length)
  if (entries.length > 0) {
    console.log('[Scanner] first 10 entries:', entries.slice(0, 10))
  }

  for (const entry of entries) {
    const relativePath = typeof entry === 'string' ? entry : entry
    const fullPath = path.join(rootPath, relativePath)

    try {
      const stat = await fs.promises.stat(fullPath)
      const hash = await computeFileHash(fullPath)

      // Normalize path separators to forward slashes
      const normalizedPath = relativePath.replace(/\\/g, '/')

      files.set(normalizedPath, {
        relativePath: normalizedPath,
        hash,
        mtime: stat.mtimeMs,
        size: stat.size
      })
    } catch {
      // Skip files that can't be read (permissions, etc.)
      continue
    }
  }

  return {
    files,
    totalScanned: files.size,
    duration: Date.now() - start
  }
}

/**
 * Computes MD5 hash of a file using streaming for memory efficiency.
 */
async function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)

    stream.on('data', (data) => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

/**
 * Filters scanned files by selectedPaths from config.
 * If selectedPaths is empty, returns all files (no filtering).
 */
export function filterByScope(
  files: Map<string, FileInfo>,
  selectedPaths: string[]
): Map<string, FileInfo> {
  if (!selectedPaths || selectedPaths.length === 0) {
    return files
  }

  const selectedSet = new Set(selectedPaths)
  const filtered = new Map<string, FileInfo>()

  for (const [key, value] of files) {
    // Check exact match or if file is under a selected directory
    if (selectedSet.has(key) || isUnderSelectedPath(key, selectedPaths)) {
      filtered.set(key, value)
    }
  }

  return filtered
}

function isUnderSelectedPath(filePath: string, selectedPaths: string[]): boolean {
  return selectedPaths.some(sp => filePath.startsWith(sp + '/'))
}
