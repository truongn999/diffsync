import { useAppStore } from '../store/useAppStore'
import { useRef, useEffect } from 'react'

export default function DiffPanel() {
  const { activeFile, diffResult, isDiffLoading } = useAppStore()
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  // Synchronized scrolling
  useEffect(() => {
    const left = leftRef.current
    const right = rightRef.current
    if (!left || !right) return

    let syncing = false
    const syncLeft = () => {
      if (syncing) { syncing = false; return }
      syncing = true
      right.scrollTop = left.scrollTop
      right.scrollLeft = left.scrollLeft
    }
    const syncRight = () => {
      if (syncing) { syncing = false; return }
      syncing = true
      left.scrollTop = right.scrollTop
      left.scrollLeft = right.scrollLeft
    }

    left.addEventListener('scroll', syncLeft)
    right.addEventListener('scroll', syncRight)
    return () => {
      left.removeEventListener('scroll', syncLeft)
      right.removeEventListener('scroll', syncRight)
    }
  }, [diffResult])

  if (!activeFile) {
    return (
      <div className="diff-panel">
        <div className="diff-panel__placeholder">
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

  return (
    <div className="diff-panel">
      <div className="diff-panel__header">
        <span className="diff-panel__file-name">{activeFile.relativePath}</span>
        <span className={`status-badge status-badge--${activeFile.status}`}>
          <span className="status-badge__dot" />
          {activeFile.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {diffResult ? (
        <div className="diff-container">
          <div className="diff-side" ref={leftRef}>
            <div className="diff-side__header">P1 (Source) — {activeFile.p1?.relativePath || 'N/A'}</div>
            {diffResult.p1Lines.map((line, i) => (
              <div key={i} className={`diff-line diff-line--${line.type}`}>
                <span className="diff-line__num">{line.num || ''}</span>
                <span className="diff-line__content">{line.content}</span>
              </div>
            ))}
          </div>
          <div className="diff-side" ref={rightRef}>
            <div className="diff-side__header">P2 (Target) — {activeFile.p2?.relativePath || 'N/A'}</div>
            {diffResult.p2Lines.map((line, i) => (
              <div key={i} className={`diff-line diff-line--${line.type}`}>
                <span className="diff-line__num">{line.num || ''}</span>
                <span className="diff-line__content">{line.content}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="diff-panel__placeholder">
          <p>No diff available</p>
        </div>
      )}
    </div>
  )
}
