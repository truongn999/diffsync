import type { FileInfo, CompareItem, CompareResult, Manifest, ManifestEntry } from '../../shared/types'

/**
 * Compares files between two scanned projects.
 * Uses hash-based comparison (fast, no line-level analysis until diff requested).
 * On first compare (no manifest), creates baseline entries for conflict detection.
 */
export function compareFiles(
  p1Files: Map<string, FileInfo>,
  p2Files: Map<string, FileInfo>,
  manifest?: Manifest
): CompareResult {
  const items: CompareItem[] = []
  const newManifestEntries: Record<string, ManifestEntry> = {}
  const allPaths = new Set([...p1Files.keys(), ...p2Files.keys()])

  const stats = {
    total: 0,
    modified: 0,
    only_in_p1: 0,
    only_in_p2: 0,
    same: 0,
    conflict: 0
  }

  for (const relativePath of allPaths) {
    const p1 = p1Files.get(relativePath) || null
    const p2 = p2Files.get(relativePath) || null

    let status: CompareItem['status']

    if (p1 && !p2) {
      status = 'only_in_p1'
    } else if (!p1 && p2) {
      status = 'only_in_p2'
    } else if (p1 && p2) {
      const hasManifestEntry = manifest && manifest.files[relativePath]

      if (p1.hash === p2.hash) {
        status = 'same'
        // Create baseline for identical files not yet in manifest
        if (!hasManifestEntry) {
          newManifestEntries[relativePath] = {
            lastSyncHashP1: p1.hash,
            lastSyncHashP2: p2.hash
          }
        }
      } else {
        // Files differ — check for conflict using manifest
        if (hasManifestEntry) {
          status = detectConflict(relativePath, p1, p2, manifest!) ? 'conflict' : 'modified'
        } else {
          // No manifest entry → first time seeing this file pair
          // Create baseline with current hashes for future conflict detection
          status = 'modified'
          newManifestEntries[relativePath] = {
            lastSyncHashP1: p1.hash,
            lastSyncHashP2: p2.hash
          }
        }
      }
    } else {
      continue // shouldn't happen
    }

    items.push({ relativePath, status, p1, p2 })
    stats.total++
    stats[status]++
  }

  // Sort: conflicts first, then modified, then only_in_*, then same
  const statusOrder: Record<string, number> = {
    conflict: 0,
    modified: 1,
    only_in_p1: 2,
    only_in_p2: 3,
    same: 4
  }
  items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return { items, stats, newManifestEntries }
}

/**
 * Detects conflict: both projects changed the file since last sync.
 * A conflict occurs when both p1 and p2 hashes differ from their last-synced values.
 */
function detectConflict(
  relativePath: string,
  p1: FileInfo,
  p2: FileInfo,
  manifest: Manifest
): boolean {
  const entry = manifest.files[relativePath]
  if (!entry) return false

  const p1Changed = p1.hash !== entry.lastSyncHashP1
  const p2Changed = p2.hash !== entry.lastSyncHashP2

  return p1Changed && p2Changed
}
