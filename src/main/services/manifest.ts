import * as fs from 'fs'
import * as path from 'path'
import type { Manifest, ManifestEntry } from '../../shared/types'
import { getProjectDataDir } from './dataDir'

const MANIFEST_FILENAME = 'manifest.json'

/**
 * Loads the sync manifest from AppData for a project pair.
 * Path: %APPDATA%/diffsync/projects/<hash>/manifest.json
 */
export async function loadManifest(p1Root: string, p2Root: string): Promise<Manifest> {
  const dataDir = getProjectDataDir(p1Root, p2Root)
  const manifestPath = path.join(dataDir, MANIFEST_FILENAME)

  try {
    const content = await fs.promises.readFile(manifestPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { files: {} }
  }
}

/**
 * Saves the sync manifest to AppData for a project pair.
 */
export async function saveManifest(p1Root: string, p2Root: string, manifest: Manifest): Promise<void> {
  const dataDir = getProjectDataDir(p1Root, p2Root)
  await fs.promises.mkdir(dataDir, { recursive: true })
  const manifestPath = path.join(dataDir, MANIFEST_FILENAME)
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
}

/**
 * Updates manifest entries after a successful sync.
 */
export async function updateManifestAfterSync(
  p1Root: string,
  p2Root: string,
  syncedFiles: string[],
  p1Hashes: Map<string, string>,
  p2Hashes: Map<string, string>
): Promise<void> {
  const manifest = await loadManifest(p1Root, p2Root)

  for (const filePath of syncedFiles) {
    const p1Hash = p1Hashes.get(filePath) || ''
    const p2Hash = p2Hashes.get(filePath) || ''

    manifest.files[filePath] = {
      lastSyncHashP1: p1Hash,
      lastSyncHashP2: p2Hash
    } satisfies ManifestEntry
  }

  await saveManifest(p1Root, p2Root, manifest)
}
