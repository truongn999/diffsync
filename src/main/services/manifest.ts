import * as fs from 'fs'
import * as path from 'path'
import type { Manifest, ManifestEntry } from '../../shared/types'

const MANIFEST_FILENAME = '.sync-manifest.json'

/**
 * Loads the sync manifest from project root.
 */
export async function loadManifest(projectRoot: string): Promise<Manifest> {
  const manifestPath = path.join(projectRoot, MANIFEST_FILENAME)

  try {
    const content = await fs.promises.readFile(manifestPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { files: {} }
  }
}

/**
 * Saves the sync manifest to project root.
 */
export async function saveManifest(projectRoot: string, manifest: Manifest): Promise<void> {
  const manifestPath = path.join(projectRoot, MANIFEST_FILENAME)
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
}

/**
 * Updates manifest entries after a successful sync.
 * Records the current hashes as the last-synced state.
 */
export async function updateManifestAfterSync(
  p1Root: string,
  syncedFiles: string[],
  p1Hashes: Map<string, string>,
  p2Hashes: Map<string, string>
): Promise<void> {
  const manifest = await loadManifest(p1Root)

  for (const filePath of syncedFiles) {
    const p1Hash = p1Hashes.get(filePath) || ''
    const p2Hash = p2Hashes.get(filePath) || ''

    manifest.files[filePath] = {
      lastSyncHashP1: p1Hash,
      lastSyncHashP2: p2Hash
    } satisfies ManifestEntry
  }

  await saveManifest(p1Root, manifest)
}
