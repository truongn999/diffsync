import { useAppStore } from '../store/useAppStore'
import type { SyncHistoryEntry, RecentProject } from '../../shared/types'
import { useState, useEffect } from 'react'

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
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])

  // Load recent projects on mount
  useEffect(() => {
    window.electronAPI.getRecentProjects().then(setRecentProjects).catch(() => {})
  }, [])

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
      // Auto-save to recent projects
      window.electronAPI.addRecentProject(p1Path, p2Path).then(setRecentProjects).catch(() => {})
      onOpenScopeSelector()
    } catch (err) {
      addToast(`Scan failed: ${err}`, 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      if (p1Path) await window.electronAPI.saveConfig(p1Path, config)
      if (p2Path) await window.electronAPI.saveConfig(p2Path, config)
      addToast('Config saved', 'success')
    } catch {
      addToast('Failed to save config', 'error')
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
              {recentProjects.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>No recent projects</p>
              ) : (
                recentProjects.map(rp => (
                  <div key={rp.id} className="recent-item" onClick={() => {
                    setP1Path(rp.p1Path)
                    setP2Path(rp.p2Path)
                    addToast(`Loaded: ${rp.name}`, 'info')
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="recent-item__name">{rp.name}</span>
                      <span className="recent-item__path">{rp.p1Path}</span>
                    </div>
                    <button className="recent-item__delete" title="Remove" onClick={(e) => {
                      e.stopPropagation()
                      window.electronAPI.removeRecentProject(rp.id).then(setRecentProjects)
                    }}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Config Tab */}
      {sidebarTab === 'config' && (
        <div className="sidebar__config-scroll">
          {/* Ignore Patterns */}
          <div className="sidebar__section">
            <label className="path-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 01.2 12.52M5.64 17.36a9 9 0 01-.2-12.52"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              Ignore Patterns
            </label>
            <div className="config-chips">
              {config.ignore.map((pattern, i) => (
                <span key={i} className="config-chip">
                  {pattern}
                  <button className="config-chip__remove" onClick={() => {
                    const next = { ...config, ignore: config.ignore.filter((_, idx) => idx !== i) }
                    setConfig(next)
                  }}>×</button>
                </span>
              ))}
              <input
                className="config-chip-input"
                placeholder="+ Add pattern"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    const val = (e.target as HTMLInputElement).value.trim()
                    setConfig({ ...config, ignore: [...config.ignore, val] });
                    (e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>

          {/* Extensions Filter */}
          <div className="sidebar__section">
            <label className="path-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
              Extensions Filter
            </label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
              Empty = all files. Add extensions to limit scan.
            </p>
            <div className="config-chips">
              {config.extensions.map((ext, i) => (
                <span key={i} className="config-chip config-chip--ext">
                  {ext}
                  <button className="config-chip__remove" onClick={() => {
                    const next = { ...config, extensions: config.extensions.filter((_, idx) => idx !== i) }
                    setConfig(next)
                  }}>×</button>
                </span>
              ))}
              <input
                className="config-chip-input"
                placeholder="+ .ts, .tsx"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    let val = (e.target as HTMLInputElement).value.trim()
                    if (!val.startsWith('.')) val = '.' + val
                    setConfig({ ...config, extensions: [...config.extensions, val] });
                    (e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>

          {/* Backup Settings */}
          <div className="sidebar__section">
            <label className="path-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Backup
            </label>
            <div className="config-toggle-row">
              <span style={{ fontSize: 12 }}>Create backups before sync</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.backup.enabled}
                  onChange={(e) => setConfig({ ...config, backup: { ...config.backup, enabled: e.target.checked } })}
                />
                <span className="toggle-switch__slider" />
              </label>
            </div>
            {config.backup.enabled && (
              <input
                className="config-dir-input"
                value={config.backup.directory}
                onChange={(e) => setConfig({ ...config, backup: { ...config.backup, directory: e.target.value } })}
                placeholder="Backup directory"
              />
            )}
          </div>

          {/* Advanced JSON toggle */}
          <div className="sidebar__section">
            <details className="config-advanced">
              <summary className="config-advanced__summary">Advanced (JSON)</summary>
              <textarea
                className="config-editor__textarea"
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setConfig(parsed)
                  } catch { /* ignore parse errors while typing */ }
                }}
                spellCheck={false}
              />
            </details>
          </div>

          {/* Save / Reset */}
          <div className="sidebar__section">
            <div className="config-editor__actions">
              <button className="btn btn--sm" onClick={() => {
                const defaultConfig = {
                  groups: [], ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'out/**', 'release/**', '.next/**', '.nuxt/**', '.sync-backup/**', '.sync-manifest.json', 'sync.config.json', '.env*', '*.log', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
                  extensions: [], backup: { enabled: true, directory: '.sync-backup' }, selectedPaths: []
                }
                setConfig(defaultConfig)
                addToast('Config reset to defaults', 'info')
              }}>Reset</button>
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
            <>
              <div className="history-list">
                {syncHistory.map(entry => (
                  <details key={entry.id} className="history-entry">
                    <summary className="history-entry__summary">
                      <div className="history-entry__info">
                        <span className="history-entry__dir">{entry.from}</span>
                        <span className="history-entry__meta">
                          {entry.files.length} files · {timeAgo(entry.timestamp)}
                        </span>
                      </div>
                    </summary>
                    <div className="history-entry__files">
                      {entry.files.map((f, i) => (
                        <div key={i} className="history-entry__file">{f}</div>
                      ))}
                      <button
                        className="btn btn--danger btn--xs"
                        style={{ marginTop: 6, width: '100%' }}
                        onClick={() => {
                          if (window.confirm(`Undo sync of ${entry.files.length} files?`)) {
                            handleUndo(entry)
                          }
                        }}
                      >↩ Undo this sync</button>
                    </div>
                  </details>
                ))}
              </div>
              <button
                className="btn btn--ghost btn--xs"
                style={{ marginTop: 8, width: '100%', fontSize: 10 }}
                onClick={async () => {
                  if (window.confirm('Clear all sync history?')) {
                    // Clear all entries one by one
                    for (const entry of syncHistory) {
                      await window.electronAPI.undoSync(entry.id).catch(() => {})
                    }
                    setSyncHistory([])
                    addToast('History cleared', 'info')
                  }
                }}
              >Clear all history</button>
            </>
          )}
        </div>
      )}
    </aside>
  )
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
