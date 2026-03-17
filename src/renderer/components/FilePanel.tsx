import { useAppStore } from '../store/useAppStore'
import type { CompareItem } from '../../shared/types'
import { useState } from 'react'

export default function FilePanel() {
  const {
    compareResult, getFilteredFiles, searchQuery, setSearchQuery,
    viewMode, setViewMode, selectedFiles, toggleFileSelection,
    selectAllFiles, deselectAllFiles, activeFile, setActiveFile,
    setDiffResult, setIsDiffLoading, p1Path, p2Path, addToast
  } = useAppStore()

  const files = getFilteredFiles()
  const allSelected = files.length > 0 && files.every(f => selectedFiles.has(f.relativePath))

  const handleFileClick = async (file: CompareItem) => {
    setActiveFile(file)
    if (file.status !== 'same' && p1Path && p2Path) {
      setIsDiffLoading(true)
      try {
        const diff = await window.electronAPI.getDiff(p1Path, p2Path, file.relativePath)
        setDiffResult(diff)
      } catch (err) {
        addToast(`Failed to load diff: ${err}`, 'error')
      } finally {
        setIsDiffLoading(false)
      }
    } else {
      setDiffResult(null)
    }
  }

  const statusLabels: Record<string, string> = {
    same: 'SAME', modified: 'MODIFIED', only_in_p1: 'ONLY P1',
    only_in_p2: 'ONLY P2', conflict: 'CONFLICT'
  }

  return (
    <div className="file-panel">
      <div className="file-panel__toolbar">
        <div className="file-panel__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            id="searchInput"
            type="text"
            placeholder="Search files... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button className={`view-toggle__btn ${viewMode === 'flat' ? 'view-toggle__btn--active' : ''}`} onClick={() => setViewMode('flat')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button className={`view-toggle__btn ${viewMode === 'tree' ? 'view-toggle__btn--active' : ''}`} onClick={() => setViewMode('tree')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </button>
        </div>
      </div>

      <div className="file-list">
        {!compareResult ? (
          <div className="diff-panel__placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            <p>Click Compare to scan files</p>
          </div>
        ) : (
          <>
            <div className="file-header">
              <div className="file-row__check">
                <input type="checkbox" checked={allSelected} onChange={() => allSelected ? deselectAllFiles() : selectAllFiles()} />
              </div>
              <div>File Path</div>
              <div>Status</div>
              <div style={{ textAlign: 'center' }}>Actions</div>
            </div>

            {viewMode === 'flat' ? (
              files.map(file => (
                <FlatFileRow
                  key={file.relativePath}
                  file={file}
                  isSelected={selectedFiles.has(file.relativePath)}
                  isActive={activeFile?.relativePath === file.relativePath}
                  onToggle={() => toggleFileSelection(file.relativePath)}
                  onClick={() => handleFileClick(file)}
                  statusLabel={statusLabels[file.status]}
                />
              ))
            ) : (
              <TreeView files={files} onFileClick={handleFileClick} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FlatFileRow({ file, isSelected, isActive, onToggle, onClick, statusLabel }: {
  file: CompareItem; isSelected: boolean; isActive: boolean
  onToggle: () => void; onClick: () => void; statusLabel: string
}) {
  const parts = file.relativePath.split('/')
  const name = parts.pop()!
  const dir = parts.join('/') + '/'

  return (
    <div className={`file-row ${isActive ? 'file-row--active' : ''}`} onClick={onClick}>
      <div className="file-row__check" onClick={e => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
      </div>
      <div className="file-row__path">
        <span className="file-row__path-dir">{dir}</span>
        <span className="file-row__path-name">{name}</span>
      </div>
      <div>
        <span className={`status-badge status-badge--${file.status}`}>
          <span className="status-badge__dot" />
          {statusLabel}
        </span>
      </div>
      <div className="file-row__action">
        <button title="View diff">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  )
}

function TreeView({ files, onFileClick }: { files: CompareItem[]; onFileClick: (f: CompareItem) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Build tree
  const tree: Record<string, any> = {}
  files.forEach(file => {
    const parts = file.relativePath.split('/')
    let current = tree
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        if (!current.__files__) current.__files__ = []
        current.__files__.push(file)
      } else {
        if (!current[part]) current[part] = {}
        current = current[part]
      }
    })
  })

  const toggleFolder = (path: string) => {
    const next = new Set(collapsed)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setCollapsed(next)
  }

  const renderNode = (node: any, depth: number, pathPrefix: string): JSX.Element[] => {
    const elements: JSX.Element[] = []
    const folders = Object.keys(node).filter(k => k !== '__files__').sort()

    folders.forEach(folder => {
      const fullPath = pathPrefix + folder
      const isCollapsed = collapsed.has(fullPath)

      elements.push(
        <div key={fullPath} className="tree-node">
          <div className="tree-folder" style={{ paddingLeft: 8 + depth * 16 }} onClick={() => toggleFolder(fullPath)}>
            <svg className={`tree-folder__chevron ${!isCollapsed ? 'tree-folder__chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            <svg className="tree-folder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            {folder}
          </div>
          <div className={`tree-children ${isCollapsed ? 'tree-children--collapsed' : ''}`}>
            {renderNode(node[folder], depth + 1, fullPath + '/')}
          </div>
        </div>
      )
    })

    if (node.__files__) {
      node.__files__.forEach((file: CompareItem) => {
        const name = file.relativePath.split('/').pop()!
        elements.push(
          <div key={file.relativePath} className="file-row" style={{ paddingLeft: 8 + (depth) * 16 + 20 }} onClick={() => onFileClick(file)}>
            <div className="file-row__check" onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={useAppStore.getState().selectedFiles.has(file.relativePath)}
                onChange={() => useAppStore.getState().toggleFileSelection(file.relativePath)} />
            </div>
            <div className="file-row__path"><span className="file-row__path-name">{name}</span></div>
            <span className={`status-badge status-badge--${file.status}`}>
              <span className="status-badge__dot" />
              {file.status.replace('_', ' ').toUpperCase()}
            </span>
            <div />
          </div>
        )
      })
    }

    return elements
  }

  return <>{renderNode(tree, 0, '')}</>
}
