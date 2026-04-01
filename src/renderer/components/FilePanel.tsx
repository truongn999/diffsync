import { useAppStore } from '../store/useAppStore'
import type { CompareItem } from '../../shared/types'
import FlatFileRow from './file-panel/FlatFileRow'
import TreeView from './file-panel/TreeView'

export default function FilePanel({ style }: { style?: React.CSSProperties }) {
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
    <div className="file-panel" style={style}>
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
          <div className="file-list__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            <h3>No comparison yet</h3>
            <p style={{ fontSize: 12 }}>Select two project folders and click Compare to see differences</p>
          </div>
        ) : (
          <>
            <div className="file-header">
              <div className="file-row__check">
                <input type="checkbox" checked={allSelected} onChange={() => allSelected ? deselectAllFiles() : selectAllFiles()} />
              </div>
              <div>File Path</div>
              <div>Status</div>
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
