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

  it('should report correct total file count', () => {
    // project-a has: utils.ts, hooks/useAuth.ts, constants.ts
    // project-b has: utils.ts, hooks/useAuth.ts, helpers/debounce.ts
    // Union: utils.ts, hooks/useAuth.ts, constants.ts, helpers/debounce.ts = 4
    expect(result.stats.total).toBe(4)
  })

  it('should identify identical files as same', () => {
    const same = result.items.find(i => i.relativePath === 'src/utils.ts')
    expect(same).toBeDefined()
    expect(same!.status).toBe('same')
  })

  it('should identify files with different hashes as modified', () => {
    const modified = result.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')
    expect(modified).toBeDefined()
    expect(modified!.status).toBe('modified')
  })

  it('should identify files only in P1', () => {
    const onlyP1 = result.items.find(i => i.relativePath === 'src/constants.ts')
    expect(onlyP1).toBeDefined()
    expect(onlyP1!.status).toBe('only_in_p1')
    expect(onlyP1!.p1).not.toBeNull()
    expect(onlyP1!.p2).toBeNull()
  })

  it('should identify files only in P2', () => {
    const onlyP2 = result.items.find(i => i.relativePath === 'src/helpers/debounce.ts')
    expect(onlyP2).toBeDefined()
    expect(onlyP2!.status).toBe('only_in_p2')
    expect(onlyP2!.p1).toBeNull()
    expect(onlyP2!.p2).not.toBeNull()
  })

  it('should have correct stats breakdown', () => {
    expect(result.stats.same).toBe(1)       // utils.ts
    expect(result.stats.modified).toBe(1)    // useAuth.ts
    expect(result.stats.only_in_p1).toBe(1)  // constants.ts
    expect(result.stats.only_in_p2).toBe(1)  // debounce.ts
    expect(result.stats.conflict).toBe(0)
  })

  it('should sort items with conflicts/modified first, same last', () => {
    const statuses = result.items.map(i => i.status)
    const orderMap: Record<string, number> = { conflict: 0, modified: 1, only_in_p1: 2, only_in_p2: 3, same: 4 }
    for (let i = 1; i < statuses.length; i++) {
      expect(orderMap[statuses[i]]).toBeGreaterThanOrEqual(orderMap[statuses[i - 1]])
    }
  })

  describe('Conflict detection with manifest', () => {
    it('should detect conflict when both sides changed since last sync', () => {
      const manifest: Manifest = {
        files: {
          'src/hooks/useAuth.ts': {
            lastSyncHashP1: 'old-hash-p1',
            lastSyncHashP2: 'old-hash-p2'
          }
        }
      }
      const resultWithManifest = compareFiles(p1Files, p2Files, manifest)
      const file = resultWithManifest.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')
      expect(file!.status).toBe('conflict')
      expect(resultWithManifest.stats.conflict).toBe(1)
    })

    it('should not detect conflict when only one side changed', () => {
      const p1Hash = p1Files.get('src/hooks/useAuth.ts')!.hash
      const manifest: Manifest = {
        files: {
          'src/hooks/useAuth.ts': {
            lastSyncHashP1: p1Hash,         // P1 unchanged
            lastSyncHashP2: 'old-hash-p2'   // P2 changed
          }
        }
      }
      const resultWithManifest = compareFiles(p1Files, p2Files, manifest)
      const file = resultWithManifest.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')
      expect(file!.status).toBe('modified')
    })

    it('should treat as modified when no manifest exists', () => {
      const noManifest = compareFiles(p1Files, p2Files)
      const file = noManifest.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')
      expect(file!.status).toBe('modified')
    })
  })
})
