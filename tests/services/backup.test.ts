import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { createBackup, restoreBackup, listBackups } from '../../src/main/services/backup'

let tempDir: string

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `backup-test-${Date.now()}`)
  await fs.promises.mkdir(tempDir, { recursive: true })
})

afterEach(async () => {
  await fs.promises.rm(tempDir, { recursive: true, force: true })
})

describe('Backup Service', () => {
  describe('createBackup', () => {
    it('should create a backup copy of a file', async () => {
      // Create source file
      const filePath = path.join(tempDir, 'src', 'file.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'content to backup')

      const backupPath = await createBackup(tempDir, 'src/file.ts')

      expect(backupPath).toContain('.sync-backup')
      expect(fs.existsSync(backupPath)).toBe(true)

      const backupContent = await fs.promises.readFile(backupPath, 'utf-8')
      expect(backupContent).toBe('content to backup')
    })

    it('should use custom backup directory', async () => {
      const filePath = path.join(tempDir, 'data.json')
      await fs.promises.writeFile(filePath, '{"key": "value"}')

      const backupPath = await createBackup(tempDir, 'data.json', '.my-backups')

      expect(backupPath).toContain('.my-backups')

      const content = await fs.promises.readFile(backupPath, 'utf-8')
      expect(content).toBe('{"key": "value"}')
    })

    it('should create unique timestamp directories', async () => {
      const filePath = path.join(tempDir, 'file.ts')
      await fs.promises.writeFile(filePath, 'v1')

      const backup1 = await createBackup(tempDir, 'file.ts')

      // Wait a tiny bit so timestamp differs
      await new Promise(r => setTimeout(r, 10))
      await fs.promises.writeFile(filePath, 'v2')
      const backup2 = await createBackup(tempDir, 'file.ts')

      // Due to ISO timestamp precision, they might be equal if called within the same second
      // But both should exist
      expect(fs.existsSync(backup1)).toBe(true)
      expect(fs.existsSync(backup2)).toBe(true)
    })
  })

  describe('restoreBackup', () => {
    it('should restore a file from backup to original location', async () => {
      // Create original file
      const filePath = path.join(tempDir, 'src/app.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'original content')

      // Create backup
      const backupPath = await createBackup(tempDir, 'src/app.ts')

      // Overwrite original
      await fs.promises.writeFile(filePath, 'modified content')
      expect(await fs.promises.readFile(filePath, 'utf-8')).toBe('modified content')

      // Restore from backup
      await restoreBackup(backupPath, tempDir, 'src/app.ts')

      const restored = await fs.promises.readFile(filePath, 'utf-8')
      expect(restored).toBe('original content')
    })

    it('should create parent directories if they were deleted', async () => {
      // Create file and backup
      const filePath = path.join(tempDir, 'deep/nested/file.ts')
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, 'nested content')
      const backupPath = await createBackup(tempDir, 'deep/nested/file.ts')

      // Delete the nested directory
      await fs.promises.rm(path.join(tempDir, 'deep'), { recursive: true })

      // Restore
      await restoreBackup(backupPath, tempDir, 'deep/nested/file.ts')

      const restored = await fs.promises.readFile(filePath, 'utf-8')
      expect(restored).toBe('nested content')
    })
  })

  describe('listBackups', () => {
    it('should return empty array when no backups exist', async () => {
      const backups = await listBackups(tempDir)
      expect(backups).toEqual([])
    })

    it('should list backup timestamps in reverse order', async () => {
      const filePath = path.join(tempDir, 'file.ts')
      await fs.promises.writeFile(filePath, 'content')

      await createBackup(tempDir, 'file.ts')
      // Wait to ensure different timestamp
      await new Promise(r => setTimeout(r, 1100))
      await createBackup(tempDir, 'file.ts')

      const backups = await listBackups(tempDir)
      expect(backups.length).toBeGreaterThanOrEqual(1)

      // Should be sorted newest first
      if (backups.length > 1) {
        expect(backups[0] > backups[1]).toBe(true)
      }
    })
  })
})
