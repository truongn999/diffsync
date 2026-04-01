import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { RecentProject } from '../../../shared/types'

interface ProjectsTabProps {
  onOpenScopeSelector: () => void
}

export default function ProjectsTab({ onOpenScopeSelector }: ProjectsTabProps) {
  const {
    p1Path, p2Path, setP1Path, setP2Path, addToast, config,
    compareResult, projectLoaded, scopeSelectedPaths, allScannedFiles,
    isScanning, setIsScanning, setProjectLoaded, setAllScannedFiles,
    setScopeSelectedPaths, setIsComparing, setCompareResult, setConfig
  } = useAppStore()

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [dragOverP1, setDragOverP1] = useState(false)
  const [dragOverP2, setDragOverP2] = useState(false)

  useEffect(() => {
    window.electronAPI.getRecentProjects().then(setRecentProjects).catch(() => {})
  }, [])

  const handleDrop = (which: 'p1' | 'p2') => (e: React.DragEvent) => {
    e.preventDefault()
    which === 'p1' ? setDragOverP1(false) : setDragOverP2(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const path = (files[0] as any).path as string
      if (path) {
        if (which === 'p1') setP1Path(path)
        else setP2Path(path)
        addToast(`Folder set: ${path}`, 'info')
      }
    }
  }

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
      window.electronAPI.addRecentProject(p1Path, p2Path).then(setRecentProjects).catch(() => {})
      onOpenScopeSelector()
    } catch (err) {
      addToast(`Scan failed: ${err}`, 'error')
    } finally {
      setIsScanning(false)
    }
  }

  const stats = compareResult?.stats
  const scopeCount = scopeSelectedPaths.size
  const totalCount = allScannedFiles.length ? new Set(allScannedFiles.map(f => f.relativePath)).size : 0

  return (
    <div>
      <div className="sidebar__section">
        <label className="path-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Project 1 (Source)
        </label>
        <div
          className={`path-input ${p1Path ? 'path-input--active' : ''} ${dragOverP1 ? 'path-input--dragover' : ''}`}
          onClick={() => handleSelectFolder('p1')}
          onDragOver={(e) => { e.preventDefault(); setDragOverP1(true) }}
          onDragLeave={() => setDragOverP1(false)}
          onDrop={handleDrop('p1')}
        >
          <span className={`path-input__text ${!p1Path ? 'path-input__text--placeholder' : ''}`}>
            {dragOverP1 ? 'Drop folder here...' : (p1Path || 'Click or drop folder...')}
          </span>
          <button className="btn btn--xs">Browse</button>
        </div>
      </div>

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
        <div
          className={`path-input ${p2Path ? 'path-input--active' : ''} ${dragOverP2 ? 'path-input--dragover' : ''}`}
          onClick={() => handleSelectFolder('p2')}
          onDragOver={(e) => { e.preventDefault(); setDragOverP2(true) }}
          onDragLeave={() => setDragOverP2(false)}
          onDrop={handleDrop('p2')}
        >
          <span className={`path-input__text ${!p2Path ? 'path-input__text--placeholder' : ''}`}>
            {dragOverP2 ? 'Drop folder here...' : (p2Path || 'Click or drop folder...')}
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
                  if (confirm(`Remove "${rp.name}" from recent projects?`)) {
                    window.electronAPI.removeRecentProject(rp.id).then(setRecentProjects)
                    if (p1Path === rp.p1Path && p2Path === rp.p2Path) {
                      setP1Path('')
                      setP2Path('')
                      setCompareResult(null)
                      useAppStore.getState().setActiveFile(null)
                      useAppStore.getState().setDiffResult(null)
                      addToast('Active project removed, paths reset', 'info')
                    }
                  }
                }}>×</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
