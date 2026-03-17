import { useAppStore } from '../store/useAppStore'
import type { SyncHistoryEntry } from '../../shared/types'
import { useState } from 'react'

interface SidebarProps {
  collapsed: boolean
  onOpenScopeSelector: () => void
}

export default function Sidebar({ collapsed, onOpenScopeSelector }: SidebarProps) {
  const {
    sidebarTab, setSidebarTab, p1Path, p2Path, setP1Path, setP2Path,
    compareResult, config, setConfig, addToast, syncHistory, setSyncHistory,
    projectLoaded, scopeSelectedPaths, allScannedFiles,
    isScanning, setIsScanning, setProjectLoaded, setAllScannedFiles,
    setScopeSelectedPaths
  } = useAppStore()

  const [configText, setConfigText] = useState(JSON.stringify(config, null, 2))

  const handleSelectFolder = async (which: 'p1' | 'p2') => {
    const path = await window.electronAPI.selectFolder()
    if (path) {
      if (which === 'p1') setP1Path(path)
      else setP2Path(path)
    }
  }

  const handleLoadProject = async () => {
    if (!p1Path || !p2Path) {
      addToast('Please select both project folders first', 'error')
      return
    }
    setIsScanning(true)
    try {
      const [p1Files, p2Files] = await Promise.all([
        window.electronAPI.scanProject(p1Path, config),
        window.electronAPI.scanProject(p2Path, config)
      ])
      const allPaths = new Set([...p1Files.map(f => f.relativePath), ...p2Files.map(f => f.relativePath)])
      const allFiles = [...allPaths].sort()
      setAllScannedFiles(p1Files.concat(p2Files))
      setScopeSelectedPaths(new Set(allFiles))
      setProjectLoaded(true)
      addToast(`Scanned ${allPaths.size} files from both projects`, 'success')
      onOpenScopeSelector()
    } catch (err) {
      addToast(`Scan failed: ${err}`, 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      const parsed = JSON.parse(configText)
      setConfig(parsed)
      if (p1Path) await window.electronAPI.saveConfig(p1Path, parsed)
      addToast('Config saved', 'success')
    } catch {
      addToast('Invalid JSON', 'error')
    }
  }

  const handleUndo = async (entry: SyncHistoryEntry) => {
    const success = await window.electronAPI.undoSync(entry.id)
    if (success) {
      addToast('Sync undone', 'success')
      const history = await window.electronAPI.getHistory()
      setSyncHistory(history)
    } else {
      addToast('Failed to undo sync', 'error')
    }
  }

  const stats = compareResult?.stats
  const scopeCount = scopeSelectedPaths.size
  const totalCount = allScannedFiles.length ? new Set(allScannedFiles.map(f => f.relativePath)).size : 0

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar-tabs">
        {(['projects', 'config', 'history'] as const).map(tab => (
          <button
            key={tab}
            className={`sidebar-tab ${sidebarTab === tab ? 'sidebar-tab--active' : ''}`}
            onClick={() => setSidebarTab(tab)}
          >
            {tab === 'projects' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
            {tab === 'config' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.07-7.07l-1.41 1.41M7.22 16.78l-1.41 1.41M19.07 19.07l-1.41-1.41M7.22 7.22L5.81 5.81"/></svg>}
            {tab === 'history' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {sidebarTab === 'projects' && (
        <div>
          <div className="sidebar__section">
            <label className="path-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              Project 1 (Source)
            </label>
            <div className={`path-input ${p1Path ? 'path-input--active' : ''}`} onClick={() => handleSelectFolder('p1')}>
              <span className={`path-input__text ${!p1Path ? 'path-input__text--placeholder' : ''}`}>
                {p1Path || 'Click to select folder...'}
              </span>
              <button className="btn btn--xs">Browse</button>
            </div>
          </div>

          {/* Arrow divider between projects */}
          <div className="sidebar__divider">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sidebar__arrow">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>

          <div className="sidebar__section">
            <label className="path-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              Project 2 (Target)
            </label>
            <div className={`path-input ${p2Path ? 'path-input--active' : ''}`} onClick={() => handleSelectFolder('p2')}>
              <span className={`path-input__text ${!p2Path ? 'path-input__text--placeholder' : ''}`}>
                {p2Path || 'Click to select folder...'}
              </span>
              <button className="btn btn--xs">Browse</button>
            </div>
          </div>

          <div className="sidebar__section">
            <button className="btn btn--primary btn--full" onClick={handleLoadProject} disabled={isScanning || !p1Path || !p2Path}>
              {isScanning ? <><span className="spinner" /> Scanning...</> : (
                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Load Project</>
              )}
            </button>
            {projectLoaded && (
              <div className="scope-info">
                <span className="scope-info__icon">✓</span>
                <span className="scope-info__text">
                  {scopeCount === totalCount ? `All ${totalCount} files selected` : `${scopeCount} of ${totalCount} files selected`}
                </span>
                <button className="btn btn--ghost btn--xs" onClick={onOpenScopeSelector}>Edit Scope</button>
              </div>
            )}
          </div>

          {stats && (
            <div className="sidebar__section">
              <h4 className="sidebar__stats-title">Comparison Summary</h4>
              <div className="stat-grid">
                <div className="stat-card"><span className="stat-card__value">{stats.total}</span><span className="stat-card__label">Total Files</span></div>
                <div className="stat-card stat-card--modified"><span className="stat-card__value">{stats.modified}</span><span className="stat-card__label">Modified</span></div>
                <div className="stat-card stat-card--added"><span className="stat-card__value">{stats.only_in_p1}</span><span className="stat-card__label">Only in P1</span></div>
                <div className="stat-card stat-card--removed"><span className="stat-card__value">{stats.only_in_p2}</span><span className="stat-card__label">Only in P2</span></div>
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="sidebar__section">
            <label className="path-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Recent Projects
            </label>
            <div className="recent-list">
              <div className="recent-item">
                <span className="recent-item__name">hifunnel-dashboard</span>
                <span className="recent-item__path">~/projects/hifunnel-dashboard</span>
              </div>
              <div className="recent-item">
                <span className="recent-item__name">atlas-frontend</span>
                <span className="recent-item__path">~/projects/atlas-frontend</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {sidebarTab === 'config' && (
        <div className="sidebar__section">
          <div className="config-editor">
            <textarea
              className="config-editor__textarea"
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              spellCheck={false}
            />
            <div className="config-editor__actions">
              <button className="btn btn--sm" onClick={() => setConfigText(JSON.stringify(config, null, 2))}>Reset</button>
              <button className="btn btn--primary btn--sm" onClick={handleSaveConfig}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {sidebarTab === 'history' && (
        <div className="sidebar__section">
          {syncHistory.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No sync history yet</p>
          ) : (
            <div className="history-list">
              {syncHistory.map(entry => (
                <div key={entry.id} className="history-item">
                  <div className="history-item__header">
                    <span className="history-item__dir">{entry.from}</span>
                    <span className="history-item__time">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="history-item__files">{entry.files.length} files synced</div>
                  <button className="btn btn--danger btn--xs" style={{ marginTop: 4 }} onClick={() => handleUndo(entry)}>Undo</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
