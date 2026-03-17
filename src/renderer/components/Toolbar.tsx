import { useAppStore } from '../store/useAppStore'
import type { FileStatus } from '../../shared/types'

const FILTERS: { key: FileStatus | 'all'; label: string; color?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'modified', label: 'Modified', color: 'var(--color-modified)' },
  { key: 'only_in_p1', label: 'Only P1', color: 'var(--color-only-p1)' },
  { key: 'only_in_p2', label: 'Only P2', color: 'var(--color-only-p2)' },
  { key: 'conflict', label: 'Conflict', color: 'var(--color-conflict)' },
  { key: 'same', label: 'Same', color: 'var(--color-same)' },
]

interface ToolbarProps {
  onShowShortcuts: () => void
}

export default function Toolbar({ onShowShortcuts }: ToolbarProps) {
  const {
    compareResult, currentFilter, setFilter, isComparing,
    p1Path, p2Path, config, setCompareResult, setIsComparing,
    addToast, selectedFiles, isSyncing, setIsSyncing, setSyncProgress,
    setSyncHistory
  } = useAppStore()

  const handleCompare = async () => {
    if (!p1Path || !p2Path) {
      addToast('Please select both project folders first', 'error')
      return
    }
    setIsComparing(true)
    try {
      const result = await window.electronAPI.compareProjects(p1Path, p2Path, config)
      setCompareResult(result)
      addToast(`Compared ${result.stats.total} files`, 'success')
    } catch (err) {
      addToast(`Compare failed: ${err}`, 'error')
    } finally {
      setIsComparing(false)
    }
  }

  const handleSync = async (direction: 'p1-to-p2' | 'p2-to-p1') => {
    if (!p1Path || !p2Path || selectedFiles.size === 0) return
    setIsSyncing(true)
    try {
      const result = await window.electronAPI.syncFiles({
        from: direction === 'p1-to-p2' ? 'p1' : 'p2',
        to: direction === 'p1-to-p2' ? 'p2' : 'p1',
        files: [...selectedFiles],
        p1Root: p1Path,
        p2Root: p2Path
      }, config)

      if (result.success) {
        addToast(`Synced ${result.syncedFiles.length} files`, 'success')
      } else {
        addToast(`Sync completed with ${result.failedFiles.length} errors`, 'error')
      }

      const history = await window.electronAPI.getHistory()
      setSyncHistory(history)
      handleCompare()
    } catch (err) {
      addToast(`Sync failed: ${err}`, 'error')
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  const stats = compareResult?.stats

  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <div className="toolbar__group">
          <button className="btn btn--primary" onClick={handleCompare} disabled={isComparing || !p1Path || !p2Path}>
            {isComparing ? <><span className="spinner" /> Comparing...</> : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18"/></svg> Compare</>
            )}
          </button>
          <button className="btn btn--ghost" onClick={handleCompare} disabled={isComparing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Refresh
          </button>
          <div className="toolbar__separator" />
          <button className="btn btn--ghost btn--sm" onClick={onShowShortcuts} title="Keyboard Shortcuts">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/></svg>
          </button>
        </div>
      </div>

      <div className="toolbar__center">
        {stats ? FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-chip ${currentFilter === f.key ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.color && <span className="filter-chip__dot" style={{ background: f.color }} />}
            {f.label}
            <span>{f.key === 'all' ? stats.total : stats[f.key as FileStatus] || 0}</span>
          </button>
        )) : (
          <span className="toolbar__status">Select two projects and compare</span>
        )}
      </div>

      <div className="toolbar__right">
        <button className="btn btn--accent" onClick={() => handleSync('p1-to-p2')} disabled={selectedFiles.size === 0 || isSyncing}>
          → Sync P1 → P2
        </button>
        <button className="btn" onClick={() => handleSync('p2-to-p1')} disabled={selectedFiles.size === 0 || isSyncing}>
          ← Sync P2 → P1
        </button>
      </div>
    </div>
  )
}
