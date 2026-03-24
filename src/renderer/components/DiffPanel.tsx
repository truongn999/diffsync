import { useAppStore } from '../store/useAppStore'
import { useEffect, useState, useRef, useCallback } from 'react'
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

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'])

function isImageFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return IMAGE_EXTENSIONS.has(ext)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DiffPanel() {
  const { activeFile, isDiffLoading, p1Path, p2Path, theme, addToast, config, setCompareResult, setIsComparing } = useAppStore()
  const [p1Content, setP1Content] = useState('')
  const [p2Content, setP2Content] = useState('')
  const [isInline, setIsInline] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [p1ImageData, setP1ImageData] = useState<string | null>(null)
  const [p2ImageData, setP2ImageData] = useState<string | null>(null)
  const [copiedPath, setCopiedPath] = useState(false)

  const diffEditorRef = useRef<any>(null)

  const handleCopyFileName = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      setCopiedPath(true)
      setTimeout(() => setCopiedPath(false), 1500)
    } catch {
      addToast('Failed to copy file name', 'error')
    }
  }, [addToast])
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
      setP1ImageData(null)
      setP2ImageData(null)
      return
    }

    if (isImageFile(activeFile.relativePath)) {
      // Load binary images as base64
      const loadImages = async () => {
        const [img1, img2] = await Promise.all([
          activeFile.p1 && p1Path
            ? window.electronAPI.getFileBase64(p1Path, activeFile.relativePath)
            : Promise.resolve(''),
          activeFile.p2 && p2Path
            ? window.electronAPI.getFileBase64(p2Path, activeFile.relativePath)
            : Promise.resolve('')
        ])
        setP1ImageData(img1 || null)
        setP2ImageData(img2 || null)
      }
      loadImages()
    } else {
      setP1ImageData(null)
      setP2ImageData(null)
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
    }
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
          <div className="diff-panel__header__left">
            <button
              className="btn-copy-filename"
              onClick={() => handleCopyFileName(activeFile.relativePath)}
              title={copiedPath ? 'Copied!' : 'Copy file name'}
            >
              {copiedPath ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              )}
            </button>
            <span className="diff-panel__file-name">{activeFile.relativePath}</span>
          </div>
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
  const isBinary = isImageFile(activeFile.relativePath)

  return (
    <div className="diff-panel">
      <div className="diff-panel__header">
        <div className="diff-panel__header__left">
          <button
            className="btn-copy-filename"
            onClick={() => handleCopyFileName(activeFile.relativePath)}
            title={copiedPath ? 'Copied!' : 'Copy file name'}
          >
            {copiedPath ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            )}
          </button>
          <span className="diff-panel__file-name">{activeFile.relativePath}</span>
        </div>
        <div className="diff-panel__controls">
          <span className={`status-badge status-badge--${activeFile.status}`}>
            <span className="status-badge__dot" />
            {activeFile.status.replace('_', ' ').toUpperCase()}
          </span>
          {!isBinary && (
            <button
              className={`btn btn--xs ${isInline ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setIsInline(!isInline)}
              title={isInline ? 'Switch to side-by-side' : 'Switch to inline diff'}
            >
              {isInline ? '⇆ Side-by-side' : '≡ Inline'}
            </button>
          )}
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

      {isBinary ? (
        <div className="binary-preview">
          <div className="binary-preview__side">
            <div className="binary-preview__label">
              P1 {activeFile.p1 ? `(${formatBytes(activeFile.p1.size)})` : '—'}
            </div>
            {p1ImageData ? (
              <img src={p1ImageData} className="binary-preview__img" alt="P1" />
            ) : (
              <div className="binary-preview__empty">File not in P1</div>
            )}
          </div>
          <div className="binary-preview__side">
            <div className="binary-preview__label">
              P2 {activeFile.p2 ? `(${formatBytes(activeFile.p2.size)})` : '—'}
            </div>
            {p2ImageData ? (
              <img src={p2ImageData} className="binary-preview__img" alt="P2" />
            ) : (
              <div className="binary-preview__empty">File not in P2</div>
            )}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
