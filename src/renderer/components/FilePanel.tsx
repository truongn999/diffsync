import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { CompareItem } from '../../shared/types'
import FlatFileRow from './file-panel/FlatFileRow'
import TreeView from './file-panel/TreeView'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'])
function isImageFile(path: string): boolean {
  return IMAGE_EXTENSIONS.has(path.split('.').pop()?.toLowerCase() || '')
}

export default function FilePanel({ style }: { style?: React.CSSProperties }) {
  const {
    compareResult, getFilteredFiles, searchQuery, setSearchQuery,
    viewMode, setViewMode, selectedFiles, toggleFileSelection,
    selectAllFiles, deselectAllFiles, activeFile, setActiveFile,
    setDiffResult, setIsDiffLoading, p1Path, p2Path, addToast,
    diffStatsCache, preloadCache, updatePreloadEntry
  } = useAppStore()

  const files = getFilteredFiles()
  const allSelected = files.length > 0 && files.every(f => selectedFiles.has(f.relativePath))
  const listRef = useRef<HTMLDivElement>(null)
  // Track which file we already loaded diff for (avoid duplicate loads)
  const loadedFileRef = useRef<string | null>(null)

  // ─── Load diff when activeFile changes (from click or keyboard) ───
  const loadDiffForFile = useCallback(async (file: CompareItem) => {
    if (!p1Path || !p2Path || file.status === 'same') {
      setDiffResult(null)
      return
    }
    // Check preload cache first
    const cached = preloadCache.get(file.relativePath)
    if (cached && !isImageFile(file.relativePath)) {
      // We have cached content — skip IPC, just set diff result with cached content
      // DiffPanel reads p1Content/p2Content directly, so we don't need DiffResult here
      // But we still need to signal that content is ready
      setDiffResult(null) // DiffPanel will use file content loading
    }
    setIsDiffLoading(true)
    try {
      const diff = await window.electronAPI.getDiff(p1Path, p2Path, file.relativePath)
      setDiffResult(diff)
    } catch (err) {
      addToast(`Failed to load diff: ${err}`, 'error')
    } finally {
      setIsDiffLoading(false)
    }
  }, [p1Path, p2Path, setDiffResult, setIsDiffLoading, addToast, preloadCache])

  // Auto-load diff when activeFile changes (keyboard navigation)
  useEffect(() => {
    if (!activeFile) {
      loadedFileRef.current = null
      return
    }
    if (loadedFileRef.current === activeFile.relativePath) return
    loadedFileRef.current = activeFile.relativePath
    loadDiffForFile(activeFile)
  }, [activeFile, loadDiffForFile])

  // ─── Auto-scroll active file into view ─────────
  useEffect(() => {
    if (!activeFile || !listRef.current) return
    const activeRow = listRef.current.querySelector(`[data-file-path="${CSS.escape(activeFile.relativePath)}"]`)
    if (activeRow) {
      activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeFile])

  // ─── Preload adjacent file contents (Sub-feature D) ─────────
  useEffect(() => {
    if (!activeFile || !p1Path || !p2Path) return
    const currentIndex = files.findIndex(f => f.relativePath === activeFile.relativePath)
    if (currentIndex === -1) return

    const toPreload: CompareItem[] = []
    // Preload next file
    if (currentIndex + 1 < files.length) toPreload.push(files[currentIndex + 1])
    // Preload prev file
    if (currentIndex - 1 >= 0) toPreload.push(files[currentIndex - 1])

    for (const file of toPreload) {
      // Skip if already cached, binary, or too large (> 500KB)
      if (preloadCache.has(file.relativePath)) continue
      if (isImageFile(file.relativePath)) continue
      const maxSize = 500 * 1024
      if ((file.p1 && file.p1.size > maxSize) || (file.p2 && file.p2.size > maxSize)) continue

      // Fire-and-forget preload
      ;(async () => {
        try {
          const [c1, c2] = await Promise.all([
            file.p1 ? window.electronAPI.getFileContent(p1Path, file.relativePath) : Promise.resolve(''),
            file.p2 ? window.electronAPI.getFileContent(p2Path, file.relativePath) : Promise.resolve('')
          ])
          updatePreloadEntry(file.relativePath, { p1Content: c1, p2Content: c2 })
        } catch {
          // Silently ignore preload failures
        }
      })()
    }
  }, [activeFile, files, p1Path, p2Path, preloadCache, updatePreloadEntry])

  const handleFileClick = (file: CompareItem) => {
    loadedFileRef.current = file.relativePath
    setActiveFile(file)
    loadDiffForFile(file)
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

      <div className="file-list" ref={listRef}>
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
              <div>Changes</div>
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
                  diffStats={diffStatsCache.get(file.relativePath)}
                />
              ))
            ) : (
              <TreeView files={files} onFileClick={handleFileClick} diffStatsCache={diffStatsCache} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
