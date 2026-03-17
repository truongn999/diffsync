import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { syncFiles } from '../../src/main/services/syncer'
import type { SyncConfig } from '../../src/shared/types'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')

let tempDir: string

const baseConfig: SyncConfig = {
  groups: [],
  ignore: [],
  extensions: [],
  backup: { enabled: false, directory: '.sync-backup' },
  selectedPaths: []
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `sync-test-${Date.now()}`)
  await fs.promises.mkdir(tempDir, { recursive: true })
})

afterEach(async () => {
  await fs.promises.rm(tempDir, { recursive: true, force: true })
})

describe('Syncer Service', () => {
  it('should copy files from P1 to target directory', async () => {
    const result = await syncFiles({
      from: 'p1',
      to: 'p2',
      files: ['src/utils.ts'],
      p1Root: FIXTURE_A,
      p2Root: tempDir
    }, baseConfig)

    expect(result.success).toBe(true)
    expect(result.syncedFiles).toContain('src/utils.ts')
    expect(result.failedFiles).toHaveLength(0)

    // Verify file was actually copied
    const copied = await fs.promises.readFile(path.join(tempDir, 'src/utils.ts'), 'utf-8')
    const original = await fs.promises.readFile(path.join(FIXTURE_A, 'src/utils.ts'), 'utf-8')
    expect(copied).toBe(original)
  })

  it('should create parent directories if they do not exist', async () => {
    const result = await syncFiles({
      from: 'p1',
      to: 'p2',
      files: ['src/hooks/useAuth.ts'],
      p1Root: FIXTURE_A,
      p2Root: tempDir
    }, baseConfig)

    expect(result.success).toBe(true)
    const exists = fs.existsSync(path.join(tempDir, 'src/hooks/useAuth.ts'))
    expect(exists).toBe(true)
  })

  it('should sync multiple files', async () => {
    const result = await syncFiles({
      from: 'p1',
      to: 'p2',
      files: ['src/utils.ts', 'src/constants.ts', 'src/hooks/useAuth.ts'],
      p1Root: FIXTURE_A,
      p2Root: tempDir
    }, baseConfig)

    expect(result.success).toBe(true)
    expect(result.syncedFiles).toHaveLength(3)
  })

  it('should report progress via callback', async () => {
    const progress: { current: number; total: number; file: string }[] = []

    await syncFiles({
      from: 'p1',
      to: 'p2',
      files: ['src/utils.ts', 'src/constants.ts'],
      p1Root: FIXTURE_A,
      p2Root: tempDir
    }, baseConfig, (current, total, file) => {
      progress.push({ current, total, file })
    })

    expect(progress).toHaveLength(2)
    expect(progress[0]).toEqual({ current: 1, total: 2, file: 'src/utils.ts' })
    expect(progress[1]).toEqual({ current: 2, total: 2, file: 'src/constants.ts' })
  })

  it('should fail gracefully for non-existent source files', async () => {
    const result = await syncFiles({
      from: 'p1',
      to: 'p2',
      files: ['nonexistent/file.ts'],
      p1Root: FIXTURE_A,
      p2Root: tempDir
    }, baseConfig)

    expect(result.success).toBe(false)
    expect(result.failedFiles).toHaveLength(1)
    expect(result.failedFiles[0].path).toBe('nonexistent/file.ts')
  })

  it('should create backup when backup is enabled and target exists', async () => {
    // First, create a file in the target
    const targetFile = path.join(tempDir, 'src/utils.ts')
    await fs.promises.mkdir(path.dirname(targetFile), { recursive: true })
    await fs.promises.writeFile(targetFile, 'original content')

    const configWithBackup = {
      ...baseConfig,
      backup: { enabled: true, directory: '.sync-backup' }
    }

    const result = await syncFiles({
      from: 'p1',
      to: 'p2',
      files: ['src/utils.ts'],
      p1Root: FIXTURE_A,
      p2Root: tempDir
    }, configWithBackup)

    expect(result.success).toBe(true)
    expect(result.backupPaths.length).toBeGreaterThan(0)

    // Verify backup file exists
    const backupExists = fs.existsSync(result.backupPaths[0])
    expect(backupExists).toBe(true)

    // Verify backup content is the original
    const backupContent = await fs.promises.readFile(result.backupPaths[0], 'utf-8')
    expect(backupContent).toBe('original content')
  })
})
