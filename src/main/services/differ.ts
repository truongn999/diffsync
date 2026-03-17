import * as fs from 'fs'
import * as path from 'path'
import { diffLines } from 'diff'
import type { DiffResult, DiffLine } from '../../shared/types'

/**
 * Generates line-level diff for a single file between two projects.
 * Produces aligned side-by-side output with empty padding.
 */
export async function generateDiff(
  p1Root: string,
  p2Root: string,
  relativePath: string
): Promise<DiffResult> {
  const p1Path = path.join(p1Root, relativePath)
  const p2Path = path.join(p2Root, relativePath)

  const p1Content = await safeReadFile(p1Path)
  const p2Content = await safeReadFile(p2Path)

  const changes = diffLines(p1Content, p2Content)

  const p1Lines: DiffLine[] = []
  const p2Lines: DiffLine[] = []
  let p1LineNum = 1
  let p2LineNum = 1
  let additions = 0
  let deletions = 0

  for (const change of changes) {
    const lines = (change.value || '').replace(/\n$/, '').split('\n')

    if (change.added) {
      // Lines added in p2
      for (const line of lines) {
        p1Lines.push({ num: 0, content: '', type: 'empty' })
        p2Lines.push({ num: p2LineNum++, content: line, type: 'add' })
        additions++
      }
    } else if (change.removed) {
      // Lines removed from p1
      for (const line of lines) {
        p1Lines.push({ num: p1LineNum++, content: line, type: 'remove' })
        p2Lines.push({ num: 0, content: '', type: 'empty' })
        deletions++
      }
    } else {
      // Unchanged lines
      for (const line of lines) {
        p1Lines.push({ num: p1LineNum++, content: line, type: 'normal' })
        p2Lines.push({ num: p2LineNum++, content: line, type: 'normal' })
      }
    }
  }

  return {
    relativePath,
    p1Content,
    p2Content,
    p1Lines,
    p2Lines,
    stats: { additions, deletions }
  }
}

async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8')
  } catch {
    return '' // File doesn't exist on this side
  }
}
