import { useState, useRef } from 'react'
import { DiffEditor, Editor } from '@monaco-editor/react'
import { useAppStore } from '../store/useAppStore'
import { getLanguage } from '../utils/language'
import type { editor } from 'monaco-editor'

interface MergeEditorProps {
  relativePath: string
  p1Content: string
  p2Content: string
  onClose: () => void
  onMerged: () => void
}

export default function MergeEditor({ relativePath, p1Content, p2Content, onClose, onMerged }: MergeEditorProps) {
  const { p1Path, p2Path, addToast, theme } = useAppStore()
  const [mergedContent, setMergedContent] = useState(p1Content)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light'
  const language = getLanguage(relativePath)

  const handleAcceptP1 = () => {
    setMergedContent(p1Content)
    editorRef.current?.setValue(p1Content)
  }

  const handleAcceptP2 = () => {
    setMergedContent(p2Content)
    editorRef.current?.setValue(p2Content)
  }

  const handleReset = () => {
    setMergedContent(p1Content)
    editorRef.current?.setValue(p1Content)
  }

  const handleSave = async () => {
    if (!p1Path || !p2Path) return
    setIsSaving(true)
    try {
      const result = await window.electronAPI.saveMergedFile(p1Path, p2Path, relativePath, mergedContent)
      if (result.success) {
        addToast('Merge saved successfully', 'success')
        onMerged()
      } else {
        addToast(`Merge failed: ${result.error}`, 'error')
      }
    } catch (err) {
      addToast(`Merge failed: ${err}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="merge-editor">
      {/* Header */}
      <div className="merge-editor__header">
        <div className="merge-editor__header-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
            <path d="M6 21V9a9 9 0 009 9"/>
          </svg>
          <span className="merge-editor__title">Merge: {relativePath}</span>
        </div>
        <div className="merge-editor__header-right">
          <button className="btn btn--ghost btn--sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="spinner" style={{ width: 12, height: 12 }} />
                Saving...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Merge
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="merge-editor__body">
        {/* Left: Diff P1 vs P2 (read-only) */}
        <div className="merge-editor__panel">
          <div className="merge-editor__panel-header">
            <span className="merge-editor__panel-label">P1 vs P2</span>
            <span className="merge-editor__panel-badge merge-editor__panel-badge--readonly">Read Only</span>
          </div>
          <div className="merge-editor__panel-content">
            <DiffEditor
              original={p1Content}
              modified={p2Content}
              language={language}
              theme={monacoTheme}
              options={{
                readOnly: true,
                renderSideBySide: true,
                useInlineViewWhenSpaceIsLimited: true,
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                automaticLayout: true,
                renderOverviewRuler: false,
                originalEditable: false,
              }}
            />
          </div>
        </div>

        {/* Right: Merged result (editable) */}
        <div className="merge-editor__panel">
          <div className="merge-editor__panel-header">
            <span className="merge-editor__panel-label">Merged Result</span>
            <div className="merge-editor__panel-actions">
              <button
                className="btn btn--xs btn--ghost"
                onClick={handleAcceptP1}
                title="Replace with entire P1 content"
              >
                ← Accept All P1
              </button>
              <button
                className="btn btn--xs btn--ghost"
                onClick={handleAcceptP2}
                title="Replace with entire P2 content"
              >
                Accept All P2 →
              </button>
              <button
                className="btn btn--xs btn--ghost"
                onClick={handleReset}
                title="Reset to P1 content"
              >
                ↻ Reset
              </button>
            </div>
          </div>
          <div className="merge-editor__panel-content">
            <Editor
              value={mergedContent}
              language={language}
              theme={monacoTheme}
              onChange={(value) => setMergedContent(value || '')}
              onMount={(editor) => { editorRef.current = editor }}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
