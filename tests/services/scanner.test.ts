import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { scanProject, filterByScope } from '../../src/main/services/scanner'
import type { SyncConfig, FileInfo } from '../../src/shared/types'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')
const FIXTURE_B = path.resolve(__dirname, '../fixtures/project-b')

const baseConfig: SyncConfig = {
  groups: [],
  ignore: ['node_modules/**', '.sync-backup/**'],
  extensions: [],
  backup: { enabled: false, directory: '.sync-backup' },
  selectedPaths: []
}

// ─────────────────────────────────────────────────────────────
// Scanner: Basic Scanning
// ─────────────────────────────────────────────────────────────
describe('Scanner Service', () => {
  let scanResult: { files: Map<string, FileInfo>; totalScanned: number; duration: number }

  beforeAll(async () => {
    scanResult = await scanProject(FIXTURE_A, baseConfig)
  })

  it('should scan all files in the project directory', () => {
    // project-a has: README.md, src/utils.ts, src/hooks/useAuth.ts, src/constants.ts
    expect(scanResult.totalScanned).toBe(4)
    expect(scanResult.files.size).toBe(scanResult.totalScanned)
  })

  it('should include all expected files from project-a', () => {
    expect(scanResult.files.has('src/utils.ts')).toBe(true)
    expect(scanResult.files.has('src/hooks/useAuth.ts')).toBe(true)
    expect(scanResult.files.has('src/constants.ts')).toBe(true)
    expect(scanResult.files.has('README.md')).toBe(true)
  })

  it('should compute valid MD5 hashes (32 hex chars)', () => {
    for (const [, info] of scanResult.files) {
      expect(info.hash).toBeDefined()
      expect(info.hash).toMatch(/^[a-f0-9]{32}$/)
    }
  })

  it('should return deterministic hashes for the same file content', async () => {
    const scan1 = await scanProject(FIXTURE_A, baseConfig)
    const scan2 = await scanProject(FIXTURE_A, baseConfig)
    for (const [key, info1] of scan1.files) {
      const info2 = scan2.files.get(key)!
      expect(info1.hash).toBe(info2.hash)
    }
  })

  it('should normalize all paths to forward slashes', () => {
    for (const [key] of scanResult.files) {
      expect(key).not.toContain('\\')
    }
  })

  it('should include correct file metadata (size > 0, mtime > 0, relativePath matches key)', () => {
    for (const [key, info] of scanResult.files) {
      expect(info.size).toBeGreaterThan(0)
      expect(info.mtime).toBeGreaterThan(0)
      expect(info.relativePath).toBe(key)
    }
  })

  it('should report positive or zero duration', () => {
    expect(scanResult.duration).toBeGreaterThanOrEqual(0)
  })

  it('should scan project-b with different file structure', async () => {
    const resultB = await scanProject(FIXTURE_B, baseConfig)
    // project-b has: README.md, src/utils.ts, src/hooks/useAuth.ts, src/helpers/debounce.ts
    expect(resultB.totalScanned).toBe(4)
    expect(resultB.files.has('src/helpers/debounce.ts')).toBe(true)
    expect(resultB.files.has('src/constants.ts')).toBe(false)
  })

  // ─────────────────────────────────────────────────────────
  // Extension Filtering
  // ─────────────────────────────────────────────────────────
  describe('Extension filtering', () => {
    it('should only include .ts files when extensions = [".ts"]', async () => {
      const tsConfig = { ...baseConfig, extensions: ['.ts'] }
      const result = await scanProject(FIXTURE_A, tsConfig)
      for (const [key] of result.files) {
        expect(key).toMatch(/\.ts$/)
      }
      expect(result.files.has('README.md')).toBe(false)
    })

    it('should include both .ts and .md files when extensions = [".ts", ".md"]', async () => {
      const multiConfig = { ...baseConfig, extensions: ['.ts', '.md'] }
      const result = await scanProject(FIXTURE_A, multiConfig)
      expect(result.files.has('README.md')).toBe(true)
      expect(result.files.has('src/utils.ts')).toBe(true)
    })

    it('should include all files when extensions is empty', async () => {
      const result = await scanProject(FIXTURE_A, baseConfig)
      expect(result.files.has('README.md')).toBe(true)
      expect(result.files.has('src/utils.ts')).toBe(true)
    })

    it('should return zero files when extension matches nothing', async () => {
      const noMatchConfig = { ...baseConfig, extensions: ['.xyz'] }
      const result = await scanProject(FIXTURE_A, noMatchConfig)
      expect(result.totalScanned).toBe(0)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Ignore Patterns
  // ─────────────────────────────────────────────────────────
  describe('Ignore patterns', () => {
    it('should ignore files matching ignore patterns', async () => {
      const ignoreConfig = { ...baseConfig, ignore: ['**/hooks/**'] }
      const result = await scanProject(FIXTURE_A, ignoreConfig)
      expect(result.files.has('src/hooks/useAuth.ts')).toBe(false)
      expect(result.files.has('src/utils.ts')).toBe(true)
    })

    it('should ignore specific files by name', async () => {
      const ignoreConfig = { ...baseConfig, ignore: ['README.md'] }
      const result = await scanProject(FIXTURE_A, ignoreConfig)
      expect(result.files.has('README.md')).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Empty Directory
  // ─────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('should handle empty directory gracefully', async () => {
      const emptyDir = path.join(os.tmpdir(), `scan-empty-${Date.now()}`)
      await fs.promises.mkdir(emptyDir, { recursive: true })
      try {
        const result = await scanProject(emptyDir, baseConfig)
        expect(result.totalScanned).toBe(0)
        expect(result.files.size).toBe(0)
      } finally {
        await fs.promises.rm(emptyDir, { recursive: true, force: true })
      }
    })
  })

  // ─────────────────────────────────────────────────────────
  // filterByScope
  // ─────────────────────────────────────────────────────────
  describe('filterByScope', () => {
    it('should return all files when selectedPaths is empty', () => {
      const filtered = filterByScope(scanResult.files, [])
      expect(filtered.size).toBe(scanResult.files.size)
    })

    it('should filter to exact file path', () => {
      const filtered = filterByScope(scanResult.files, ['src/utils.ts'])
      expect(filtered.size).toBe(1)
      expect(filtered.has('src/utils.ts')).toBe(true)
    })

    it('should filter files under a directory path', () => {
      const filtered = filterByScope(scanResult.files, ['src/hooks'])
      expect(filtered.has('src/hooks/useAuth.ts')).toBe(true)
      expect(filtered.has('src/utils.ts')).toBe(false)
    })

    it('should handle mixed file and directory paths', () => {
      const filtered = filterByScope(scanResult.files, ['README.md', 'src/hooks'])
      expect(filtered.has('README.md')).toBe(true)
      expect(filtered.has('src/hooks/useAuth.ts')).toBe(true)
      expect(filtered.has('src/utils.ts')).toBe(false)
      expect(filtered.has('src/constants.ts')).toBe(false)
    })

    it('should return empty map when no paths match', () => {
      const filtered = filterByScope(scanResult.files, ['nonexistent/path'])
      expect(filtered.size).toBe(0)
    })

    it('should handle selecting the entire src directory', () => {
      const filtered = filterByScope(scanResult.files, ['src'])
      // All .ts files are under src/, README.md is not
      expect(filtered.has('src/utils.ts')).toBe(true)
      expect(filtered.has('src/hooks/useAuth.ts')).toBe(true)
      expect(filtered.has('src/constants.ts')).toBe(true)
      expect(filtered.has('README.md')).toBe(false)
    })
  })
})
