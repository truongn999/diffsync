import * as path from 'path'
import * as crypto from 'crypto'
import { app } from 'electron'

/**
 * Returns the base data directory for the app:
 * %APPDATA%/project-sync-tool/
 */
export function getAppDataDir(): string {
  return app.getPath('userData')
}

/**
 * Generates a consistent hash for a project pair (p1 + p2 paths).
 * Used to create isolated storage per project pair.
 */
export function getProjectPairHash(p1Path: string, p2Path: string): string {
  const key = `${p1Path}|||${p2Path}`
  return crypto.createHash('md5').update(key).digest('hex').slice(0, 12)
}

/**
 * Returns the data directory for a specific project pair:
 * %APPDATA%/project-sync-tool/projects/<hash>/
 */
export function getProjectDataDir(p1Path: string, p2Path: string): string {
  const hash = getProjectPairHash(p1Path, p2Path)
  return path.join(getAppDataDir(), 'projects', hash)
}
