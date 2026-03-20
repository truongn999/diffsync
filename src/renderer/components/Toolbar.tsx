import { useAppStore } from '../store/useAppStore'
import type { FileStatus } from '../../shared/types'
import { useEffect, useRef } from 'react'

const FILTERS: { key: FileStatus | 'all'; label: string; color?: string }[] = [
  { key: 'all', label: 'Changes' },
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
    setSyncHistory, isWatching, setIsWatching, theme, setTheme,
    compareProgress, setCompareProgress
  } = useAppStore()

  const cleanupRef = useRef<(() => void) | null>(null)

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
      setCompareProgress(null)
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

  const handleToggleWatch = async () => {
    if (isWatching) {
      await window.electronAPI.stopWatching()
      if (cleanupRef.current) cleanupRef.current()
      cleanupRef.current = null
      setIsWatching(false)
      addToast('File watcher stopped', 'info')
    } else {
      if (!p1Path || !p2Path) {
        addToast('Select both projects first', 'error')
        return
      }
      try {
        await window.electronAPI.startWatching(p1Path, p2Path, config.ignore)
        cleanupRef.current = window.electronAPI.onFilesChanged(async () => {
          // Use getState() to always read fresh state, avoiding stale closures
          const state = useAppStore.getState()
          const { p1Path: currentP1, p2Path: currentP2, config: currentConfig } = state
          if (!currentP1 || !currentP2) return
          state.setIsComparing(true)
          try {
            const result = await window.electronAPI.compareProjects(currentP1, currentP2, currentConfig)
            useAppStore.getState().setCompareResult(result)
            useAppStore.getState().addToast(`Auto-refreshed: ${result.stats.total} files`, 'info')
          } catch (err) {
            useAppStore.getState().addToast(`Auto-refresh failed: ${err}`, 'error')
          } finally {
            useAppStore.getState().setIsComparing(false)
          }
        })
        setIsWatching(true)
        addToast('Watching for file changes...', 'success')
      } catch (err) {
        addToast(`Failed to start watcher: ${err}`, 'error')
      }
    }
  }

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current()
      window.electronAPI.stopWatching().catch(() => {})
    }
  }, [])

  // Listen for compare progress
  useEffect(() => {
    const cleanup = window.electronAPI.onCompareProgress((progress) => {
      useAppStore.getState().setCompareProgress(progress)
    })
    return cleanup
  }, [])

  const phaseLabel: Record<string, string> = {
    'scanning-p1': 'Scanning P1...',
    'scanning-p2': 'Scanning P2...',
    'comparing': 'Comparing files...'
  }

  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <div className="toolbar__group">
          <button className="btn btn--primary" onClick={handleCompare} disabled={isComparing || !p1Path || !p2Path}>
            {isComparing ? <><span className="spinner" /> {compareProgress ? `${Math.round(
              compareProgress.phase === 'scanning-p1' ? 16 :
              compareProgress.phase === 'scanning-p2' ? 50 :
              compareProgress.phase === 'comparing' ? 83 : 0
            )}%` : 'Comparing...'}</> : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18"/></svg> Compare</>
            )}
          </button>
          <button className="btn btn--ghost" onClick={handleCompare} disabled={isComparing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Refresh
          </button>
          <div className="toolbar__separator" />
          <button
            className={`btn btn--sm ${isWatching ? 'btn--accent' : 'btn--ghost'}`}
            onClick={handleToggleWatch}
            title={isWatching ? 'Stop watching' : 'Watch for changes'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {isWatching ? 'Watching' : 'Watch'}
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={async () => {
              if (!p1Path || !p2Path || !compareResult) {
                addToast('Run Compare first', 'error')
                return
              }
              const filePath = await window.electronAPI.exportReport(p1Path, p2Path, compareResult)
              if (filePath) addToast(`Report saved: ${filePath}`, 'success')
            }}
            disabled={!compareResult}
            title="Export Diff Report as HTML"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/>
            </svg>
            Export
          </button>
          <button className="btn btn--ghost btn--sm" onClick={onShowShortcuts} title="Keyboard Shortcuts">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/></svg>
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
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
        <button className="btn" onClick={() => {
          if (selectedFiles.size === 0) { addToast('No files selected. Check files in the list first.', 'error'); return }
          handleSync('p1-to-p2')
        }} disabled={isSyncing || !compareResult}>
          Sync P1 → P2{selectedFiles.size > 0 ? ` (${selectedFiles.size})` : ''}
        </button>
        <button className="btn" onClick={() => {
          if (selectedFiles.size === 0) { addToast('No files selected. Check files in the list first.', 'error'); return }
          handleSync('p2-to-p1')
        }} disabled={isSyncing || !compareResult}>
          Sync P2 → P1{selectedFiles.size > 0 ? ` (${selectedFiles.size})` : ''}
        </button>
      </div>
    </div>
  )
}
