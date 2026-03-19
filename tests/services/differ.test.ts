import { describe, it, expect } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { generateDiff } from '../../src/main/services/differ'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')
const FIXTURE_B = path.resolve(__dirname, '../fixtures/project-b')

describe('Differ Service', () => {
  // ─────────────────────────────────────────────────────────
  // Identical Files
  // ─────────────────────────────────────────────────────────
  describe('Identical files (src/utils.ts)', () => {
    it('should produce zero additions and zero deletions', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')
      expect(result.relativePath).toBe('src/utils.ts')
      expect(result.stats.additions).toBe(0)
      expect(result.stats.deletions).toBe(0)
    })

    it('should mark all lines as "normal" type', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')
      for (const line of result.p1Lines) {
        expect(line.type).toBe('normal')
      }
      for (const line of result.p2Lines) {
        expect(line.type).toBe('normal')
      }
    })

    it('should have matching line counts between P1 and P2', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')
      expect(result.p1Lines.length).toBe(result.p2Lines.length)
    })

    it('should return identical p1Content and p2Content', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')
      expect(result.p1Content).toBe(result.p2Content)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Modified Files
  // ─────────────────────────────────────────────────────────
  describe('Modified files (src/hooks/useAuth.ts)', () => {
    it('should detect additions and deletions', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')
      expect(result.stats.additions).toBeGreaterThan(0)
      expect(result.stats.deletions).toBeGreaterThan(0)
    })

    it('should have aligned P1 and P2 line arrays (same length)', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')
      expect(result.p1Lines.length).toBe(result.p2Lines.length)
    })

    it('should pair "remove" lines in P1 with "empty" lines in P2', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')
      for (let i = 0; i < result.p1Lines.length; i++) {
        if (result.p1Lines[i].type === 'remove') {
          expect(result.p2Lines[i].type).toBe('empty')
          expect(result.p2Lines[i].num).toBe(0)
          expect(result.p2Lines[i].content).toBe('')
        }
      }
    })

    it('should pair "add" lines in P2 with "empty" lines in P1', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')
      for (let i = 0; i < result.p2Lines.length; i++) {
        if (result.p2Lines[i].type === 'add') {
          expect(result.p1Lines[i].type).toBe('empty')
          expect(result.p1Lines[i].num).toBe(0)
          expect(result.p1Lines[i].content).toBe('')
        }
      }
    })

    it('should include both contents and they should differ', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')
      expect(result.p1Content).toContain('useAuth')
      expect(result.p2Content).toContain('useAuth')
      expect(result.p1Content).not.toBe(result.p2Content)
    })
  })

  // ─────────────────────────────────────────────────────────
  // File Only in One Project
  // ─────────────────────────────────────────────────────────
  describe('File only in P1 (src/constants.ts)', () => {
    it('should have non-empty P1 content and empty P2 content', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/constants.ts')
      expect(result.p1Content.length).toBeGreaterThan(0)
      expect(result.p2Content).toBe('')
    })

    it('should count all lines as deletions, zero additions', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/constants.ts')
      expect(result.stats.deletions).toBeGreaterThan(0)
      expect(result.stats.additions).toBe(0)
    })

    it('should mark all P1 lines as "remove" type', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/constants.ts')
      for (const line of result.p1Lines) {
        expect(line.type).toBe('remove')
      }
    })
  })

  describe('File only in P2 (src/helpers/debounce.ts)', () => {
    it('should have empty P1 content and non-empty P2 content', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/helpers/debounce.ts')
      expect(result.p1Content).toBe('')
      expect(result.p2Content.length).toBeGreaterThan(0)
    })

    it('should count all lines as additions, zero deletions', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/helpers/debounce.ts')
      expect(result.stats.additions).toBeGreaterThan(0)
      expect(result.stats.deletions).toBe(0)
    })

    it('should mark all P2 lines as "add" type', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/helpers/debounce.ts')
      for (const line of result.p2Lines) {
        expect(line.type).toBe('add')
      }
    })
  })

  // ─────────────────────────────────────────────────────────
  // File in Neither Project
  // ─────────────────────────────────────────────────────────
  describe('File in neither project', () => {
    it('should return empty contents and zero stats', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'nonexistent/file.ts')
      expect(result.p1Content).toBe('')
      expect(result.p2Content).toBe('')
      expect(result.stats.additions).toBe(0)
      expect(result.stats.deletions).toBe(0)
    })
  })

  // ─────────────────────────────────────────────────────────
  // Line Numbering
  // ─────────────────────────────────────────────────────────
  describe('Line numbering', () => {
    it('should produce sequential line numbers for "normal" lines in P1', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')
      let lastNum = 0
      for (const line of result.p1Lines) {
        if (line.type === 'normal' || line.type === 'remove') {
          expect(line.num).toBe(lastNum + 1)
          lastNum = line.num
        }
      }
    })

    it('should set num=0 for empty padding lines', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')
      for (const line of result.p1Lines) {
        if (line.type === 'empty') {
          expect(line.num).toBe(0)
        }
      }
      for (const line of result.p2Lines) {
        if (line.type === 'empty') {
          expect(line.num).toBe(0)
        }
      }
    })
  })

  // ─────────────────────────────────────────────────────────
  // Known Content Diff
  // ─────────────────────────────────────────────────────────
  describe('Diff with known content', () => {
    let tmpA: string
    let tmpB: string

    it('should correctly diff files with a single added line', async () => {
      tmpA = path.join(os.tmpdir(), `diff-a-${Date.now()}`)
      tmpB = path.join(os.tmpdir(), `diff-b-${Date.now()}`)
      await fs.promises.mkdir(tmpA, { recursive: true })
      await fs.promises.mkdir(tmpB, { recursive: true })

      await fs.promises.writeFile(path.join(tmpA, 'test.txt'), 'line1\nline2\n')
      await fs.promises.writeFile(path.join(tmpB, 'test.txt'), 'line1\nline2\nline3\n')

      const result = await generateDiff(tmpA, tmpB, 'test.txt')
      expect(result.stats.additions).toBe(1)
      expect(result.stats.deletions).toBe(0)

      // Cleanup
      await fs.promises.rm(tmpA, { recursive: true, force: true })
      await fs.promises.rm(tmpB, { recursive: true, force: true })
    })
  })
})
