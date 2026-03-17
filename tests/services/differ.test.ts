import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { generateDiff } from '../../src/main/services/differ'

const FIXTURE_A = path.resolve(__dirname, '../fixtures/project-a')
const FIXTURE_B = path.resolve(__dirname, '../fixtures/project-b')

describe('Differ Service', () => {
  describe('Identical files', () => {
    it('should produce no additions or deletions for identical files', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')

      expect(result.relativePath).toBe('src/utils.ts')
      expect(result.stats.additions).toBe(0)
      expect(result.stats.deletions).toBe(0)
    })

    it('should have all lines as normal type', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')

      for (const line of result.p1Lines) {
        expect(line.type).toBe('normal')
      }
      for (const line of result.p2Lines) {
        expect(line.type).toBe('normal')
      }
    })

    it('should have matching line counts', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')
      expect(result.p1Lines.length).toBe(result.p2Lines.length)
    })
  })

  describe('Modified files', () => {
    it('should detect additions and deletions', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')

      expect(result.stats.additions).toBeGreaterThan(0)
      expect(result.stats.deletions).toBeGreaterThan(0)
    })

    it('should have aligned p1 and p2 line arrays', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')

      // P1 and P2 lines should be aligned (same length)
      expect(result.p1Lines.length).toBe(result.p2Lines.length)
    })

    it('should mark removed lines in p1 with empty counterpart in p2', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')

      for (let i = 0; i < result.p1Lines.length; i++) {
        if (result.p1Lines[i].type === 'remove') {
          expect(result.p2Lines[i].type).toBe('empty')
          expect(result.p2Lines[i].num).toBe(0)
        }
      }
    })

    it('should mark added lines in p2 with empty counterpart in p1', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')

      for (let i = 0; i < result.p2Lines.length; i++) {
        if (result.p2Lines[i].type === 'add') {
          expect(result.p1Lines[i].type).toBe('empty')
          expect(result.p1Lines[i].num).toBe(0)
        }
      }
    })

    it('should include file contents', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/hooks/useAuth.ts')

      expect(result.p1Content).toContain('useAuth')
      expect(result.p2Content).toContain('useAuth')
    })
  })

  describe('File only in one project', () => {
    it('should handle file only in P1', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/constants.ts')

      // P1 has the file, P2 doesn't
      expect(result.p1Content.length).toBeGreaterThan(0)
      expect(result.p2Content).toBe('')
      expect(result.stats.deletions).toBeGreaterThan(0)
      expect(result.stats.additions).toBe(0)
    })

    it('should handle file only in P2', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/helpers/debounce.ts')

      // P2 has the file, P1 doesn't
      expect(result.p1Content).toBe('')
      expect(result.p2Content.length).toBeGreaterThan(0)
      expect(result.stats.additions).toBeGreaterThan(0)
      expect(result.stats.deletions).toBe(0)
    })
  })

  describe('Line numbering', () => {
    it('should have sequential line numbers for normal lines', async () => {
      const result = await generateDiff(FIXTURE_A, FIXTURE_B, 'src/utils.ts')

      let lastNum = 0
      for (const line of result.p1Lines) {
        if (line.type === 'normal') {
          expect(line.num).toBe(lastNum + 1)
          lastNum = line.num
        }
      }
    })
  })
})
