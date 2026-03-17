/**
 * Integration Test: Full Scan → Compare → Diff → Sync → Verify flow
 *
 * Tests the entire pipeline end-to-end using real fixture directories.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
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
  ignore: ['node_modules/**', '.sync-backup/**', '.sync-manifest.json', 'sync.config.json'],
  extensions: ['.ts'],
  backup: { enabled: true, directory: '.sync-backup' },
  selectedPaths: []
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `integration-${Date.now()}`)
  tempP2 = path.join(tempDir, 'project-b-copy')

  // Copy project-b into tempDir so we can mutate it
  await copyDir(FIXTURE_B, tempP2)
})

afterEach(async () => {
  await fs.promises.rm(tempDir, { recursive: true, force: true })
})

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

describe('Integration: Full Sync Flow', () => {
  it('should scan → compare → identify all file statuses correctly', async () => {
    // Step 1: Scan both projects
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    expect(scan1.totalScanned).toBeGreaterThan(0)
    expect(scan2.totalScanned).toBeGreaterThan(0)

    // Step 2: Compare
    const result = compareFiles(scan1.files, scan2.files)

    expect(result.stats.total).toBe(4)
    expect(result.stats.same).toBe(1)       // utils.ts
    expect(result.stats.modified).toBe(1)    // useAuth.ts
    expect(result.stats.only_in_p1).toBe(1)  // constants.ts
    expect(result.stats.only_in_p2).toBe(1)  // debounce.ts
  })

  it('should scan → compare → diff a modified file → sync → verify', async () => {
    // Step 1: Scan
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    // Step 2: Compare
    const result = compareFiles(scan1.files, scan2.files)
    const modifiedFile = result.items.find(i => i.status === 'modified')!
    expect(modifiedFile).toBeDefined()
    expect(modifiedFile.relativePath).toBe('src/hooks/useAuth.ts')

    // Step 3: Generate diff
    const diff = await generateDiff(FIXTURE_A, tempP2, modifiedFile.relativePath)
    expect(diff.stats.additions).toBeGreaterThan(0)
    expect(diff.stats.deletions).toBeGreaterThan(0)
    expect(diff.p1Lines.length).toBe(diff.p2Lines.length)

    // Step 4: Sync P1 → P2 (copy P1's version to P2)
    const syncResult = await syncFiles({
      from: 'p1',
      to: 'p2',
      files: [modifiedFile.relativePath],
      p1Root: FIXTURE_A,
      p2Root: tempP2
    }, testConfig)

    expect(syncResult.success).toBe(true)
    expect(syncResult.syncedFiles).toContain(modifiedFile.relativePath)

    // A backup should have been created
    expect(syncResult.backupPaths.length).toBe(1)
    expect(fs.existsSync(syncResult.backupPaths[0])).toBe(true)

    // Step 5: Verify — after sync, P2 file should match P1
    const p1Content = await fs.promises.readFile(
      path.join(FIXTURE_A, modifiedFile.relativePath), 'utf-8'
    )
    const p2Content = await fs.promises.readFile(
      path.join(tempP2, modifiedFile.relativePath), 'utf-8'
    )
    expect(p2Content).toBe(p1Content)

    // Step 6: Re-compare — modified file should now be "same"
    const scan2After = await scanProject(tempP2, testConfig)
    const resultAfter = compareFiles(scan1.files, scan2After.files)
    const fileAfter = resultAfter.items.find(i => i.relativePath === modifiedFile.relativePath)!
    expect(fileAfter.status).toBe('same')
  })

  it('should sync a "only_in_p1" file to P2', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)
    const result = compareFiles(scan1.files, scan2.files)

    const onlyP1 = result.items.find(i => i.status === 'only_in_p1')!
    expect(onlyP1.relativePath).toBe('src/constants.ts')

    // Sync the only-in-P1 file to P2
    const syncResult = await syncFiles({
      from: 'p1', to: 'p2',
      files: [onlyP1.relativePath],
      p1Root: FIXTURE_A, p2Root: tempP2
    }, testConfig)

    expect(syncResult.success).toBe(true)

    // Verify the file now exists in P2
    const exists = fs.existsSync(path.join(tempP2, onlyP1.relativePath))
    expect(exists).toBe(true)

    // Re-compare — should now be "same"
    const scan2After = await scanProject(tempP2, testConfig)
    const resultAfter = compareFiles(scan1.files, scan2After.files)
    const after = resultAfter.items.find(i => i.relativePath === onlyP1.relativePath)!
    expect(after.status).toBe('same')
  })

  it('should respect scope filtering during comparison', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    // Filter to only hooks directory
    const filtered1 = filterByScope(scan1.files, ['src/hooks'])
    const filtered2 = filterByScope(scan2.files, ['src/hooks'])

    const result = compareFiles(filtered1, filtered2)

    // Should only compare useAuth.ts (the only file in hooks)
    expect(result.stats.total).toBe(1)
    expect(result.items[0].relativePath).toBe('src/hooks/useAuth.ts')
    expect(result.items[0].status).toBe('modified')
  })
})

describe('Integration: Config Management', () => {
  it('should save and load config with persistence', async () => {
    const config: SyncConfig = {
      ...getDefaultConfig(),
      selectedPaths: ['src/utils.ts', 'src/hooks'],
      extensions: ['.ts', '.tsx']
    }

    await saveConfig(tempDir, config)

    // Verify file was created
    const configPath = path.join(tempDir, 'sync.config.json')
    expect(fs.existsSync(configPath)).toBe(true)

    // Load and verify
    const loaded = await loadConfig(tempDir)
    expect(loaded.selectedPaths).toEqual(['src/utils.ts', 'src/hooks'])
    expect(loaded.extensions).toEqual(['.ts', '.tsx'])
    expect(loaded.backup.enabled).toBe(true)
  })

  it('should return default config when no file exists', async () => {
    const emptyDir = path.join(tempDir, 'empty')
    await fs.promises.mkdir(emptyDir, { recursive: true })

    const config = await loadConfig(emptyDir)
    expect(config.ignore).toBeDefined()
    expect(config.extensions.length).toBeGreaterThan(0)
    expect(config.backup.enabled).toBe(true)
  })

  it('should merge partial config with defaults', async () => {
    const partial = { extensions: ['.py'], ignore: ['__pycache__/**'] }
    const configPath = path.join(tempDir, 'sync.config.json')
    await fs.promises.writeFile(configPath, JSON.stringify(partial), 'utf-8')

    const loaded = await loadConfig(tempDir)
    // Partial fields should override
    expect(loaded.extensions).toEqual(['.py'])
    expect(loaded.ignore).toEqual(['__pycache__/**'])
    // Missing fields should use defaults
    expect(loaded.backup.enabled).toBe(true)
    expect(loaded.groups.length).toBeGreaterThan(0)
  })
})

describe('Integration: Manifest Management', () => {
  it('should save and load manifest', async () => {
    const manifest = {
      files: {
        'src/utils.ts': { lastSyncHashP1: 'abc123', lastSyncHashP2: 'def456' }
      }
    }

    await saveManifest(tempDir, manifest)

    const loaded = await loadManifest(tempDir)
    expect(loaded.files['src/utils.ts'].lastSyncHashP1).toBe('abc123')
    expect(loaded.files['src/utils.ts'].lastSyncHashP2).toBe('def456')
  })

  it('should return empty manifest when file does not exist', async () => {
    const emptyDir = path.join(tempDir, 'empty')
    await fs.promises.mkdir(emptyDir, { recursive: true })

    const manifest = await loadManifest(emptyDir)
    expect(manifest.files).toEqual({})
  })

  it('should update manifest after sync with current hashes', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    // Build hash maps
    const p1Hashes = new Map<string, string>()
    const p2Hashes = new Map<string, string>()
    for (const [k, v] of scan1.files) p1Hashes.set(k, v.hash)
    for (const [k, v] of scan2.files) p2Hashes.set(k, v.hash)

    // Update manifest
    await updateManifestAfterSync(
      tempDir,
      ['src/utils.ts', 'src/hooks/useAuth.ts'],
      p1Hashes,
      p2Hashes
    )

    const manifest = await loadManifest(tempDir)
    expect(manifest.files['src/utils.ts']).toBeDefined()
    expect(manifest.files['src/hooks/useAuth.ts']).toBeDefined()

    // Verify stored hashes match actual file hashes
    expect(manifest.files['src/utils.ts'].lastSyncHashP1).toBe(scan1.files.get('src/utils.ts')!.hash)
    expect(manifest.files['src/hooks/useAuth.ts'].lastSyncHashP2).toBe(scan2.files.get('src/hooks/useAuth.ts')!.hash)
  })

  it('should detect conflict after both sides change post-sync', async () => {
    const scan1 = await scanProject(FIXTURE_A, testConfig)
    const scan2 = await scanProject(tempP2, testConfig)

    // Simulate a manifest from a "previous sync" where hashes were different
    const manifest = {
      files: {
        'src/hooks/useAuth.ts': {
          lastSyncHashP1: 'old-p1-hash',  // differs from actual P1 hash
          lastSyncHashP2: 'old-p2-hash'   // differs from actual P2 hash
        }
      }
    }

    await saveManifest(tempDir, manifest)
    const loadedManifest = await loadManifest(tempDir)

    // Compare with manifest — should detect conflict
    const result = compareFiles(scan1.files, scan2.files, loadedManifest)
    const file = result.items.find(i => i.relativePath === 'src/hooks/useAuth.ts')!
    expect(file.status).toBe('conflict')
    expect(result.stats.conflict).toBe(1)
  })
})
