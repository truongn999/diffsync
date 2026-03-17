import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'path'
import { scanProject, filterByScope } from '../../src/main/services/scanner'
import type { SyncConfig, FileInfo } from '../../src/shared/types'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')

const baseConfig: SyncConfig = {
  groups: [],
  ignore: ['node_modules/**', '.sync-backup/**'],
  extensions: [],
  backup: { enabled: false, directory: '.sync-backup' },
  selectedPaths: []
}

describe('Scanner Service', () => {
  let scanResult: { files: Map<string, FileInfo>; totalScanned: number; duration: number }

  beforeAll(async () => {
    scanResult = await scanProject(FIXTURE_A, baseConfig)
  })

  it('should scan all files in the project directory', () => {
    expect(scanResult.totalScanned).toBeGreaterThanOrEqual(4)
    expect(scanResult.files.size).toBe(scanResult.totalScanned)
  })

  it('should include expected files', () => {
    expect(scanResult.files.has('src/utils.ts')).toBe(true)
    expect(scanResult.files.has('src/hooks/useAuth.ts')).toBe(true)
    expect(scanResult.files.has('src/constants.ts')).toBe(true)
    expect(scanResult.files.has('README.md')).toBe(true)
  })

  it('should compute MD5 hashes for each file', () => {
    for (const [, info] of scanResult.files) {
      expect(info.hash).toBeDefined()
      expect(info.hash).toMatch(/^[a-f0-9]{32}$/)
    }
  })

  it('should normalize paths to forward slashes', () => {
    for (const [key] of scanResult.files) {
      expect(key).not.toContain('\\')
    }
  })

  it('should include file metadata (size, mtime)', () => {
    const utils = scanResult.files.get('src/utils.ts')!
    expect(utils.size).toBeGreaterThan(0)
    expect(utils.mtime).toBeGreaterThan(0)
    expect(utils.relativePath).toBe('src/utils.ts')
  })

  it('should report positive duration', () => {
    expect(scanResult.duration).toBeGreaterThanOrEqual(0)
  })

  describe('Extension filtering', () => {
    it('should filter by extensions when specified', async () => {
      const tsConfig = { ...baseConfig, extensions: ['.ts'] }
      const result = await scanProject(FIXTURE_A, tsConfig)
      for (const [key] of result.files) {
        expect(key).toMatch(/\.ts$/)
      }
      // Should not include README.md
      expect(result.files.has('README.md')).toBe(false)
    })

    it('should include all files when extensions is empty', async () => {
      const result = await scanProject(FIXTURE_A, baseConfig)
      expect(result.files.has('README.md')).toBe(true)
      expect(result.files.has('src/utils.ts')).toBe(true)
    })
  })

  describe('filterByScope', () => {
    it('should return all files when selectedPaths is empty', () => {
      const filtered = filterByScope(scanResult.files, [])
      expect(filtered.size).toBe(scanResult.files.size)
    })

    it('should filter to exact paths', () => {
      const filtered = filterByScope(scanResult.files, ['src/utils.ts'])
      expect(filtered.size).toBe(1)
      expect(filtered.has('src/utils.ts')).toBe(true)
    })

    it('should filter files under a directory path', () => {
      const filtered = filterByScope(scanResult.files, ['src/hooks'])
      expect(filtered.has('src/hooks/useAuth.ts')).toBe(true)
      // Should not include files outside the selected path
      expect(filtered.has('src/utils.ts')).toBe(false)
    })

    it('should handle mixed file and directory paths', () => {
      const filtered = filterByScope(scanResult.files, ['README.md', 'src/hooks'])
      expect(filtered.has('README.md')).toBe(true)
      expect(filtered.has('src/hooks/useAuth.ts')).toBe(true)
      expect(filtered.has('src/utils.ts')).toBe(false)
    })
  })
})
