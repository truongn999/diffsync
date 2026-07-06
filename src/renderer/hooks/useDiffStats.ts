import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'])

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

/**
 * Progressively computes diff stats (additions/deletions) for all changed files.
 * Runs in background batches to avoid blocking the UI.
 * Results are stored in the global store's diffStatsCache.
 */
export function useDiffStats() {
  const { compareResult, p1Path, p2Path, updateDiffStat, diffStatsCache } = useAppStore()
  const abortRef = useRef<boolean>(false)

  useEffect(() => {
    // Abort previous computation if compareResult changes
    abortRef.current = true

    if (!compareResult || !p1Path || !p2Path) return

    const filesToCompute = compareResult.items.filter(f => {
      if (f.status === 'same') return false
      // Skip images
      const ext = f.relativePath.split('.').pop()?.toLowerCase() || ''
      if (IMAGE_EXTENSIONS.has(ext)) return false
      // Skip already cached
      if (diffStatsCache.has(f.relativePath)) return false
      return true
    })

    if (filesToCompute.length === 0) return

    // Start new computation
    abortRef.current = false
    const currentAbort = { aborted: false }

    const computeBatch = async (startIndex: number) => {
      if (currentAbort.aborted) return

      const batch = filesToCompute.slice(startIndex, startIndex + BATCH_SIZE)
      if (batch.length === 0) return

      for (const file of batch) {
        if (currentAbort.aborted) return
        try {
          const diff = await window.electronAPI.getDiff(p1Path, p2Path, file.relativePath)
          if (currentAbort.aborted) return
          updateDiffStat(file.relativePath, {
            additions: diff.stats.additions,
            deletions: diff.stats.deletions
          })
        } catch {
          // Skip files that fail to diff
          if (currentAbort.aborted) return
          updateDiffStat(file.relativePath, { additions: 0, deletions: 0 })
        }
      }

      // Schedule next batch
      if (startIndex + BATCH_SIZE < filesToCompute.length) {
        setTimeout(() => computeBatch(startIndex + BATCH_SIZE), BATCH_DELAY_MS)
      }
    }

    // Start computation after a small delay to let initial render complete
    const timer = setTimeout(() => computeBatch(0), 200)

    return () => {
      currentAbort.aborted = true
      abortRef.current = true
      clearTimeout(timer)
    }
  }, [compareResult, p1Path, p2Path])
  // NOTE: intentionally omitting diffStatsCache and updateDiffStat from deps
  // to avoid re-running the effect when cache updates (which would cause infinite loop)
}
