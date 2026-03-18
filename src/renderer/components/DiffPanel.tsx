import { useAppStore } from '../store/useAppStore'
import { useEffect, useState, useRef } from 'react'
import { DiffEditor } from '@monaco-editor/react'

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
  const { activeFile, isDiffLoading, p1Path, p2Path, theme } = useAppStore()
  const [p1Content, setP1Content] = useState('')
  const [p2Content, setP2Content] = useState('')
  const [isInline, setIsInline] = useState(false)

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
