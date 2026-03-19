/**
 * Integration Test: Full user workflows
 *
 * Tests the entire pipeline end-to-end using real fixture directories.
 * Simulates what the user does: Scan → Compare → Diff → Sync → Verify
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Mock the dataDir module to avoid Electron dependency
const TEST_APPDATA = path.join(os.tmpdir(), `e2e-appdata-${Date.now()}-${Math.random().toString(36).slice(2)}`)
vi.mock('../../src/main/services/dataDir', () => {
  return {
    getAppDataDir: () => TEST_APPDATA,
    getProjectDataDir: (p1: string, p2: string) => {
      const crypto = require('crypto')
      const hash = crypto.createHash('md5').update(`${p1}|||${p2}`).digest('hex').slice(0, 12)
      return path.join(TEST_APPDATA, 'projects', hash)
    },
    getProjectPairHash: (p1: string, p2: string) => {
      const crypto = require('crypto')
      return crypto.createHash('md5').update(`${p1}|||${p2}`).digest('hex').slice(0, 12)
    }
  }
})

import { scanProject, filterByScope } from '../../src/main/services/scanner'
import { compareFiles } from '../../src/main/services/comparator'
import { generateDiff } from '../../src/main/services/differ'
import { syncFiles } from '../../src/main/services/syncer'
import { loadConfig, saveConfig, getDefaultConfig } from '../../src/main/services/config'
import { loadManifest, saveManifest, updateManifestAfterSync } from '../../src/main/services/manifest'
import type { SyncConfig } from '../../src/shared/types'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')
const FIXTURE_B = path.resolve(__dirname, '../fixtures/project-b')

let tempDir: string
let tempP2: string

const testConfig: SyncConfig = {
  groups: [],
  ignore: ['node_modules/**', '.sync-backup/**'],
  extensions: ['.ts'],
  backup: { enabled: true, directory: 'backup' },
  selectedPaths: []
}

/** Recursively copy a directory */
async function copyDir(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true })
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `e2e-${Date.now()}`)
  tempP2 = path.join(tempDir, 'project-b-copy')
  await copyDir(FIXTURE_B, tempP2)
})

afterEach(async () => {
  await fs.promises.rm(tempDir, { recursive: true, force: true })
  await fs.promises.rm(TEST_APPDATA, { recursive: true, force: true }).catch(() => {})
})

// ═══════════════════════════════════════════════════════════
// UC1: Scan → Compare → Identify all statuses
// ═══════════════════════════════════════════════════════════
describe('UC1: Scan → Compare → View Results', () => {
  it('should scan both projects and produce correct totals', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    expect(scan1.totalScanned).toBeGreaterThan(0)
    expect(scan2.totalScanned).toBeGreaterThan(0)
  })

  it('should identify all 4 file statuses correctly after comparison', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)
    const result = compareFiles(scan1.files, scan2.files)

    expect(result.stats.total).toBe(4)
    expect(result.stats.same).toBe(1)       // utils.ts
    expect(result.stats.modified).toBe(1)    // useAuth.ts
    expect(result.stats.only_in_p1).toBe(1)  // constants.ts
    expect(result.stats.only_in_p2).toBe(1)  // debounce.ts
  })

  it('should show diff for a modified file with additions and deletions', async () => {
    const diff = await generateDiff(FIXTURE_A, tempP2, 'src/hooks/useAuth.ts')
    expect(diff.stats.additions).toBeGreaterThan(0)
    expect(diff.stats.deletions).toBeGreaterThan(0)
    expect(diff.p1Lines.length).toBe(diff.p2Lines.length)
  })
})

// ═══════════════════════════════════════════════════════════
// UC2: Full Sync Flow — P1 → P2
// ═══════════════════════════════════════════════════════════
describe('UC2: Full sync P1 → P2', () => {
  it('should sync a modified file, create backup, and verify equality', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)
    const result = compareFiles(scan1.files, scan2.files)

    const modified = result.items.find(i => i.status === 'modified')!
    expect(modified.relativePath).toBe('src/hooks/useAuth.ts')

    // Sync P1 → P2
    const syncResult = await syncFiles({
      from: 'p1', to: 'p2',
      files: [modified.relativePath],
      p1Root: FIXTURE_A, p2Root: tempP2
    }, testConfig)

    expect(syncResult.success).toBe(true)
    expect(syncResult.syncedFiles).toContain(modified.relativePath)

    // Backup was created (target file existed)
    expect(syncResult.backupPaths.length).toBe(1)
    expect(fs.existsSync(syncResult.backupPaths[0])).toBe(true)

    // P2 file now matches P1
    const p1Content = await fs.promises.readFile(
      path.join(FIXTURE_A, modified.relativePath), 'utf-8'
    )
    const p2Content = await fs.promises.readFile(
      path.join(tempP2, modified.relativePath), 'utf-8'
    )
    expect(p2Content).toBe(p1Content)
  })

  it('should re-compare as "same" after sync', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)

    await syncFiles({
      from: 'p1', to: 'p2',
      files: ['src/hooks/useAuth.ts'],
      p1Root: FIXTURE_A, p2Root: tempP2
    }, testConfig)

    const scan2After = await scanProject(tempP2, testConfig)
    const resultAfter = compareFiles(scan1.files, scan2After.files)
    const file = resultAfter.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
    expect(file.status).toBe('same')
  })

  it('should sync "only_in_p1" file to P2 (create new file)', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)
    const result = compareFiles(scan1.files, scan2.files)

    const onlyP1 = result.items.find(i => i.status === 'only_in_p1')!
    expect(onlyP1.relativePath).toBe('src/constants.ts')

    const syncResult = await syncFiles({
      from: 'p1', to: 'p2',
      files: [onlyP1.relativePath],
      p1Root: FIXTURE_A, p2Root: tempP2
    }, testConfig)

    expect(syncResult.success).toBe(true)
    expect(fs.existsSync(path.join(tempP2, onlyP1.relativePath))).toBe(true)
    // No backup needed (file didn't exist in P2)
    expect(syncResult.backupPaths).toHaveLength(0)

    // Re-compare → should be "same"
    const scan2After = await scanProject(tempP2, testConfig)
    const afterResult = compareFiles(scan1.files, scan2After.files)
    const after = afterResult.items.find(i => i.relativePath === onlyP1.relativePath)!
    expect(after.status).toBe('same')
  })

  it('should sync all files and result in identical projects (except only_in_p2)', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)
    const result = compareFiles(scan1.files, scan2.files)

    const filesToSync = result.items
      .filter(i => i.status === 'modified' || i.status === 'only_in_p1')
      .map(i => i.relativePath)

    const syncResult = await syncFiles({
      from: 'p1', to: 'p2',
      files: filesToSync,
      p1Root: FIXTURE_A, p2Root: tempP2
    }, testConfig)

    expect(syncResult.success).toBe(true)
    expect(syncResult.syncedFiles).toHaveLength(filesToSync.length)

    // Re-compare: no more modified or only_in_p1
    const scan2After = await scanProject(tempP2, testConfig)
    const afterResult = compareFiles(scan1.files, scan2After.files)
    expect(afterResult.stats.modified).toBe(0)
    expect(afterResult.stats.only_in_p1).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════
// UC3: Scope Filtering — Only compare selected files
// ═══════════════════════════════════════════════════════════
describe('UC3: Scope selector — filter comparison', () => {
  it('should compare only files under a selected directory', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    const filtered1 = filterByScope(scan1.files, ['src/hooks'])
    const filtered2 = filterByScope(scan2.files, ['src/hooks'])

    const result = compareFiles(filtered1, filtered2)
    expect(result.stats.total).toBe(1)
    expect(result.items[0].relativePath).toBe('src/hooks/useAuth.ts')
    expect(result.items[0].status).toBe('modified')
  })

  it('should compare only a single specific file', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    const filtered1 = filterByScope(scan1.files, ['src/utils.ts'])
    const filtered2 = filterByScope(scan2.files, ['src/utils.ts'])

    const result = compareFiles(filtered1, filtered2)
    expect(result.stats.total).toBe(1)
    expect(result.items[0].status).toBe('same')
  })

  it('should show "only_in_p1" when scope selects file not in P2', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    const filtered1 = filterByScope(scan1.files, ['src/constants.ts'])
    const filtered2 = filterByScope(scan2.files, ['src/constants.ts'])

    const result = compareFiles(filtered1, filtered2)
    expect(result.stats.total).toBe(1)
    expect(result.items[0].status).toBe('only_in_p1')
  })
})

// ═══════════════════════════════════════════════════════════
// UC4: Config persistence
// ═══════════════════════════════════════════════════════════
describe('UC4: Config save & load', () => {
  it('should save config and reload with correct values', async () => {
    const config: SyncConfig = {
      ...getDefaultConfig(),
      selectedPaths: ['src/utils.ts', 'src/hooks'],
      extensions: ['.ts', '.tsx']
    }

    await saveConfig(FIXTURE_A, tempP2, config)
    const loaded = await loadConfig(FIXTURE_A, tempP2)

    expect(loaded.selectedPaths).toEqual(['src/utils.ts', 'src/hooks'])
    expect(loaded.extensions).toEqual(['.ts', '.tsx'])
    expect(loaded.backup.enabled).toBe(true)
  })

  it('should return default config when no config file exists', async () => {
    const config = await loadConfig('/nonexistent/p1', '/nonexistent/p2')
    expect(config.ignore.length).toBeGreaterThan(0)
    expect(config.backup.enabled).toBe(true)
    expect(config.selectedPaths).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════
// UC5: Manifest & conflict detection
// ═══════════════════════════════════════════════════════════
describe('UC5: Manifest & conflict workflow', () => {
  it('should save and load manifest with file hashes', async () => {
    const manifest = {
      files: {
        'src/utils.ts': { lastSyncHashP1: 'abc123', lastSyncHashP2: 'def456' }
      }
    }

    await saveManifest(FIXTURE_A, tempP2, manifest)
    const loaded = await loadManifest(FIXTURE_A, tempP2)

    expect(loaded.files['src/utils.ts'].lastSyncHashP1).toBe('abc123')
    expect(loaded.files['src/utils.ts'].lastSyncHashP2).toBe('def456')
  })

  it('should return empty manifest when no file exists', async () => {
    const manifest = await loadManifest('/nonexistent/p1', '/nonexistent/p2')
    expect(manifest.files).toEqual({})
  })

  it('should update manifest after sync with current hashes', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    const p1Hashes = new Map<string, string>()
    const p2Hashes = new Map<string, string>()
    for (const [k, v] of scan1.files) p1Hashes.set(k, v.hash)
    for (const [k, v] of scan2.files) p2Hashes.set(k, v.hash)

    await updateManifestAfterSync(FIXTURE_A, tempP2, ['src/utils.ts'], p1Hashes, p2Hashes)

    const manifest = await loadManifest(FIXTURE_A, tempP2)
    expect(manifest.files['src/utils.ts']).toBeDefined()
    expect(manifest.files['src/utils.ts'].lastSyncHashP1).toBe(scan1.files.get('src/utils.ts')!.hash)
  })

  it('should detect conflict when both sides changed since last sync', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    // Simulate old manifest where both hashes are stale
    const manifest = {
      files: {
        'src/hooks/useAuth.ts': {
          lastSyncHashP1: 'old-p1-hash',
          lastSyncHashP2: 'old-p2-hash'
        }
      }
    }

    await saveManifest(FIXTURE_A, tempP2, manifest)
    const loadedManifest = await loadManifest(FIXTURE_A, tempP2)

    const result = compareFiles(scan1.files, scan2.files, loadedManifest)
    const file = result.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
    expect(file.status).toBe('conflict')
    expect(result.stats.conflict).toBe(1)
  })

  it('should NOT detect conflict when only one side changed', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    const p1Hash = scan1.files.get('src/hooks/useAuth.ts')!.hash
    const manifest = {
      files: {
        'src/hooks/useAuth.ts': {
          lastSyncHashP1: p1Hash,   // P1 unchanged
          lastSyncHashP2: 'old-hash' // P2 changed
        }
      }
    }

    await saveManifest(FIXTURE_A, tempP2, manifest)
    const loadedManifest = await loadManifest(FIXTURE_A, tempP2)

    const result = compareFiles(scan1.files, scan2.files, loadedManifest)
    const file = result.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
    expect(file.status).toBe('modified')
  })
})

// ═══════════════════════════════════════════════════════════
// UC6: Undo sync via backup restore
// ═══════════════════════════════════════════════════════════
describe('UC6: Undo sync (restore from backup)', () => {
  it('should restore original P2 content after undo', async () => {
    // Read original P2 content before sync
    const originalP2Content = await fs.promises.readFile(
      path.join(tempP2, 'src/hooks/useAuth.ts'), 'utf-8'
    )

    // Sync P1 → P2
    const syncResult = await syncFiles({
      from: 'p1', to: 'p2',
      files: ['src/hooks/useAuth.ts'],
      p1Root: FIXTURE_A, p2Root: tempP2
    }, testConfig)

    expect(syncResult.backupPaths.length).toBe(1)

    // P2 now has P1's content
    const afterSync = await fs.promises.readFile(
      path.join(tempP2, 'src/hooks/useAuth.ts'), 'utf-8'
    )
    expect(afterSync).not.toBe(originalP2Content)

    // Undo: restore backup
    const { restoreBackup } = await import('../../src/main/services/backup')
    await restoreBackup(syncResult.backupPaths[0], tempP2, 'src/hooks/useAuth.ts')

    // P2 should be back to original
    const afterUndo = await fs.promises.readFile(
      path.join(tempP2, 'src/hooks/useAuth.ts'), 'utf-8'
    )
    expect(afterUndo).toBe(originalP2Content)
  })
})
