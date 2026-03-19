import { useAppStore } from '../store/useAppStore'
import { useEffect, useState, useRef } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { ResolveAction } from '../../shared/types'

// Map file extensions to Monaco language IDs
function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', htm: 'html',
    css: 'css', scss: 'scss', less: 'less',
    md: 'markdown', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', svg: 'xml',
    py: 'python', rb: 'ruby', go: 'go',
    rs: 'rust', java: 'java', kt: 'kotlin',
    sh: 'shell', bash: 'shell',
    sql: 'sql', graphql: 'graphql',
    dockerfile: 'dockerfile',
    txt: 'plaintext'
  }
  return map[ext] || 'plaintext'
}

export default function DiffPanel() {
  const { activeFile, isDiffLoading, p1Path, p2Path, theme, addToast, config, setCompareResult, setIsComparing } = useAppStore()
  const [p1Content, setP1Content] = useState('')
  const [p2Content, setP2Content] = useState('')
  const [isInline, setIsInline] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  const diffEditorRef = useRef<any>(null)
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light'

  useEffect(() => {
    if (diffEditorRef.current) {
      diffEditorRef.current.updateOptions({ renderSideBySide: !isInline })
    }
  }, [isInline])

  // Load raw file content when active file changes
  useEffect(() => {
    if (!activeFile || activeFile.status === 'same') {
      setP1Content('')
      setP2Content('')
      return
    }

    const loadContent = async () => {
      const [c1, c2] = await Promise.all([
        activeFile.p1 && p1Path
          ? window.electronAPI.getFileContent(p1Path, activeFile.relativePath)
          : Promise.resolve(''),
        activeFile.p2 && p2Path
          ? window.electronAPI.getFileContent(p2Path, activeFile.relativePath)
          : Promise.resolve('')
      ])
      setP1Content(c1)
      setP2Content(c2)
    }

    loadContent()
  }, [activeFile, p1Path, p2Path])

  const handleResolve = async (action: ResolveAction) => {
    if (!activeFile || !p1Path || !p2Path) return
    setIsResolving(true)
    try {
      await window.electronAPI.resolveConflict(p1Path, p2Path, activeFile.relativePath, action)
      const labels = { keep_p1: 'Kept P1', keep_p2: 'Kept P2', mark_resolved: 'Marked resolved' }
      addToast(`Conflict resolved: ${labels[action]}`, 'success')
      // Re-compare to refresh file list
      setIsComparing(true)
      const result = await window.electronAPI.compareProjects(p1Path, p2Path, config)
      setCompareResult(result)
    } catch (err) {
      addToast(`Resolve failed: ${err}`, 'error')
    } finally {
      setIsResolving(false)
      setIsComparing(false)
    }
  }

  if (!activeFile) {
    return (
      <div className="diff-panel">
        <div className="file-list__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>
          </svg>
          <h3>Select a file to view diff</h3>
          <p style={{ fontSize: 12 }}>Click on any modified file in the list to see a side-by-side comparison</p>
        </div>
      </div>
    )
  }

  if (isDiffLoading) {
    return (
      <div className="diff-panel">
        <div className="diff-panel__placeholder">
          <span className="spinner" style={{ width: 24, height: 24 }} />
          <p>Loading diff...</p>
        </div>
      </div>
    )
  }

  if (activeFile.status === 'same') {
    return (
      <div className="diff-panel">
        <div className="diff-panel__header">
          <span className="diff-panel__file-name">{activeFile.relativePath}</span>
          <span className="status-badge status-badge--same"><span className="status-badge__dot" /> SAME</span>
        </div>
        <div className="diff-panel__placeholder">
          <p>File is identical in both projects</p>
        </div>
      </div>
    )
  }

  const language = getLanguage(activeFile.relativePath)
  const isConflict = activeFile.status === 'conflict'

  return (
    <div className="diff-panel">
      <div className="diff-panel__header">
        <span className="diff-panel__file-name">{activeFile.relativePath}</span>
        <div className="diff-panel__controls">
          <span className={`status-badge status-badge--${activeFile.status}`}>
            <span className="status-badge__dot" />
            {activeFile.status.replace('_', ' ').toUpperCase()}
          </span>
          <button
            className={`btn btn--xs ${isInline ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setIsInline(!isInline)}
            title={isInline ? 'Switch to side-by-side' : 'Switch to inline diff'}
          >
            {isInline ? '⇆ Side-by-side' : '≡ Inline'}
          </button>
        </div>
      </div>

      {isConflict && (
        <div className="resolve-bar">
          <div className="resolve-bar__label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Both sides changed — resolve conflict:
          </div>
          <div className="resolve-bar__actions">
            <button className="btn btn--xs btn--primary" onClick={() => handleResolve('keep_p1')} disabled={isResolving}>
              Keep P1
            </button>
            <button className="btn btn--xs btn--primary" onClick={() => handleResolve('keep_p2')} disabled={isResolving}>
              Keep P2
            </button>
            <button className="btn btn--xs btn--ghost" onClick={() => handleResolve('mark_resolved')} disabled={isResolving}>
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      <div className="diff-panel__monaco">
        <DiffEditor
          key={`diff-${isInline ? 'inline' : 'sbs'}-${theme}`}
          original={p1Content}
          modified={p2Content}
          language={language}
          theme={monacoTheme}
          onMount={(editor) => { diffEditorRef.current = editor }}
          options={{
            readOnly: true,
            renderSideBySide: !isInline,
            useInlineViewWhenSpaceIsLimited: false,
            minimap: { enabled: !isInline },
            fontSize: 12,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            automaticLayout: true,
            renderOverviewRuler: true,
            diffWordWrap: 'off',
            originalEditable: false,
          }}
        />
      </div>
    </div>
  )
}
