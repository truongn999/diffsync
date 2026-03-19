import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Mock dataDir to avoid Electron dependency (createBackup uses getProjectDataDir)
const TEST_APPDATA = path.join(os.tmpdir(), `syncer-appdata-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

import { syncFiles } from '../../src/main/services/syncer'
import type { SyncConfig } from '../../src/shared/types'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')
const FIXTURE_B = path.resolve(__dirname, '../fixtures/project-b')

let tempDir: string
let tempP2: string

const baseConfig: SyncConfig = {
  groups: [],
  ignore: [],
  extensions: [],
  backup: { enabled: false, directory: 'backup' },
  selectedPaths: []
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `sync-test-${Date.now()}`)
  tempP2 = path.join(tempDir, 'target')
  await fs.promises.mkdir(tempP2, { recursive: true })
})

afterEach(async () => {
  await fs.promises.rm(tempDir, { recursive: true, force: true })
  await fs.promises.rm(TEST_APPDATA, { recursive: true, force: true }).catch(() => {})
})

describe('Syncer Service', () => {
  // ─────────────────────────────────────────────────────────
  // Basic Sync Operations
  // ─────────────────────────────────────────────────────────
  describe('Basic sync (P1 → P2)', () => {
    it('should copy a single file and verify content matches', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      expect(result.success).toBe(true)
      expect(result.syncedFiles).toContain('src/utils.ts')
      expect(result.failedFiles).toHaveLength(0)

      const copied = await fs.promises.readFile(path.join(tempP2, 'src/utils.ts'), 'utf-8')
      const original = await fs.promises.readFile(path.join(FIXTURE_A, 'src/utils.ts'), 'utf-8')
      expect(copied).toBe(original)
    })

    it('should create parent directories automatically', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/hooks/useAuth.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempP2, 'src/hooks/useAuth.ts'))).toBe(true)
    })

    it('should sync multiple files in one call', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts', 'src/constants.ts', 'src/hooks/useAuth.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      expect(result.success).toBe(true)
      expect(result.syncedFiles).toHaveLength(3)
    })

    it('should overwrite existing files in target', async () => {
      const targetFile = path.join(tempP2, 'src/utils.ts')
      await fs.promises.mkdir(path.dirname(targetFile), { recursive: true })
      await fs.promises.writeFile(targetFile, 'OLD CONTENT')

      await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      const content = await fs.promises.readFile(targetFile, 'utf-8')
      expect(content).not.toBe('OLD CONTENT')
      const original = await fs.promises.readFile(path.join(FIXTURE_A, 'src/utils.ts'), 'utf-8')
      expect(content).toBe(original)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Reverse Sync (P2 → P1)
  // ─────────────────────────────────────────────────────────
  describe('Reverse sync (P2 → P1)', () => {
    it('should copy from P2 to temp P1 directory', async () => {
      const tempP1 = path.join(tempDir, 'p1-target')
      await fs.promises.mkdir(tempP1, { recursive: true })

      const result = await syncFiles({
        from: 'p2', to: 'p1',
        files: ['src/helpers/debounce.ts'],
        p1Root: tempP1, p2Root: FIXTURE_B
      }, baseConfig)

      expect(result.success).toBe(true)
      expect(fs.existsSync(path.join(tempP1, 'src/helpers/debounce.ts'))).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Progress Reporting
  // ─────────────────────────────────────────────────────────
  describe('Progress reporting', () => {
    it('should call onProgress for each file with correct current/total', async () => {
      const progress: { current: number; total: number; file: string }[] = []

      await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts', 'src/constants.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig, (current, total, file) => {
        progress.push({ current, total, file })
      })

      expect(progress).toHaveLength(2)
      expect(progress[0]).toEqual({ current: 1, total: 2, file: 'src/utils.ts' })
      expect(progress[1]).toEqual({ current: 2, total: 2, file: 'src/constants.ts' })
    })

    it('should work correctly without onProgress callback', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)
      // No callback → should not crash
      expect(result.success).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Error Handling
  // ─────────────────────────────────────────────────────────
  describe('Error handling', () => {
    it('should fail gracefully for non-existent source files', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['nonexistent/file.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      expect(result.success).toBe(false)
      expect(result.failedFiles).toHaveLength(1)
      expect(result.failedFiles[0].path).toBe('nonexistent/file.ts')
      expect(result.failedFiles[0].error).toBeDefined()
    })

    it('should sync valid files and report invalid ones separately', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts', 'nonexistent.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      // success is false because there's at least 1 failed file
      expect(result.success).toBe(false)
      expect(result.syncedFiles).toContain('src/utils.ts')
      expect(result.failedFiles).toHaveLength(1)
      expect(result.failedFiles[0].path).toBe('nonexistent.ts')

      // Valid file should still have been copied
      expect(fs.existsSync(path.join(tempP2, 'src/utils.ts'))).toBe(true)
    })

    it('should handle empty files list', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: [],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, baseConfig)

      expect(result.success).toBe(true)
      expect(result.syncedFiles).toHaveLength(0)
      expect(result.failedFiles).toHaveLength(0)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Backup Integration
  // ─────────────────────────────────────────────────────────
  describe('Backup during sync', () => {
    it('should NOT create backup when backup.enabled is false', async () => {
      const targetFile = path.join(tempP2, 'src/utils.ts')
      await fs.promises.mkdir(path.dirname(targetFile), { recursive: true })
      await fs.promises.writeFile(targetFile, 'old content')

      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, { ...baseConfig, backup: { enabled: false, directory: 'backup' } })

      expect(result.success).toBe(true)
      expect(result.backupPaths).toHaveLength(0)
    })

    it('should create backup when backup is enabled and target file exists', async () => {
      const targetFile = path.join(tempP2, 'src/utils.ts')
      await fs.promises.mkdir(path.dirname(targetFile), { recursive: true })
      await fs.promises.writeFile(targetFile, 'original content before sync')

      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/utils.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, { ...baseConfig, backup: { enabled: true, directory: 'backup' } })

      expect(result.success).toBe(true)
      expect(result.backupPaths.length).toBeGreaterThan(0)

      // Verify backup file exists and has original content
      const backupContent = await fs.promises.readFile(result.backupPaths[0], 'utf-8')
      expect(backupContent).toBe('original content before sync')
    })

    it('should NOT create backup when target file does not exist (new file sync)', async () => {
      const result = await syncFiles({
        from: 'p1', to: 'p2',
        files: ['src/constants.ts'],
        p1Root: FIXTURE_A, p2Root: tempP2
      }, { ...baseConfig, backup: { enabled: true, directory: 'backup' } })

      expect(result.success).toBe(true)
      expect(result.backupPaths).toHaveLength(0)
    })
  })
})
