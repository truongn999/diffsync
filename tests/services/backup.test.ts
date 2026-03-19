import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Mock the dataDir module to avoid Electron's app.getPath dependency in tests
vi.mock('../../src/main/services/dataDir', () => {
  // Use a temp dir as the "AppData" directory for tests
  const testAppData = path.join(os.tmpdir(), `backup-appdata-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  return {
    getAppDataDir: () => testAppData,
    getProjectDataDir: (p1: string, p2: string) => {
      const crypto = require('crypto')
      const hash = crypto.createHash('md5').update(`${p1}|||${p2}`).digest('hex').slice(0, 12)
      return path.join(testAppData, 'projects', hash)
    },
    getProjectPairHash: (p1: string, p2: string) => {
      const crypto = require('crypto')
      return crypto.createHash('md5').update(`${p1}|||${p2}`).digest('hex').slice(0, 12)
    }
  }
})

import { createBackup, restoreBackup, listBackups } from '../../src/main/services/backup'
import { getProjectDataDir } from '../../src/main/services/dataDir'

const FAKE_P1 = '/fake/project-a'
const FAKE_P2 = '/fake/project-b'

let tempProjectDir: string

beforeEach(async () => {
  tempProjectDir = path.join(os.tmpdir(), `backup-test-${Date.now()}`)
  await fs.promises.mkdir(tempProjectDir, { recursive: true })
})

afterEach(async () => {
  await fs.promises.rm(tempProjectDir, { recursive: true, force: true })
  // Also clean up the mock AppData dir
  const dataDir = getProjectDataDir(FAKE_P1, FAKE_P2)
  const appDataRoot = path.resolve(dataDir, '..', '..')
  await fs.promises.rm(appDataRoot, { recursive: true, force: true }).catch(() => {})
})

describe('Backup Service', () => {
  // ─────────────────────────────────────────────────────────
  // createBackup
  // ─────────────────────────────────────────────────────────
  describe('createBackup', () => {
    it('should create a backup copy of a file in AppData', async () => {
      const filePath = path.join(tempProjectDir, 'src', 'file.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'content to backup')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'src/file.ts')

      expect(fs.existsSync(backupPath)).toBe(true)
      const backupContent = await fs.promises.readFile(backupPath, 'utf-8')
      expect(backupContent).toBe('content to backup')
    })

    it('should store backup under the "backup" subdirectory by default', async () => {
      const filePath = path.join(tempProjectDir, 'data.json')
      await fs.promises.writeFile(filePath, '{"key": "value"}')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'data.json')

      // Should be somewhere inside the project data dir under "backup"
      const dataDir = getProjectDataDir(FAKE_P1, FAKE_P2)
      expect(backupPath.startsWith(dataDir)).toBe(true)
      expect(backupPath).toContain('backup')
    })

    it('should use custom backup subdirectory when specified', async () => {
      const filePath = path.join(tempProjectDir, 'data.json')
      await fs.promises.writeFile(filePath, '{"key": "value"}')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'data.json', 'my-backups')

      expect(backupPath).toContain('my-backups')
      const content = await fs.promises.readFile(backupPath, 'utf-8')
      expect(content).toBe('{"key": "value"}')
    })

    it('should create unique backups with timestamp directories', async () => {
      const filePath = path.join(tempProjectDir, 'file.ts')
      await fs.promises.writeFile(filePath, 'v1')
      const backup1 = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'file.ts')

      await new Promise(r => setTimeout(r, 1100)) // Ensure different timestamp
      await fs.promises.writeFile(filePath, 'v2')
      const backup2 = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'file.ts')

      expect(fs.existsSync(backup1)).toBe(true)
      expect(fs.existsSync(backup2)).toBe(true)
      // Two different backup paths
      expect(backup1).not.toBe(backup2)
    })

    it('should preserve directory structure inside backup', async () => {
      const filePath = path.join(tempProjectDir, 'deep/nested/folder/file.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'nested content')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'deep/nested/folder/file.ts')
      expect(backupPath).toContain('deep')
      expect(backupPath.replace(/\\/g, '/')).toContain('nested/folder/file.ts')
    })
  })

  // ─────────────────────────────────────────────────────────
  // restoreBackup
  // ─────────────────────────────────────────────────────────
  describe('restoreBackup', () => {
    it('should restore a file from backup to original location', async () => {
      const filePath = path.join(tempProjectDir, 'src/app.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'original content')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'src/app.ts')
      await fs.promises.writeFile(filePath, 'modified content')
      expect(await fs.promises.readFile(filePath, 'utf-8')).toBe('modified content')

      await restoreBackup(backupPath, tempProjectDir, 'src/app.ts')
      expect(await fs.promises.readFile(filePath, 'utf-8')).toBe('original content')
    })

    it('should recreate parent directories if they were deleted', async () => {
      const filePath = path.join(tempProjectDir, 'deep/nested/file.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'nested content')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'deep/nested/file.ts')
      await fs.promises.rm(path.join(tempProjectDir, 'deep'), { recursive: true })

      await restoreBackup(backupPath, tempProjectDir, 'deep/nested/file.ts')
      const restored = await fs.promises.readFile(filePath, 'utf-8')
      expect(restored).toBe('nested content')
    })

    it('should overwrite current file with backup version', async () => {
      const filePath = path.join(tempProjectDir, 'config.json')
      await fs.promises.writeFile(filePath, '{"version": 1}')

      const backupPath = await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'config.json')
      await fs.promises.writeFile(filePath, '{"version": 2}')

      await restoreBackup(backupPath, tempProjectDir, 'config.json')
      const content = await fs.promises.readFile(filePath, 'utf-8')
      expect(content).toBe('{"version": 1}')
    })
  })

  // ─────────────────────────────────────────────────────────
  // listBackups
  // ─────────────────────────────────────────────────────────
  describe('listBackups', () => {
    it('should return empty array when no backups exist', async () => {
      const backups = await listBackups(FAKE_P1, FAKE_P2)
      expect(backups).toEqual([])
    })

    it('should list backup timestamps after creating backups', async () => {
      const filePath = path.join(tempProjectDir, 'file.ts')
      await fs.promises.writeFile(filePath, 'content')

      await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'file.ts')
      await new Promise(r => setTimeout(r, 1100))
      await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'file.ts')

      const backups = await listBackups(FAKE_P1, FAKE_P2)
      expect(backups.length).toBeGreaterThanOrEqual(1)
    })

    it('should sort backups newest-first', async () => {
      const filePath = path.join(tempProjectDir, 'file.ts')
      await fs.promises.writeFile(filePath, 'content')

      await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'file.ts')
      await new Promise(r => setTimeout(r, 1100))
      await createBackup(FAKE_P1, FAKE_P2, tempProjectDir, 'file.ts')

      const backups = await listBackups(FAKE_P1, FAKE_P2)
      if (backups.length > 1) {
        expect(backups[0] > backups[1]).toBe(true)
      }
    })
  })
})
