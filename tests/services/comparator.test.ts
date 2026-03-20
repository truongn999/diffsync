import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'path'
import { scanProject } from '../../src/main/services/scanner'
import { compareFiles } from '../../src/main/services/comparator'
import type { SyncConfig, FileInfo, CompareResult, Manifest } from '../../src/shared/types'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')
const FIXTURE_B = path.resolve(__dirname, '../fixtures/project-b')

const baseConfig: SyncConfig = {
  groups: [],
  ignore: ['node_modules/**', '.sync-backup/**'],
  extensions: ['.ts'],
  backup: { enabled: false, directory: '.sync-backup' },
  selectedPaths: []
}

describe('Comparator Service', () => {
  let p1Files: Map<string, FileInfo>
  let p2Files: Map<string, FileInfo>
  let result: CompareResult

  beforeAll(async () => {
    const scan1 = await scanProject(FIXTURE_A, baseConfig)
    const scan2 = await scanProject(FIXTURE_B, baseConfig)
    p1Files = scan1.files
    p2Files = scan2.files
    result = compareFiles(p1Files, p2Files)
  })

  // ─────────────────────────────────────────────────────────
  // Basic Comparison
  // ─────────────────────────────────────────────────────────
  describe('Basic comparison', () => {
    it('should report correct total file count (union of both projects)', () => {
      // P1: utils.ts, hooks/useAuth.ts, constants.ts
      // P2: utils.ts, hooks/useAuth.ts, helpers/debounce.ts
      // Union = 4 unique files
      expect(result.stats.total).toBe(4)
    })

    it('should identify identical files as "same"', () => {
      const same = result.items.find(i => i.relativePath === 'src/utils.ts')
      expect(same).toBeDefined()
      expect(same!.status).toBe('same')
      expect(same!.p1).not.toBeNull()
      expect(same!.p2).not.toBeNull()
      expect(same!.p1!.hash).toBe(same!.p2!.hash)
    })

    it('should identify files with different content as "modified"', () => {
      const modified = result.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')
      expect(modified).toBeDefined()
      expect(modified!.status).toBe('modified')
      expect(modified!.p1!.hash).not.toBe(modified!.p2!.hash)
    })

    it('should identify files only in P1 as "only_in_p1"', () => {
      const onlyP1 = result.items.find(i => i.relativePath === 'src/constants.ts')
      expect(onlyP1).toBeDefined()
      expect(onlyP1!.status).toBe('only_in_p1')
      expect(onlyP1!.p1).not.toBeNull()
      expect(onlyP1!.p2).toBeNull()
    })

    it('should identify files only in P2 as "only_in_p2"', () => {
      const onlyP2 = result.items.find(i => i.relativePath === 'src/helpers/debounce.ts')
      expect(onlyP2).toBeDefined()
      expect(onlyP2!.status).toBe('only_in_p2')
      expect(onlyP2!.p1).toBeNull()
      expect(onlyP2!.p2).not.toBeNull()
    })

    it('should have correct stats breakdown', () => {
      expect(result.stats.same).toBe(1)
      expect(result.stats.modified).toBe(1)
      expect(result.stats.only_in_p1).toBe(1)
      expect(result.stats.only_in_p2).toBe(1)
      expect(result.stats.conflict).toBe(0)
    })

    it('stats total should equal sum of all statuses', () => {
      const { stats } = result
      expect(stats.total).toBe(
        stats.same + stats.modified + stats.only_in_p1 + stats.only_in_p2 + stats.conflict
      )
    })
  })

  // ─────────────────────────────────────────────────────────
  // Sorting
  // ─────────────────────────────────────────────────────────
  describe('Result ordering', () => {
    it('should sort items: conflict → modified → only_in_p1 → only_in_p2 → same', () => {
      const statusOrder: Record<string, number> = {
        conflict: 0, modified: 1, only_in_p1: 2, only_in_p2: 3, same: 4
      }
      for (let i = 1; i < result.items.length; i++) {
        expect(statusOrder[result.items[i].status])
          .toBeGreaterThanOrEqual(statusOrder[result.items[i - 1].status])
      }
    })
  })

  // ─────────────────────────────────────────────────────────
  // Conflict Detection
  // ─────────────────────────────────────────────────────────
  describe('Conflict detection with manifest', () => {
    it('should detect conflict when both P1 and P2 changed since last sync', () => {
      const manifest: Manifest = {
        files: {
          'src/hooks/useAuth.ts': {
            lastSyncHashP1: 'stale-hash-p1',
            lastSyncHashP2: 'stale-hash-p2'
          }
        }
      }
      const r = compareFiles(p1Files, p2Files, manifest)
      const file = r.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
      expect(file.status).toBe('conflict')
      expect(r.stats.conflict).toBe(1)
    })

    it('should NOT detect conflict when only P1 changed (P2 hash matches manifest)', () => {
      const p2Hash = p2Files.get('src/hooks/useAuth.ts')!.hash
      const manifest: Manifest = {
        files: {
          'src/hooks/useAuth.ts': {
            lastSyncHashP1: 'stale-hash',
            lastSyncHashP2: p2Hash  // P2 unchanged since last sync
          }
        }
      }
      const r = compareFiles(p1Files, p2Files, manifest)
      const file = r.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
      expect(file.status).toBe('modified')
    })

    it('should NOT detect conflict when only P2 changed (P1 hash matches manifest)', () => {
      const p1Hash = p1Files.get('src/hooks/useAuth.ts')!.hash
      const manifest: Manifest = {
        files: {
          'src/hooks/useAuth.ts': {
            lastSyncHashP1: p1Hash,  // P1 unchanged since last sync
            lastSyncHashP2: 'stale-hash'
          }
        }
      }
      const r = compareFiles(p1Files, p2Files, manifest)
      const file = r.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
      expect(file.status).toBe('modified')
    })

    it('should treat as "modified" when no manifest exists', () => {
      const r = compareFiles(p1Files, p2Files)
      const file = r.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
      expect(file.status).toBe('modified')
    })

    it('should treat as "modified" when file is not in manifest', () => {
      const manifest: Manifest = { files: {} }
      const r = compareFiles(p1Files, p2Files, manifest)
      const file = r.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
      expect(file.status).toBe('modified')
    })
  })

  // ─────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('should return empty result when both projects are empty', () => {
      const r = compareFiles(new Map(), new Map())
      expect(r.stats.total).toBe(0)
      expect(r.items).toHaveLength(0)
    })

    it('should mark all files as only_in_p1 when P2 is empty', () => {
      const r = compareFiles(p1Files, new Map())
      expect(r.stats.only_in_p1).toBe(p1Files.size)
      expect(r.stats.same).toBe(0)
      expect(r.stats.modified).toBe(0)
    })

    it('should mark all files as only_in_p2 when P1 is empty', () => {
      const r = compareFiles(new Map(), p2Files)
      expect(r.stats.only_in_p2).toBe(p2Files.size)
      expect(r.stats.same).toBe(0)
      expect(r.stats.modified).toBe(0)
    })

    it('should compare identical projects as all "same"', () => {
      const r = compareFiles(p1Files, p1Files)
      expect(r.stats.same).toBe(p1Files.size)
      expect(r.stats.modified).toBe(0)
      expect(r.stats.only_in_p1).toBe(0)
      expect(r.stats.only_in_p2).toBe(0)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Auto-Baseline (first compare creates manifest entries)
  // ─────────────────────────────────────────────────────────
  describe('Auto-baseline on first compare', () => {
    it('should create baseline entries for files in both projects without manifest', () => {
      const r = compareFiles(p1Files, p2Files)
      // Files in both projects should get baseline entries
      expect(Object.keys(r.newManifestEntries).length).toBeGreaterThan(0)
    })

    it('should create baseline for identical files (same status)', () => {
      const r = compareFiles(p1Files, p2Files)
      const entry = r.newManifestEntries['src/utils.ts']
      expect(entry).toBeDefined()
      expect(entry.lastSyncHashP1).toBe(p1Files.get('src/utils.ts')!.hash)
      expect(entry.lastSyncHashP2).toBe(p2Files.get('src/utils.ts')!.hash)
    })

    it('should create baseline for modified files (different hashes)', () => {
      const r = compareFiles(p1Files, p2Files)
      const entry = r.newManifestEntries['src/hooks/useAuth.ts']
      expect(entry).toBeDefined()
      expect(entry.lastSyncHashP1).toBe(p1Files.get('src/hooks/useAuth.ts')!.hash)
      expect(entry.lastSyncHashP2).toBe(p2Files.get('src/hooks/useAuth.ts')!.hash)
    })

    it('should NOT create baseline for files only in one project', () => {
      const r = compareFiles(p1Files, p2Files)
      expect(r.newManifestEntries['src/constants.ts']).toBeUndefined()
      expect(r.newManifestEntries['src/helpers/debounce.ts']).toBeUndefined()
    })

    it('should NOT create baseline entries when manifest already has all files', () => {
      const manifest: Manifest = {
        files: {
          'src/utils.ts': {
            lastSyncHashP1: p1Files.get('src/utils.ts')!.hash,
            lastSyncHashP2: p2Files.get('src/utils.ts')!.hash
          },
          'src/hooks/useAuth.ts': {
            lastSyncHashP1: 'stale-hash-p1',
            lastSyncHashP2: 'stale-hash-p2'
          }
        }
      }
      const r = compareFiles(p1Files, p2Files, manifest)
      expect(Object.keys(r.newManifestEntries).length).toBe(0)
    })

    it('should detect conflict after baseline is established and both sides change', () => {
      // Simulate: first compare creates baseline
      const baseline = compareFiles(p1Files, p2Files)
      const manifest: Manifest = { files: { ...baseline.newManifestEntries } }

      // Simulate: both sides changed (use fake hashes different from baseline)
      const p1Changed = new Map(p1Files)
      const p2Changed = new Map(p2Files)
      const authP1 = { ...p1Changed.get('src/hooks/useAuth.ts')!, hash: 'new-hash-p1' }
      const authP2 = { ...p2Changed.get('src/hooks/useAuth.ts')!, hash: 'new-hash-p2' }
      p1Changed.set('src/hooks/useAuth.ts', authP1)
      p2Changed.set('src/hooks/useAuth.ts', authP2)

      const r2 = compareFiles(p1Changed, p2Changed, manifest)
      const file = r2.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
      expect(file.status).toBe('conflict')
      expect(r2.stats.conflict).toBe(1)
    })
  })
})
